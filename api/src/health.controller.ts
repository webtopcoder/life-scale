import { Controller, Get } from "@nestjs/common";
import { Public } from "./auth/auth.module";

@Controller()
export class HealthController {
  @Public()
  @Get("health")
  health() {
    return { ok: true, service: "brainwave-api" };
  }
}
