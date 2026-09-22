import {
  Body,
  Controller,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import type { Request, Response } from "express";
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { Public, type AuthUser } from "../auth/auth.module";
import { PrismaService } from "../prisma/prisma.module";
import { buildPolicySupportSystemPrompt } from "./policy-knowledge-base";
import { randomUUID } from "crypto";

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 2000;
const CANCELLATION_REPLY =
  "Cancellation must be completed on the cancellation page: [Cancel your subscription](/help?section=cancel)";
const REFUND_REPLY =
  "Refund requests must be submitted on the contact page: [Request a refund](/help?section=contact&subject=Refund)";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class SupportTicketDto {
  @IsString() name!: string;
  @IsEmail() email!: string;
  @IsString() subject!: string;
  @IsString() message!: string;
  @IsOptional() @IsString() billingAmount?: string;
  @IsOptional() @IsString() billingDate?: string;
}

class ChatMessageDto {
  @IsString() role!: string;
  @IsString() content!: string;
}

class SupportChatDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[];

  @IsOptional() @IsString() conversationId?: string;
  @IsOptional() @IsString() pagePath?: string;
  @IsOptional() @IsBoolean() persistOnly?: boolean;
}

type ChatMessage = { role: string; content: string };

@Controller("support")
export class SupportController {
  constructor(private prisma: PrismaService) {}

  private openRouterKey() {
    const k = process.env.OPENROUTER_API_KEY;
    if (!k) throw new Error("OPENROUTER_API_KEY not configured");
    return k;
  }

  private sanitizeMessages(raw: ChatMessageDto[] | undefined): ChatMessage[] {
    if (!Array.isArray(raw)) return [];
    const cleaned: ChatMessage[] = [];
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      if (item.role !== "user" && item.role !== "assistant") continue;
      if (typeof item.content !== "string") continue;
      const trimmed = item.content.trim().slice(0, MAX_CONTENT_LENGTH);
      if (!trimmed) continue;
      cleaned.push({ role: item.role, content: trimmed });
    }
    return cleaned.slice(-MAX_MESSAGES);
  }

  private isCancellationRequest(message: string): boolean {
    const normalized = message.toLowerCase();
    const cancellationTerms =
      /\b(cancel|cancellation|unsubscribe|stop billing|end (?:my|the) subscription)\b/;
    const requestTerms =
      /\b(i want|i need|please|how (?:do|can) i|help me|want to|need to|trying to|can you)\b/;
    return cancellationTerms.test(normalized) && requestTerms.test(normalized);
  }

  private isRefundRequest(message: string): boolean {
    const normalized = message.toLowerCase();
    const refundTerms =
      /\b(refund|money back|chargeback|reimburse(?:ment)?)\b/;
    const requestTerms =
      /\b(i want|i need|please|how (?:do|can) i|help me|want to|need to|trying to|can you|get|request)\b/;
    return refundTerms.test(normalized) && requestTerms.test(normalized);
  }

  private async persistConversation(params: {
    conversationId: string;
    userId: string | null;
    pagePath: string | null;
    messages: ChatMessage[];
  }) {
    try {
      await this.prisma.supportChatConversation.upsert({
        where: { id: params.conversationId },
        create: {
          id: params.conversationId,
          userId: params.userId,
          pagePath: params.pagePath,
          messagesJson: params.messages.slice(-MAX_MESSAGES),
        },
        update: {
          ...(params.userId ? { userId: params.userId } : {}),
          pagePath: params.pagePath,
          messagesJson: params.messages.slice(-MAX_MESSAGES),
        },
      });
    } catch (err) {
      console.error("[support/chat] persist failed", err);
    }
  }

  private writeSseText(res: Response, content: string) {
    const payload = JSON.stringify({ choices: [{ delta: { content } }] });
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.write(`data: ${payload}\n\ndata: [DONE]\n\n`);
    res.end();
  }

  @Public()
  @Post("tickets")
  async create(@Body() body: SupportTicketDto) {
    let zendeskTicketId: string | null = null;
    const subdomain = process.env.ZENDESK_SUBDOMAIN;
    const zdEmail = process.env.ZENDESK_API_EMAIL;
    const zdToken = process.env.ZENDESK_API_TOKEN;
    if (subdomain && zdEmail && zdToken) {
      try {
        const auth = Buffer.from(`${zdEmail}/token:${zdToken}`).toString(
          "base64",
        );
        const r = await fetch(
          `https://${subdomain}.zendesk.com/api/v2/tickets.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ticket: {
                subject: body.subject,
                comment: { body: body.message },
                requester: { name: body.name, email: body.email },
                tags: ["brainwave"],
              },
            }),
          },
        );
        const json = (await r.json()) as { ticket?: { id?: number } };
        if (json.ticket?.id) zendeskTicketId = String(json.ticket.id);
      } catch (err) {
        console.warn("[support] zendesk failed", err);
      }
    }

    return this.prisma.supportTicket.create({
      data: {
        name: body.name,
        email: body.email,
        subject: body.subject,
        message: body.message,
        billingAmount: body.billingAmount,
        billingDate: body.billingDate,
        zendeskTicketId,
      },
    });
  }

  @Public()
  @Post("chat")
  async chat(
    @Body() body: SupportChatDto,
    @Req() req: Request & { user?: AuthUser },
    @Res() res: Response,
  ) {
    const messages = this.sanitizeMessages(body.messages);
    console.log("messages", messages);
    const rawId =
      typeof body.conversationId === "string" ? body.conversationId : "";
    const conversationId = UUID_RE.test(rawId) ? rawId : randomUUID();
    const pagePath =
      typeof body.pagePath === "string" ? body.pagePath.slice(0, 500) : null;
    const userId = req.user?.sub ?? null;

    if (body.persistOnly === true) {
      if (messages.length > 0) {
        await this.persistConversation({
          conversationId,
          userId,
          pagePath,
          messages,
        });
      }
      res.status(200).json({ ok: true });
      return;
    }

    if (messages.length === 0) {
      res.status(400).json({ error: "At least one message is required" });
      return;
    }
    if (messages[messages.length - 1]?.role !== "user") {
      res.status(400).json({ error: "Last message must be from the user" });
      return;
    }

    const latestUserMessage = messages[messages.length - 1]?.content ?? "";
    if (this.isCancellationRequest(latestUserMessage)) {
      const finalMessages = [
        ...messages,
        { role: "assistant", content: CANCELLATION_REPLY },
      ];
      await this.persistConversation({
        conversationId,
        userId,
        pagePath,
        messages: finalMessages,
      });
      this.writeSseText(res, CANCELLATION_REPLY);
      return;
    }
    if (this.isRefundRequest(latestUserMessage)) {
      const finalMessages = [
        ...messages,
        { role: "assistant", content: REFUND_REPLY },
      ];
      await this.persistConversation({
        conversationId,
        userId,
        pagePath,
        messages: finalMessages,
      });
      this.writeSseText(res, REFUND_REPLY);
      return;
    }

    let openRouterKey: string;
    try {
      openRouterKey = this.openRouterKey();
    } catch {
      res.status(500).json({ error: "AI service unavailable" });
      return;
    }

    const aiResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          stream: true,
          messages: [
            { role: "system", content: buildPolicySupportSystemPrompt() },
            ...messages,
          ],
        }),
      },
    );

    if (!aiResponse.ok || !aiResponse.body) {
      const status = aiResponse.status;
      if (status === 429) {
        res
          .status(429)
          .json({ error: "Rate limit exceeded. Please try again in a moment." });
        return;
      }
      if (status === 401 || status === 402 || status === 403) {
        res.status(402).json({ error: "AI service temporarily unavailable." });
        return;
      }
      const t = await aiResponse.text().catch(() => "");
      console.error("[support/chat] OpenRouter error:", status, t);
      res.status(500).json({ error: "AI service unavailable" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = aiResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let assistant = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);

        buffer += chunk;
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, idx).replace(/\r$/, "");
          buffer = buffer.slice(idx + 1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === "string") assistant += delta;
          } catch {
            // ignore partial JSON
          }
        }
      }
    } catch (err) {
      console.error("[support/chat] stream error", err);
    }

    const finalMessages = assistant
      ? [
          ...messages,
          {
            role: "assistant",
            content: assistant.slice(0, MAX_CONTENT_LENGTH * 4),
          },
        ]
      : messages;
    await this.persistConversation({
      conversationId,
      userId,
      pagePath,
      messages: finalMessages,
    });

    res.end();
  }
}
