function renderPlan(plan) {
  const lines = [
    `Index: ${plan.indexName}`,
    `Embedding model: ${plan.embeddingModel}`,
    `Dimensions: ${plan.embeddingDimensions}`
  ];
  for (const [label, items] of [["Add", plan.additions], ["Edit", plan.edits]]) {
    lines.push(`${label}: ${items.length}`);
    for (const item of items) lines.push(`  ${item.id}\n    ${item.text.replace(/\n/g, "\n    ")}`);
  }
  lines.push(`Remove: ${plan.removals.length}`);
  for (const item of plan.removals) lines.push(`  ${item.id}`);
  lines.push(`Unchanged: ${plan.unchanged?.length ?? 0}`);
  if (!plan.additions.length && !plan.edits.length && !plan.removals.length) lines.push("No changes.");
  return lines.join("\n");
}

export async function runKnowledgeCommand(command, { service, write = () => {}, prompt, question } = {}) {
  if (!service) throw new Error("A knowledge sync service is required.");
  if (command === "validate") {
    const result = await service.validate();
    write(`Valid approved notes: ${result.noteCount}; chunks: ${result.chunkCount}.`);
    return result;
  }
  if (command === "preview") {
    const plan = await service.preview();
    write(renderPlan(plan));
    return plan;
  }
  if (command === "sync" || command === "rebuild") {
    const apply = command === "sync" ? service.sync.bind(service) : service.rebuild.bind(service);
    return apply({
      confirm: async (plan) => {
        write(renderPlan(plan));
        if (typeof prompt !== "function") return false;
        return await prompt('Type APPLY to continue: ') === "APPLY";
      }
    });
  }
  if (command === "verify") {
    const result = await service.verify();
    write(JSON.stringify(result, null, 2));
    return result;
  }
  if (command === "query") {
    if (typeof question !== "string" || !question.trim()) {
      throw new Error('Use: npm run knowledge:sync -- query "Your question"');
    }
    const result = await service.query(question);
    const matches = result.matches ?? [];
    write(JSON.stringify({
      question,
      matches: matches.map(({ id, score, metadata }) => ({ id, score, text: metadata?.text })),
      note: "These are retrieved passages, not generated answers. A match or score does not prove the passage answers the question."
    }, null, 2));
    return result;
  }
  throw new Error("Use: npm run knowledge:sync -- validate | preview | sync | verify | rebuild | query \"Your question\"");
}
