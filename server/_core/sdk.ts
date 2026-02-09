import { AXIOS_TIMEOUT_MS, COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import axios, { type AxiosInstance } from "axios";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import { logger } from "./logger";
import type {
  ExchangeTokenRequest,
  ExchangeTokenResponse,
  GetUserInfoResponse,
  GetUserInfoWithJwtRequest,
  GetUserInfoWithJwtResponse,
} from "./types/manusTypes";

const isNonEmptyString = (val: unknown): val is string => typeof val === "string" && val.length > 0;

class OAuthService {
  constructor(private client: AxiosInstance) {
    if (!ENV.oAuthServerUrl) logger.error("[OAuth] OAUTH_SERVER_URL not configured");
  }

  private decodeState(state: string): string {
    try {
      const decoded = atob(state);
      if (decoded.startsWith('http')) {
        new URL(decoded);
      } else if (!decoded.startsWith('/')) {
        throw new Error('Invalid state format');
      }
      return decoded;
    } catch (error) {
      logger.error("[OAuth] State decode failed", { state, error });
      throw new Error('Invalid OAuth state');
    }
  }

  async getTokenByCode(code: string, state: string): Promise<ExchangeTokenResponse> {
    const { data } = await this.client.post("/webdev.v1.WebDevAuthPublicService/ExchangeToken", {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state),
    });
    return data;
  }

  async getUserInfoByToken(accessToken: string): Promise<GetUserInfoResponse> {
    const { data } = await this.client.post("/webdev.v1.WebDevAuthPublicService/GetUserInfo", { accessToken });
    return data;
  }
}

class SDKServer {
  private readonly client = axios.create({ baseURL: ENV.oAuthServerUrl, timeout: AXIOS_TIMEOUT_MS });
  private readonly oauth = new OAuthService(this.client);

  private deriveLoginMethod(platforms: unknown, fallback?: string | null): string | null {
    if (fallback) return fallback;
    if (!Array.isArray(platforms)) return null;
    const p = new Set(platforms);
    if (p.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (p.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (p.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    return (platforms[0] as string)?.toLowerCase() || null;
  }

  async exchangeCodeForToken(code: string, state: string) {
    return this.oauth.getTokenByCode(code, state);
  }

  async getUserInfo(accessToken: string): Promise<GetUserInfoResponse> {
    const data = await this.oauth.getUserInfoByToken(accessToken);
    const method = this.deriveLoginMethod((data as any).platforms, (data as any).platform || data.loginMethod);
    return { ...data, platform: method, loginMethod: method };
  }

  async createSessionToken(openId: string, opts: { expiresInMs?: number; name?: string } = {}) {
    const secret = new TextEncoder().encode(ENV.cookieSecret);
    return new SignJWT({ openId, appId: ENV.appId, name: opts.name || "" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(Math.floor((Date.now() + (opts.expiresInMs ?? ONE_YEAR_MS)) / 1000))
      .sign(secret);
  }

  async verifySession(token?: string | null) {
    if (!token) return null;
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(ENV.cookieSecret), { algorithms: ["HS256"] });
      const { openId, appId, name } = payload as any;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId)) return null;
      return { openId, appId, name: name || "" };
    } catch (e) {
      logger.warn("[Auth] Session verification failed", { error: e });
      return null;
    }
  }

  async getUserInfoWithJwt(jwtToken: string): Promise<GetUserInfoWithJwtResponse> {
    const { data } = await this.client.post("/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt", {
      jwtToken,
      projectId: ENV.appId,
    });
    const method = this.deriveLoginMethod((data as any).platforms, (data as any).platform || data.loginMethod);
    return { ...data, platform: method, loginMethod: method };
  }

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = parseCookieHeader(req.headers.cookie || "");
    const session = await this.verifySession(cookies[COOKIE_NAME]);
    if (!session) throw ForbiddenError("Invalid session");

    const signedInAt = new Date();
    let user = await db.getUserByOpenId(session.openId);

    if (!user) {
      try {
        const info = await this.getUserInfoWithJwt(cookies[COOKIE_NAME]!);
        await db.upsertUser({
          openId: info.openId,
          name: info.name,
          email: info.email,
          loginMethod: info.loginMethod,
          lastSignedIn: signedInAt,
        });
        user = await db.getUserByOpenId(info.openId);
      } catch (e) {
        throw ForbiddenError("Failed to sync user");
      }
    }

    if (!user) throw ForbiddenError("User not found");
    await db.upsertUser({ openId: user.openId, lastSignedIn: signedInAt });
    return user;
  }
}

export const sdk = new SDKServer();
