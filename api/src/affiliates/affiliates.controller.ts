import { Body, Controller, Post } from "@nestjs/common";
import { IsEmail, IsOptional, IsString } from "class-validator";
import { Public } from "../auth/auth.module";
import { PrismaService } from "../prisma/prisma.module";

class AffiliateDto {
  @IsString() fullName!: string;
  @IsEmail() email!: string;
  @IsString() businessName!: string;
  @IsString() trafficSource!: string;
  @IsOptional() @IsString() websiteUrl?: string;
  @IsOptional() @IsString() comment?: string;
}

@Controller("affiliates")
export class AffiliatesController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Post("applications")
  async apply(@Body() body: AffiliateDto) {
    return this.prisma.affiliateApplication.create({
      data: {
        fullName: body.fullName,
        email: body.email,
        businessName: body.businessName,
        trafficSource: body.trafficSource,
        websiteUrl: body.websiteUrl,
        comment: body.comment,
      },
    });
  }
}
