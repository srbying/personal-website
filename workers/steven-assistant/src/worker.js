import { loadWorkerConfig } from "./config.js";
import { answerChat } from "./chat/service.js";
import { createConversationHistory } from "./chat/history.js";
import { isDigestDeliveryWindow, sendDailyChatDigest } from "./chat/digest.js";
import { createResendProvider } from "./email/resend.js";
import { validateChatRequest } from "./chat/messages.js";
import { jsonResponse, readBoundedJson, readBoundedText } from "./utils/http.js";

const HISTORY_RETENTION_CRON = "0 * * * *";
const RESEND_WEBHOOK_PATH = "/webhooks/resend";
const MAX_WEBHOOK_BODY_BYTES = 64 * 1024;

async function handleResendWebhook(request, env) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return jsonResponse({ error: "unsupported_media_type" }, 415);
  }

  const parsed = await readBoundedText(request, MAX_WEBHOOK_BODY_BYTES);
  if (parsed.error) return jsonResponse({ error: parsed.error }, parsed.status);

  const provider = createResendProvider({ webhookSecret: env.RESEND_WEBHOOK_SECRET });
  let event;
  try {
    event = await provider.parseDeliveryEvent({
      rawBody: parsed.text,
      headers: request.headers
    });
  } catch {
    return jsonResponse({ error: "invalid_webhook" }, 401);
  }
  if (!event) return jsonResponse({}, 204);

  try {
    const history = createConversationHistory(env.CONVERSATION_HISTORY);
    const digestId = event.digestId ??
      await history.findDigestIdByProviderMessageId(event.providerMessageId);
    if (!digestId) return jsonResponse({}, 204);
    await history.confirmDigestDelivered(digestId);
    return jsonResponse({}, 204);
  } catch {
    return jsonResponse({ error: "assistant_unavailable" }, 503);
  }
}

function digestProvider(env) {
  if (env.DIGEST_PROVIDER) return env.DIGEST_PROVIDER;
  return createResendProvider({
    apiKey: env.RESEND_API_KEY,
    from: env.RESEND_FROM,
    to: env.DIGEST_RECIPIENT,
    webhookSecret: env.RESEND_WEBHOOK_SECRET
  });
}

function createChatDependencies(env, config, request) {
  return {
    config,
    checkRateLimit: () => env.CHAT_LIMITER.limit({
      key: request.headers.get("cf-connecting-ip") ?? "unknown"
    }),
    embedQuery: async (query) => {
      const result = await env.AI.run(config.embeddingModel, { text: [query] });
      return result?.data?.[0];
    },
    searchEvidence: (vector) => env.KNOWLEDGE.query(vector, {
      topK: config.vectorTopK,
      returnMetadata: "all"
    })
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === RESEND_WEBHOOK_PATH) return handleResendWebhook(request, env);

    const origin = request.headers.get("origin");
    let config;
    try {
      config = loadWorkerConfig(env);
    } catch {
      return jsonResponse({ error: "assistant_unavailable" }, 503);
    }

    const options = { origin, allowedOrigins: config.allowedOrigins };
    if (origin && !config.allowedOrigins.has(origin)) {
      return jsonResponse({ error: "origin_not_allowed" }, 403);
    }
    if (request.method === "OPTIONS") return jsonResponse({}, 204, options);
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return jsonResponse({ ok: true, service: "steven-assistant" }, 200, options);
    }
    if (request.method === "GET" && url.pathname === "/api/chat/limits") {
      return jsonResponse({
        maxMessages: config.maxMessages,
        maxMessageLength: config.maxMessageLength,
        maxTotalMessageLength: config.maxTotalMessageLength
      }, 200, options);
    }
    if (url.pathname !== "/api/chat") {
      return jsonResponse({ error: "not_found" }, 404, options);
    }
    if (request.method !== "POST") {
      return jsonResponse({ error: "method_not_allowed" }, 405, options);
    }

    const parsed = await readBoundedJson(request, config.maxBodyBytes);
    if (parsed.error) {
      return jsonResponse({ error: parsed.error }, parsed.status, options);
    }

    const chatRequest = validateChatRequest(parsed.body, config);
    if (!chatRequest) {
      return jsonResponse({ error: "invalid_messages" }, 400, options);
    }

    try {
      const outcome = await answerChat(
        chatRequest.messages,
        createChatDependencies(env, config, request)
      );
      if (
        outcome.status !== 200 ||
        !["answered", "insufficient"].includes(outcome.body?.status) ||
        typeof outcome.body?.answer !== "string"
      ) {
        return jsonResponse(outcome.body, outcome.status, options);
      }

      const conversationId = chatRequest.conversationId ?? crypto.randomUUID();
      await createConversationHistory(env.CONVERSATION_HISTORY).recordExchange({
        conversationId,
        question: chatRequest.messages.at(-1).content.trim(),
        answer: outcome.body.answer
      });
      return jsonResponse({ ...outcome.body, conversationId }, outcome.status, options);
    } catch {
      return jsonResponse({ error: "assistant_unavailable" }, 503, options);
    }
  },

  async scheduled(controller, env) {
    if (controller.cron !== HISTORY_RETENTION_CRON) return;
    const scheduledTime = controller.scheduledTime ?? Date.now();
    const history = createConversationHistory(env.CONVERSATION_HISTORY);
    await history.deleteExpired(scheduledTime);
    if (!isDigestDeliveryWindow(scheduledTime)) return;
    await sendDailyChatDigest({
      history,
      provider: digestProvider(env),
      scheduledTime
    });
  }
};
