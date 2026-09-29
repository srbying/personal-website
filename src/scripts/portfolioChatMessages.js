/**
 * @typedef {{ role: "user" | "assistant", content: string }} ChatMessage
 * @typedef {{ maxMessages: number, maxMessageLength: number, maxTotalMessageLength: number }} ChatLimits
 */

/** @param {unknown} value @returns {ChatLimits} */
export function parseChatLimits(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Chat limits are invalid.");
  }

  const limits = /** @type {Partial<ChatLimits>} */ (value);
  if (
    ![limits.maxMessages, limits.maxMessageLength, limits.maxTotalMessageLength]
      .every((limit) => Number.isSafeInteger(limit) && limit > 0)
  ) {
    throw new Error("Chat limits are invalid.");
  }

  return /** @type {ChatLimits} */ ({
    maxMessages: limits.maxMessages,
    maxMessageLength: limits.maxMessageLength,
    maxTotalMessageLength: limits.maxTotalMessageLength
  });
}

/**
 * Select the longest recent user-terminated conversation suffix within all Worker limits.
 * @param {ChatMessage[]} messages
 * @param {ChatLimits} limits
 * @returns {ChatMessage[] | null}
 */
export function selectRecentMessages(messages, limits) {
  for (let start = 0; start < messages.length; start += 2) {
    const selected = messages.slice(start);
    const alternatingRoles = selected.every((message, index) =>
      message.role === (index % 2 === 0 ? "user" : "assistant")
    );
    if (
      selected.length <= limits.maxMessages &&
      selected[0]?.role === "user" &&
      selected.at(-1)?.role === "user" &&
      alternatingRoles &&
      selected.every((message) =>
        typeof message.content === "string" &&
        message.content.length > 0 &&
        message.content.length <= limits.maxMessageLength
      ) &&
      selected.reduce((length, message) => length + message.content.length, 0) <=
        limits.maxTotalMessageLength
    ) {
      return selected;
    }
  }
  return null;
}
