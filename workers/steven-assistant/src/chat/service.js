import { buildRetrievalQuery, getPreviousUserQuestions } from "./messages.js";
import { ANSWERS, APPROVED_EVIDENCE, classifyQuestion } from "./policy.js";

function result(status, body) {
  return { status, body };
}

export async function answerChat(messages, { config, checkRateLimit, embedQuery, searchEvidence }) {
  const rateLimit = await checkRateLimit();
  if (!rateLimit || typeof rateLimit.success !== "boolean") {
    throw new Error("Chat rate limiter unavailable");
  }
  if (!rateLimit.success) {
    return result(429, { error: "rate_limited" });
  }

  const latestQuestion = messages.at(-1).content.trim();
  const earlierQuestions = getPreviousUserQuestions(messages);
  const intent = classifyQuestion(latestQuestion, earlierQuestions);

  if (intent === "negative-fit") {
    return result(200, { status: "answered", answer: ANSWERS.strengthsFocus });
  }
  if (intent === "unsupported") {
    return result(200, { status: "insufficient", answer: ANSWERS.missing });
  }

  const vector = await embedQuery(buildRetrievalQuery(messages));
  if (
    !Array.isArray(vector) ||
    vector.length !== config.embeddingDimensions ||
    !vector.every(Number.isFinite)
  ) {
    throw new Error("Assistant embedding unavailable");
  }

  const searchResult = await searchEvidence(vector);
  const matches = searchResult?.matches;
  if (
    !Array.isArray(matches) ||
    matches.some((match) =>
      !match ||
      !Number.isFinite(match.score) ||
      typeof match.metadata?.text !== "string"
    )
  ) {
    throw new Error("Assistant retrieval unavailable");
  }

  const approvedMatch = matches.find((match) =>
    match?.metadata?.text === APPROVED_EVIDENCE &&
    match.score >= config.relevanceThreshold
  );
  if (!approvedMatch) {
    return result(200, { status: "insufficient", answer: ANSWERS.missing });
  }

  // Return only fixed policy text; visitor input and vector metadata add no claims.
  return result(200, { status: "answered", answer: ANSWERS.role });
}
