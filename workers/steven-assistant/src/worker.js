import { loadWorkerConfig } from "./config.js";
import { answerChat } from "./chat/service.js";
import { validateChatRequest } from "./chat/messages.js";
import { jsonResponse, readBoundedJson } from "./utils/http.js";

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
      return jsonResponse(outcome.body, outcome.status, options);
    } catch {
      return jsonResponse({ error: "assistant_unavailable" }, 503, options);
    }
  }
};
