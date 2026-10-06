import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { preparedFaqs } from "../data/prepared-faqs.js";
import { createPortfolioChat } from "./portfolio-chat.js";

const API_URL = "https://worker.test/api/chat";
const CHAT_LIMITS = {
  maxMessages: 5,
  maxMessageLength: 80,
  maxTotalMessageLength: 240
};

function limitsResponse(body = CHAT_LIMITS, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

test("prepared FAQ contains only approved role fact and needs no API request", () => {
  let requestCount = 0;
  assert.deepEqual(preparedFaqs, [{
    question: "What is Steven's professional role?",
    answer: "Steven Byington is a software engineering manager."
  }]);

  createPortfolioChat({
    apiUrl: API_URL,
    fetchImpl: async () => {
      requestCount += 1;
      throw new Error("FAQ must not request the chat API");
    }
  });
  assert.equal(requestCount, 0);
});

test("built homepage includes static FAQ, unavailable state, resume PDF, and contact paths", async () => {
  const homepage = (await readFile(new URL("../../dist/index.html", import.meta.url), "utf8"))
    .replaceAll("&#39;", "'");

  assert.match(homepage, /<details[^>]*data-prepared-faq/);
  for (const content of [
    "What is Steven's professional role?",
    "Steven Byington is a software engineering manager.",
    "AI answers are temporarily unavailable",
    "data-chat-retry",
    'href="/resume/steven-byington-resume.pdf" download',
    'href="mailto:steven@stevenbyington.me"',
    'href="https://www.linkedin.com/in/stevenbyington/"',
    'href="https://github.com/srbying"'
  ]) {
    assert.ok(homepage.includes(content), `Built homepage missing ${content}`);
  }
});

test("failed chat pauses new questions until explicit retry", async () => {
  let requestCount = 0;
  const states = [];
  const chat = createPortfolioChat({
    apiUrl: API_URL,
    fetchImpl: async () => {
      requestCount += 1;
      throw new Error("worker unavailable");
    },
    onStateChange: (state) => states.push(state)
  });

  await chat.ask("What is Steven's professional role?");
  await chat.ask("What projects has Steven led?");

  assert.equal(chat.getState().status, "unavailable");
  assert.equal(chat.getState().message, "AI answers are temporarily unavailable.");
  assert.equal(requestCount, 1);
  assert.ok(states.some((state) => state.status === "pending"));
  assert.ok(states.some((state) => state.status === "unavailable"));
});

test("explicit retry resends failed question once and restores chat on success", async () => {
  const requests = [];
  const states = [];
  const chat = createPortfolioChat({
    apiUrl: API_URL,
    fetchImpl: async (_url, init) => {
      if (!init?.method || init.method === "GET") return limitsResponse();
      requests.push(JSON.parse(init.body));
      if (requests.length === 1) {
        return new Response(JSON.stringify({ error: "assistant_unavailable" }), { status: 503 });
      }
      return new Response(JSON.stringify({ status: "answered", answer: "Steven is a software engineering manager." }), { status: 200 });
    },
    onStateChange: (state) => states.push(state)
  });

  await chat.ask("What is Steven's professional role?");
  assert.equal(chat.getState().status, "unavailable");
  await chat.retry();

  assert.equal(requests.length, 2);
  assert.deepEqual(requests[0], requests[1]);
  assert.equal(chat.getState().status, "ready");
  assert.equal(chat.getState().answer, "Steven is a software engineering manager.");
  assert.equal(states.filter((state) => state.status === "pending" && state.retrying).length, 2);
  assert.equal(states.filter((state) => state.appendQuestion).length, 1);
});

test("a failed explicit retry cannot be repeated without a new question", async () => {
  let postCount = 0;
  const chat = createPortfolioChat({
    apiUrl: API_URL,
    fetchImpl: async (url, init) => {
      if (new URL(url).pathname.endsWith("/limits")) return limitsResponse();
      if (init?.method === "POST") postCount += 1;
      return new Response(JSON.stringify({ error: "assistant_unavailable" }), { status: 503 });
    }
  });

  await chat.ask("What is Steven's professional role?");
  await chat.retry();
  const didRetryAgain = await chat.retry();

  assert.equal(didRetryAgain, false);
  assert.equal(postCount, 2);
  assert.equal(chat.getState().status, "unavailable");
  assert.equal(chat.getState().retryAvailable, false);
});

test("malformed successful responses enter fallback state", async () => {
  const chat = createPortfolioChat({
    apiUrl: API_URL,
    fetchImpl: async (url) => new URL(url).pathname.endsWith("/limits")
      ? limitsResponse()
      : new Response(JSON.stringify({ status: "answered", answer: " " }), { status: 200 })
  });

  await chat.ask("What is Steven's professional role?");

  assert.equal(chat.getState().status, "unavailable");
});

test("loads Worker limits and uses them to bound chat requests", async () => {
  const requests = [];
  const chat = createPortfolioChat({
    apiUrl: API_URL,
    fetchImpl: async (url, init) => {
      requests.push({ url: String(url), method: init?.method ?? "GET", body: init?.body });
      if (new URL(url).pathname.endsWith("/limits")) return limitsResponse();
      return new Response(JSON.stringify({ status: "answered", answer: "A safe answer." }), { status: 200 });
    }
  });

  await chat.ask("What is Steven's role?");

  assert.deepEqual(requests.map(({ url, method }) => ({
    path: new URL(url).pathname,
    method
  })), [
    { path: "/api/chat/limits", method: "GET" },
    { path: "/api/chat", method: "POST" }
  ]);
  assert.deepEqual(JSON.parse(requests[1].body), {
    messages: [{ role: "user", content: "What is Steven's role?" }]
  });
});

test("keeps Worker-issued conversation id in memory for follow-up turns", async () => {
  const requests = [];
  const conversationId = "b22bb6b5-cac3-4d0e-9f5f-90fcdcbfca32";
  const chat = createPortfolioChat({
    apiUrl: API_URL,
    fetchImpl: async (url, init) => {
      if (new URL(url).pathname.endsWith("/limits")) return limitsResponse();
      const body = JSON.parse(init.body);
      requests.push(body);
      return new Response(JSON.stringify({
        status: "answered",
        answer: "A safe answer.",
        conversationId
      }), { status: 200 });
    }
  });

  await chat.ask("Question one");
  await chat.ask("Question two");

  assert.deepEqual(requests[0], {
    messages: [{ role: "user", content: "Question one" }]
  });
  assert.equal(requests[1].conversationId, conversationId);
  assert.deepEqual(requests[1].messages, [
    { role: "user", content: "Question one" },
    { role: "assistant", content: "A safe answer." },
    { role: "user", content: "Question two" }
  ]);
});

test("invalid Worker limits fail closed before sending the question", async () => {
  const requests = [];
  const chat = createPortfolioChat({
    apiUrl: API_URL,
    fetchImpl: async (url) => {
      requests.push(String(url));
      return limitsResponse({ maxMessages: 0, maxMessageLength: 80, maxTotalMessageLength: 240 });
    }
  });

  await chat.ask("What is Steven's role?");

  assert.equal(chat.getState().status, "unavailable");
  assert.equal(requests.length, 1);
  assert.ok(requests[0].endsWith("/api/chat/limits"));
});

test("Worker limits requests abort at the configured timeout", async () => {
  let limitsSignal;
  const chat = createPortfolioChat({
    apiUrl: API_URL,
    timeoutMs: 5,
    fetchImpl: async (url, init) => {
      if (!new URL(url).pathname.endsWith("/limits")) {
        return new Response(JSON.stringify({ status: "answered", answer: "OK." }), { status: 200 });
      }
      limitsSignal = init?.signal;
      return new Promise((_resolve, reject) => {
        const guard = setTimeout(() => reject(new Error("Fetch did not abort")), 50);
        limitsSignal?.addEventListener("abort", () => {
          clearTimeout(guard);
          reject(new DOMException("Aborted", "AbortError"));
        }, { once: true });
      });
    }
  });

  await chat.ask("What is Steven's role?");

  assert.ok(limitsSignal);
  assert.equal(limitsSignal.aborted, true);
  assert.equal(chat.getState().status, "unavailable");
});

test("bounds conversation history using the Worker message limit", async () => {
  const requestBodies = [];
  const chat = createPortfolioChat({
    apiUrl: API_URL,
    fetchImpl: async (url, init) => {
      if (new URL(url).pathname.endsWith("/limits")) {
        return limitsResponse({
          maxMessages: 3,
          maxMessageLength: 80,
          maxTotalMessageLength: 240
        });
      }
      requestBodies.push(JSON.parse(init.body));
      return new Response(JSON.stringify({ status: "answered", answer: "OK." }), { status: 200 });
    }
  });

  await chat.ask("Question one");
  await chat.ask("Question two");
  await chat.ask("Question three");

  assert.deepEqual(requestBodies[2].messages, [
    { role: "user", content: "Question two" },
    { role: "assistant", content: "OK." },
    { role: "user", content: "Question three" }
  ]);
});
