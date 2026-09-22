import { Prisma } from "../generated/prisma/client";
import type { PrismaService } from "./prisma.module";

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/** Upsert profile; on concurrent-create races, apply update or re-read. */
export async function upsertProfile(
  prisma: PrismaService,
  userId: string,
  args: {
    create?: Omit<Prisma.ProfileCreateInput, "userId" | "id">;
    update?: Prisma.ProfileUpdateInput;
  } = {},
) {
  const update = args.update ?? {};
  try {
    return await prisma.profile.upsert({
      where: { userId },
      create: { userId, ...args.create },
      update,
    });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    if (Object.keys(update).length > 0) {
      return prisma.profile.update({
        where: { userId },
        data: update,
      });
    }
    return prisma.profile.findUniqueOrThrow({ where: { userId } });
  }
}
