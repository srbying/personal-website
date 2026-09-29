import { parseChatLimits, selectRecentMessages } from "./portfolioChatMessages.js";

const MAX_MESSAGES = 8;
const MAX_QUESTION_LENGTH = 1000;
const MAX_ANSWER_LENGTH = 2000;
const REQUEST_TIMEOUT_MS = 20000;

export const CHAT_UNAVAILABLE_MESSAGE = "AI answers are temporarily unavailable.";

function isChatResponse(value) {
  return Boolean(
    value &&
    ["answered", "insufficient"].includes(value.status) &&
    typeof value.answer === "string" &&
    value.answer.trim().length > 0 &&
    value.answer.length <= MAX_ANSWER_LENGTH
  );
}

export function createPortfolioChat({
  apiUrl,
  fetchImpl = globalThis.fetch,
  onStateChange = () => {},
  timeoutMs = REQUEST_TIMEOUT_MS
}) {
  let state = { status: "ready", message: "" };
  let conversation = [];
  let failedRequest = null;
  const limitsUrl = new URL(apiUrl);
  limitsUrl.pathname = `${limitsUrl.pathname.replace(/\/$/, "")}/limits`;

  const publish = (nextState) => {
    state = nextState;
    onStateChange({ ...state });
  };

  const readLimits = async () => {
    const response = await fetchImpl(limitsUrl);
    if (!response.ok) throw new Error("Chat limits are unavailable");
    return parseChatLimits(await response.json());
  };

  const requestAnswer = async (question, messages, isRetry) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error("Chat request failed");

      const result = await response.json();
      if (!isChatResponse(result)) throw new Error("Chat response was invalid");

      const answer = result.answer.trim();
      conversation = [...messages, { role: "assistant", content: answer }].slice(-MAX_MESSAGES);
      failedRequest = null;
      publish({
        status: "ready",
        question,
        answer,
        message: "Answer added to the conversation."
      });
      return true;
    } catch {
      failedRequest = { question, messages, retried: isRetry };
      publish({
        status: "unavailable",
        question,
        retrying: false,
        retryAvailable: !isRetry,
        message: isRetry
          ? "AI answers are still temporarily unavailable."
          : CHAT_UNAVAILABLE_MESSAGE
      });
      return false;
    } finally {
      clearTimeout(timeout);
    }
  };

  const prepareAndRequest = async (question, isRetry) => {
    publish({
      status: "pending",
      question,
      retrying: isRetry,
      maxQuestionLength: state.maxQuestionLength ?? MAX_QUESTION_LENGTH,
      message: isRetry
        ? "Trying the previous question again…"
        : "Checking the information available about Steven…"
    });

    try {
      const limits = await readLimits();
      const maxQuestionLength = Math.min(
        MAX_QUESTION_LENGTH,
        limits.maxMessageLength,
        limits.maxTotalMessageLength
      );
      if (question.length > maxQuestionLength) {
        failedRequest = null;
        publish({
          status: "ready",
          maxQuestionLength,
          message: "Please shorten your question to fit the chat's limits."
        });
        return false;
      }

      const messages = selectRecentMessages([
        ...conversation,
        { role: "user", content: question }
      ], limits);
      if (!messages) {
        failedRequest = null;
        publish({
          status: "ready",
          maxQuestionLength,
          message: "This conversation is too long. Start with a shorter question."
        });
        return false;
      }

      publish({
        status: "pending",
        question,
        appendQuestion: !isRetry,
        retrying: isRetry,
        maxQuestionLength,
        message: isRetry
          ? "Trying the previous question again…"
          : "Checking the information available about Steven…"
      });
      return requestAnswer(question, messages, isRetry);
    } catch {
      failedRequest = { question, retried: isRetry };
      publish({
        status: "unavailable",
        question,
        retrying: false,
        retryAvailable: !isRetry,
        message: isRetry
          ? "AI answers are still temporarily unavailable."
          : CHAT_UNAVAILABLE_MESSAGE
      });
      return false;
    }
  };

  return Object.freeze({
    getState: () => ({ ...state }),
    async ask(question) {
      if (state.status !== "ready" || typeof question !== "string") return false;
      const cleanQuestion = question.trim();
      if (!cleanQuestion || cleanQuestion.length > MAX_QUESTION_LENGTH) return false;
      return prepareAndRequest(cleanQuestion, false);
    },
    async retry() {
      if (state.status !== "unavailable" || !failedRequest || failedRequest.retried) return false;
      failedRequest = { ...failedRequest, retried: true };
      return prepareAndRequest(failedRequest.question, true);
    }
  });
}
