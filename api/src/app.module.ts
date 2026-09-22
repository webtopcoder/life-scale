import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { AuthController } from "./auth/auth.controller";
import { FunnelController } from "./funnel/funnel.controller";
import { OnboardingController } from "./onboarding/onboarding.controller";
import { ClaimController } from "./claim/claim.controller";
import { DashboardController } from "./dashboard/dashboard.controller";
import { BillingService } from "./billing/billing.service";
import { BillingController } from "./billing/billing.controller";
import { HandoffController } from "./billing/handoff.controller";
import { HandoffService } from "./billing/handoff.service";
import { AiController } from "./ai/ai.controller";
import { PartnerController } from "./partner/partner.controller";
import { PartnerOtpService } from "./partner/partner-otp.service";
import { MarketingController } from "./marketing/marketing.controller";
import { SupportController } from "./support/support.controller";
import { AffiliatesController } from "./affiliates/affiliates.controller";
import { HealthController } from "./health.controller";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule],
  controllers: [
    HealthController,
    AuthController,
    FunnelController,
    OnboardingController,
    ClaimController,
    DashboardController,
    BillingController,
    HandoffController,
    AiController,
    PartnerController,
    MarketingController,
    SupportController,
    AffiliatesController,
  ],
  providers: [BillingService, HandoffService, PartnerOtpService],
})
export class AppModule {}
