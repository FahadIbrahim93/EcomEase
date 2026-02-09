import { TRPCError } from "@trpc/server";
import { ENV } from "./env";
import { logger } from "./logger";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
  if (!isNonEmptyString(payload.title) || !isNonEmptyString(payload.content)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Title and content are required." });
  }

  const title = payload.title.trim().slice(0, TITLE_MAX_LENGTH);
  const content = payload.content.trim().slice(0, CONTENT_MAX_LENGTH);

  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Notification service not configured." });
  }

  const endpoint = new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`
  ).toString();

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1",
      },
      body: JSON.stringify({ title, content }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      logger.warn("[Notification] Remote service error", { status: response.status, detail });
      return false;
    }

    return true;
  } catch (error) {
    logger.error("[Notification] Request failed", { error });
    return false;
  }
}
