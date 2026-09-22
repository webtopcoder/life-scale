import { Body, Controller, Headers, Post, Req } from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";
import { CurrentUser, type AuthUser } from "./auth.module";
import { PrismaService } from "../prisma/prisma.module";
import { upsertProfile } from "../prisma/upsert-profile";

class RecordLoginDto {
  @IsOptional()
  @IsString()
  timezone?: string;
}

@Controller("auth")
export class AuthController {
  constructor(private prisma: PrismaService) {}

  @Post("record-login-ip")
  async recordLoginIp(
    @CurrentUser() user: AuthUser,
    @Body() body: RecordLoginDto,
    @Headers("x-forwarded-for") xff?: string,
    @Req() req?: { ip?: string },
  ) {
    const ip =
      xff?.split(",")[0]?.trim() ||
      req?.ip ||
      null;
    const now = new Date();
    await upsertProfile(this.prisma, user.sub, {
      create: {
        displayName: user.email?.split("@")[0] ?? null,
        lastIp: ip,
        lastIpAt: now,
        lastIpSource: "record-login-ip",
        timezone: body.timezone ?? null,
        timezoneAt: body.timezone ? now : null,
        timezoneSource: body.timezone ? "browser" : null,
      },
      update: {
        lastIp: ip,
        lastIpAt: now,
        lastIpSource: "record-login-ip",
        ...(body.timezone
          ? {
              timezone: body.timezone,
              timezoneAt: now,
              timezoneSource: "browser",
            }
          : {}),
      },
    });
    return { ok: true };
  }

  @Post("ensure-profile")
  async ensureProfile(@CurrentUser() user: AuthUser) {
    return upsertProfile(this.prisma, user.sub, {
      create: {
        displayName: user.email?.split("@")[0] ?? null,
      },
    });
  }
}
