function hasExactKeys(value, expectedKeys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length === expectedKeys.length && expectedKeys.every((key) => keys.includes(key));
}

function isValidMessageList(messages, config) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > config.maxMessages) {
    return false;
  }

  let totalLength = 0;
  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    const expectedRole = index % 2 === 0 ? "user" : "assistant";
    if (!hasExactKeys(message, ["role", "content"])) return false;
    if (message.role !== expectedRole || typeof message.content !== "string") return false;
    const content = message.content.trim();
    if (!content || content.length > config.maxMessageLength) return false;
    totalLength += content.length;
  }

  return messages.at(-1)?.role === "user" && totalLength <= config.maxTotalMessageLength;
}

export function validateChatRequest(body, config) {
  if (!hasExactKeys(body, ["messages"]) || !isValidMessageList(body.messages, config)) {
    return null;
  }
  return { messages: body.messages };
}

export function getPreviousUserQuestions(messages) {
  return messages
    .filter((message) => message.role === "user")
    .slice(0, -1)
    .map((message) => message.content.trim());
}

export function buildRetrievalQuery(messages) {
  const priorQuestions = getPreviousUserQuestions(messages).slice(-2);
  const latestQuestion = messages.at(-1).content.trim();
  return [...priorQuestions, latestQuestion].join("\n");
}
