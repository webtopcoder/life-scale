import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Send, User, Menu } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { api } from "@/integrations/api/client";
import { useAuth } from "@/context/AuthContext";
import { ConversationList, ConversationItem } from "./brain-coach/ConversationList";
import { ChatWelcome } from "./brain-coach/ChatWelcome";
import { TypingIndicator } from "./brain-coach/TypingIndicator";
import { AnimatedBotAvatar } from "./brain-coach/AnimatedBotAvatar";

type Msg = { role: "user" | "assistant"; content: string };

export function BrainCoachChat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load conversation list
  useEffect(() => {
    if (!user) return;
    api.get<any[]>("/dashboard/coach/conversations").then((data) => {
      setConversations(
        data.map((c) => ({
          id: c.id,
          title: c.title ?? "New Chat",
          updated_at: c.updatedAt ?? c.updated_at,
        })),
      );
      if (data.length > 0 && !activeId) {
        selectConversation(data[0].id);
      }
    });
  }, [user]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, scrollToBottom]);

  const selectConversation = async (id: string) => {
    setActiveId(id);
    setSidebarOpen(false);
    const data = await api.get<{ messagesJson: Msg[] }>(`/dashboard/coach/conversations/${id}`);
    if (data?.messagesJson) {
      setMessages(Array.isArray(data.messagesJson) ? data.messagesJson : []);
    }
  };

  const startNewChat = () => {
    setActiveId(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  const deleteConversation = async (id: string) => {
    await api.delete(`/dashboard/coach/conversations/${id}`);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) startNewChat();
  };

  const saveConversation = useCallback(async (msgs: Msg[], convId: string | null): Promise<string | null> => {
    if (!user) return null;
    const title = msgs.find(m => m.role === "user")?.content.slice(0, 40) || "New Chat";
    if (convId) {
      await api.patch(`/dashboard/coach/conversations/${convId}`, {
        messagesJson: msgs,
        title,
      });
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, title, updated_at: new Date().toISOString() } : c));
      return convId;
    } else {
      const data = await api.post<{ id: string }>("/dashboard/coach/conversations", {
        messagesJson: msgs,
        title,
      });
      if (data?.id) {
        setActiveId(data.id);
        setConversations(prev => [{ id: data.id, title, updated_at: new Date().toISOString() }, ...prev]);
        return data.id;
      }
      return null;
    }
  }, [user]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !user) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setIsStreaming(true);

    try {
      const resp = await api.streamPost("/ai/coach/chat", { messages: newMessages });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Failed to get response");
      }

      if (!resp.body) throw new Error("No response body");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
        scrollToBottom();
      };

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      setIsStreaming(false);
      const finalMessages: Msg[] = [...newMessages, { role: "assistant", content: assistantSoFar }];
      setMessages(finalMessages);
      await saveConversation(finalMessages, activeId);
    } catch (e: any) {
      console.error("Brain Coach error:", e);
      const errMsg: Msg = { role: "assistant", content: `Sorry, something went wrong: ${e.message}` };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  return (
    <Card className="flex flex-col md:flex-row h-[calc(100dvh-7rem)] md:h-[600px] md:max-h-[80vh] overflow-hidden relative">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - conversation list */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-card border-r border-border
        transition-transform duration-200
        md:relative md:inset-auto md:z-auto md:translate-x-0 md:shrink-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={selectConversation}
          onNew={startNewChat}
          onDelete={deleteConversation}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        {/* Chat header - mobile */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0 md:hidden">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-foreground truncate">
            {activeId ? conversations.find(c => c.id === activeId)?.title || "Chat" : "New Chat"}
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 min-h-0">
          {messages.length === 0 ? (
            <ChatWelcome onChipClick={(text) => sendMessage(text)} />
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i} className={`flex items-start gap-2 md:gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <AnimatedBotAvatar isStreaming={isStreaming && i === messages.length - 1} />
                  )}
                  <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-3 py-2.5 md:px-4 md:py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md whitespace-pre-wrap"
                      : "bg-muted text-foreground rounded-bl-md prose prose-sm prose-neutral dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                  }`}>
                    {msg.role === "assistant" ? (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-2 md:gap-3">
                  <AnimatedBotAvatar isStreaming />
                  <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2.5 md:px-4 md:py-3">
                    <TypingIndicator />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-3 md:p-4 shrink-0">
          <form
            onSubmit={e => { e.preventDefault(); sendMessage(input); }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask your Brain Coach..."
              className="flex-1 rounded-xl border border-input bg-background px-3 py-2 md:px-4 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="rounded-xl h-9 w-9 md:h-10 md:w-10">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
}
