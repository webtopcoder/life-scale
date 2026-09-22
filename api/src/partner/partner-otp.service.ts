import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.module";

/** How long after verify the same OTP may be reused for gated endpoints. */
export const PARTNER_OTP_POST_VERIFY_TTL_MS = 10 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_SENDS_PER_HOUR = 3;
const MAX_VERIFY_ATTEMPTS = 3;

@Injectable()
export class PartnerOtpService {
  constructor(private prisma: PrismaService) {}

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  isNonProduction(): boolean {
    return process.env.NODE_ENV !== "production";
  }

  async sendOtp(
    email: string,
    opts?: { subject?: string },
  ): Promise<{ otp: string }> {
    const normalized = this.normalizeEmail(email);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await this.prisma.cancelOtp.count({
      where: { email: normalized, createdAt: { gte: oneHourAgo } },
    });
    if (recentCount >= MAX_SENDS_PER_HOUR) {
      throw new HttpException(
        "Too many requests. Please try again later.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await this.prisma.cancelOtp.create({
      data: {
        email: normalized,
        otpCode: otp,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    await this.sendOtpEmail(normalized, otp, opts?.subject);

    return { otp };
  }

  async verifyOtp(email: string, otp: string): Promise<void> {
    const normalized = this.normalizeEmail(email);
    const code = otp.trim();
    if (!code) {
      throw new BadRequestException("OTP code is required");
    }

    const row = await this.prisma.cancelOtp.findFirst({
      where: {
        email: normalized,
        otpCode: code,
        verified: false,
        expiresAt: { gte: new Date() },
        attempts: { lt: MAX_VERIFY_ATTEMPTS },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!row) {
      const latest = await this.prisma.cancelOtp.findFirst({
        where: { email: normalized, verified: false },
        orderBy: { createdAt: "desc" },
      });
      if (latest) {
        await this.prisma.cancelOtp.update({
          where: { id: latest.id },
          data: { attempts: { increment: 1 } },
        });
      }
      throw new BadRequestException({
        valid: false,
        error: "Invalid or expired verification code",
      });
    }

    await this.prisma.cancelOtp.update({
      where: { id: row.id },
      data: { verified: true, verifiedAt: new Date() },
    });
  }

  /**
   * True if this email+OTP was verified and verified_at is within the post-verify TTL.
   * Does not mutate the row.
   */
  async assertVerifiedOtpWithinWindow(
    email: string,
    otp: string | undefined,
  ): Promise<void> {
    if (!otp || typeof otp !== "string" || !otp.trim()) {
      throw new BadRequestException("Verified OTP is required");
    }
    const normalized = this.normalizeEmail(email);
    const windowStart = new Date(Date.now() - PARTNER_OTP_POST_VERIFY_TTL_MS);
    const row = await this.prisma.cancelOtp.findFirst({
      where: {
        email: normalized,
        otpCode: otp.trim(),
        verified: true,
        verifiedAt: { not: null, gte: windowStart },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!row) {
      throw new ForbiddenException(
        "MFA verification required. Please verify your OTP first.",
      );
    }
  }

  private async sendOtpEmail(
    to: string,
    otp: string,
    subject = "Your verification code",
  ): Promise<void> {
    const apiKey = process.env.SENDGRID_API_KEY;
    const from = process.env.SENDGRID_FROM_EMAIL;
    if (!apiKey || !from) {
      if (this.isNonProduction()) {
        console.warn(
          "[partner-otp] SendGrid not configured; OTP generated for non-production only",
        );
        return;
      }
      throw new BadRequestException("Failed to send verification email");
    }

    try {
      const sgMail = await import("@sendgrid/mail");
      sgMail.default.setApiKey(apiKey);
      await sgMail.default.send({
        to,
        from,
        subject,
        text:
          `Your verification code is: ${otp}\n\n` +
          "It expires in 10 minutes. If you did not request this code, you can ignore this email.",
        html:
          `<p>Your verification code is: <strong>${otp}</strong></p>` +
          "<p>It expires in 10 minutes. If you did not request this code, you can ignore this email.</p>",
      });
    } catch (err) {
      console.error("[partner-otp] SendGrid failed", err);
      throw new BadRequestException("Failed to send verification email");
    }
  }
}
