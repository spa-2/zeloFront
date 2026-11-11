export function messageText(message) {
  return [message.content, message.text, message.payload?.text]
    .filter((value) => typeof value === 'string' && value.trim())
    .filter((value, index, values) => values.indexOf(value) === index)
    .join('\n\n');
}

export function mergeMessages(current, incoming) {
  const byId = new Map(current.map((message) => [message.messageId, message]));
  incoming.forEach((message) => byId.set(message.messageId, message));
  const messages = [...byId.values()].sort((a, b) => a.messageId - b.messageId);
  const active = incoming.findLast((message) => message.quoteCardStatus === 'ACTIVE');
  const latest = messages.at(-1)?.messageId;
  return messages.map((message) => ({
    ...message,
    retryable: message.messageId === latest && message.retryable,
    quoteCardStatus: active && message.payload?.type === 'QUOTE_CARD' && message.payload.quoteId !== active.payload.quoteId && message.quoteCardStatus === 'ACTIVE'
      ? 'SUPERSEDED' : message.quoteCardStatus,
  }));
}
