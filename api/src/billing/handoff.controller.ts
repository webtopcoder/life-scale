import { Body, Controller, Post, Req } from "@nestjs/common";
import { IsEmail, IsString, Length } from "class-validator";
import type { Request } from "express";
import { Public } from "../auth/auth.module";
import { HandoffService } from "./handoff.service";

class CreateHandoffDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(1, 200)
  offerId!: string;

  @IsString()
  @Length(1, 200)
  funnelSessionId!: string;
}

class ExchangeHandoffDto {
  @IsString()
  @Length(64, 64)
  handoffSecret!: string;
}

function requestIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return first?.split(",")[0]?.trim() || req.ip || "unknown";
}

@Public()
@Controller("billing/handoff")
export class HandoffController {
  constructor(private handoff: HandoffService) {}

  @Post("create")
  create(@Req() req: Request, @Body() body: CreateHandoffDto) {
    return this.handoff.create({ ...body, ip: requestIp(req) });
  }

  @Post("exchange")
  exchange(@Req() req: Request, @Body() body: ExchangeHandoffDto) {
    return this.handoff.exchange({ ...body, ip: requestIp(req) });
  }
}