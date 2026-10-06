import { buildRetrievalQuery } from "./messages.js";
import { ANSWERS, isNegativeFitQuestion } from "./policy.js";

function result(status, body) {
  return { status, body };
}

export async function answerChat(messages, {
  config,
  checkRateLimit,
  embedQuery,
  searchEvidence,
  generateAnswer
}) {
  const rateLimit = await checkRateLimit();
  if (!rateLimit || typeof rateLimit.success !== "boolean") {
    throw new Error("Chat rate limiter unavailable");
  }
  if (!rateLimit.success) {
    return result(429, { error: "rate_limited" });
  }

  const latestQuestion = messages.at(-1).content.trim();
  if (isNegativeFitQuestion(latestQuestion)) {
    return result(200, { status: "answered", answer: ANSWERS.strengthsFocus });
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

  const evidence = matches
    .filter((match) => match.score >= config.relevanceThreshold)
    .map((match) => match.metadata.text);
  if (!evidence.length) {
    return result(200, { status: "insufficient", answer: ANSWERS.missing });
  }

  const answer = await generateAnswer({
    question: latestQuestion,
    evidence: evidence.slice(0, config.vectorTopK)
  });
  if (typeof answer !== "string" || !answer.trim() || answer.length > 2000) {
    throw new Error("Assistant answer generation unavailable");
  }

  const trimmedAnswer = answer.trim();
  return result(200, {
    status: trimmedAnswer === ANSWERS.missing ? "insufficient" : "answered",
    answer: trimmedAnswer.slice(0, config.maxMessageLength)
  });
}
