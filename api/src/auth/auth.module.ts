import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  Module,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common";
import { APP_GUARD, Reflector } from "@nestjs/core";
import * as jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

export type AuthUser = {
  sub: string;
  email?: string;
  token: string;
};

function looksLikeEmail(value: unknown): value is string {
  return typeof value === "string" && value.includes("@") && value.length > 3;
}

/** Cognito access tokens often omit `email`; fall back to username claims. */
function emailFromJwt(payload: jwt.JwtPayload): string | undefined {
  if (looksLikeEmail(payload.email)) return payload.email;
  if (looksLikeEmail(payload["cognito:username"])) {
    return payload["cognito:username"] as string;
  }
  if (looksLikeEmail(payload.username)) return payload.username as string;
  return undefined;
}

export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!req.user) throw new UnauthorizedException();
    return req.user;
  },
);

@Injectable()
export class CognitoAuthGuard implements CanActivate {
  private client = jwksClient({
    jwksUri: `https://cognito-idp.${process.env.COGNITO_REGION || "us-east-1"}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
    cache: true,
  });

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const req = context.switchToHttp().getRequest();

    // Public routes stay open, but attach a user when a valid Bearer token is present
    // (e.g. policy support chat linking conversations to Cognito sub).
    if (isPublic) {
      await this.tryAttachUser(req);
      return true;
    }

    // Local/dev bypass when Cognito is not configured
    if (!process.env.COGNITO_USER_POOL_ID) {
      const auth = req.headers.authorization as string | undefined;
      if (auth?.startsWith("Bearer dev:")) {
        const sub = auth.slice("Bearer dev:".length);
        req.user = { sub, email: `${sub}@dev.local`, token: auth };
        return true;
      }
      throw new UnauthorizedException("Cognito not configured");
    }

    const auth = req.headers.authorization as string | undefined;
    if (!auth?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }
    const token = auth.slice(7);
    try {
      const decoded = await this.verify(token);
      req.user = {
        sub: decoded.sub as string,
        email: emailFromJwt(decoded),
        token,
      };
      return true;
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }

  /** Best-effort auth for public endpoints; never throws. */
  private async tryAttachUser(req: {
    headers: { authorization?: string };
    user?: AuthUser;
  }): Promise<void> {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return;

    if (!process.env.COGNITO_USER_POOL_ID) {
      if (auth.startsWith("Bearer dev:")) {
        const sub = auth.slice("Bearer dev:".length);
        req.user = { sub, email: `${sub}@dev.local`, token: auth };
      }
      return;
    }

    const token = auth.slice(7);
    try {
      const decoded = await this.verify(token);
      req.user = {
        sub: decoded.sub as string,
        email: emailFromJwt(decoded),
        token,
      };
    } catch {
      // leave unauthenticated
    }
  }

  private verify(token: string): Promise<jwt.JwtPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        (header, callback) => {
          if (!header.kid) return callback(new Error("No kid"));
          this.client.getSigningKey(header.kid, (err, key) => {
            if (err) return callback(err);
            callback(null, key?.getPublicKey());
          });
        },
        {
          algorithms: ["RS256"],
          issuer: `https://cognito-idp.${process.env.COGNITO_REGION || "us-east-1"}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
        },
        (err, payload) => {
          if (err || !payload || typeof payload === "string") {
            return reject(err || new Error("bad payload"));
          }
          const clientId = process.env.COGNITO_CLIENT_ID;
          if (clientId) {
            const aud = payload.aud;
            const tokenClient =
              (payload as jwt.JwtPayload).client_id ||
              (Array.isArray(aud) ? aud[0] : aud);
            if (tokenClient && tokenClient !== clientId) {
              return reject(new Error("Invalid audience"));
            }
          }
          resolve(payload);
        },
      );
    });
  }
}

@Module({
  providers: [
    { provide: APP_GUARD, useClass: CognitoAuthGuard },
  ],
})
export class AuthModule {}
