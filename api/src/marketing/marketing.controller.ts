import { Body, Controller, Post } from "@nestjs/common";
import { IsEmail, IsObject, IsOptional, IsString } from "class-validator";
import { Public } from "../auth/auth.module";

class RegisterProfileDto {
  @IsEmail() email!: string;
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsObject() properties?: Record<string, unknown>;
}

class TrackEventDto {
  @IsEmail() email!: string;
  @IsString() event!: string;
  @IsOptional() @IsObject() properties?: Record<string, unknown>;
}

@Controller("marketing/klaviyo")
export class MarketingController {
  @Public()
  @Post("register-profile")
  async register(@Body() body: RegisterProfileDto) {
    const key = process.env.KLAVIYO_API_KEY;
    if (!key) return { ok: false, skipped: true };
    const r = await fetch(
      "https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/",
      {
        method: "POST",
        headers: {
          Authorization: `Klaviyo-API-Key ${key}`,
          revision: "2024-10-15",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            type: "profile-subscription-bulk-create-job",
            attributes: {
              profiles: {
                data: [
                  {
                    type: "profile",
                    attributes: {
                      email: body.email,
                      ...(body.firstName
                        ? { first_name: body.firstName }
                        : {}),
                      properties: body.properties ?? {},
                    },
                  },
                ],
              },
            },
          },
        }),
      },
    );
    return { ok: r.ok, status: r.status };
  }

  @Public()
  @Post("track-event")
  async track(@Body() body: TrackEventDto) {
    const key = process.env.KLAVIYO_API_KEY;
    if (!key) return { ok: false, skipped: true };
    const r = await fetch("https://a.klaviyo.com/api/events/", {
      method: "POST",
      headers: {
        Authorization: `Klaviyo-API-Key ${key}`,
        revision: "2024-10-15",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          type: "event",
          attributes: {
            metric: { data: { type: "metric", attributes: { name: body.event } } },
            profile: {
              data: {
                type: "profile",
                attributes: { email: body.email },
              },
            },
            properties: body.properties ?? {},
          },
        },
      }),
    });
    return { ok: r.ok, status: r.status };
  }
}
