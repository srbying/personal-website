import { createHash } from "node:crypto";

const NOTE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const APPROVAL_FIELDS = new Set(["id", "status", "approved_on"]);

function isRealDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function parseApprovedNote(markdown, sourceName = "approved note") {
  if (typeof markdown !== "string" || !markdown.trim()) {
    throw new Error(`${sourceName} is empty.`);
  }
  const normalized = markdown.replace(/\r\n?/g, "\n");
  const frontmatter = normalized.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatter) throw new Error(`${sourceName} needs frontmatter and a Markdown title.`);

  const metadata = new Map();
  for (const line of frontmatter[1].split("\n")) {
    const field = line.match(/^([a-z_]+):[ \t]*(.*)$/);
    if (!field || !field[2].trim() || metadata.has(field[1])) {
      throw new Error(`${sourceName} has invalid or duplicate note metadata.`);
    }
    if (!APPROVAL_FIELDS.has(field[1])) throw new Error(`${sourceName} has unsupported approval metadata.`);
    metadata.set(field[1], field[2].trim());
  }

  const id = metadata.get("id");
  if (!id || !NOTE_ID_PATTERN.test(id)) throw new Error(`${sourceName} has an invalid note id.`);
  if (metadata.get("status") !== "approved") throw new Error(`${sourceName} must have status: approved.`);
  if (!isRealDate(metadata.get("approved_on") ?? "")) {
    throw new Error(`${sourceName} needs a valid approved_on date.`);
  }

  const remainder = normalized.slice(frontmatter[0].length);
  const titleMatch = remainder.match(/^#\s+([^\n#].*?)\s*\n+(?=[\s\S]*\S)([\s\S]*)$/);
  if (!titleMatch) throw new Error(`${sourceName} needs a Markdown title and body.`);
  const title = titleMatch[1].trim();
  const body = titleMatch[2].trim();
  if (!title) throw new Error(`${sourceName} needs a Markdown title.`);
  if (!body) throw new Error(`${sourceName} needs approved body text.`);

  return Object.freeze({ id, title, body, approvedOn: metadata.get("approved_on") });
}

function classifyLine(line) {
  if (/^\s{0,3}#{1,6}\s+/.test(line)) return "heading";
  if (/^\s{0,3}(`{3,}|~{3,})/.test(line)) return "fence";
  if (/^\s*(?:[-+*]|\d+[.)])\s+/.test(line)) return "list";
  if (/^\s*\|/.test(line)) return "table";
  return "paragraph";
}

function splitMarkdownBlocks(markdown) {
  const lines = markdown.split("\n");
  const blocks = [];
  let current = [];
  let type = null;
  let fence = null;

  const flush = () => {
    const text = current.join("\n").trim();
    if (text) blocks.push({ type, text });
    current = [];
    type = null;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineType = classifyLine(line);
    if (fence) {
      current.push(line);
      if (line.trim().startsWith(fence)) fence = null;
      continue;
    }
    if (lineType === "fence") {
      if (current.length) flush();
      current = [line];
      type = "code";
      const marker = line.trim().match(/^(`{3,}|~{3,})/);
      fence = marker?.[1] ?? null;
      continue;
    }
    if (!line.trim()) {
      if (type === "list") {
        let next = index + 1;
        while (next < lines.length && !lines[next].trim()) next += 1;
        if (next < lines.length && (/^\s*(?:[-+*]|\d+[.)])\s+/.test(lines[next]) || /^\s{2,}\S/.test(lines[next]))) {
          current.push("");
          continue;
        }
      }
      flush();
      continue;
    }
    if (lineType === "heading") {
      flush();
      blocks.push({ type: "heading", text: line.trim() });
      continue;
    }
    const nextType = lineType === "list" || lineType === "table" ? lineType : "paragraph";
    if (type === "list" && /^\s{2,}\S/.test(line)) {
      current.push(line);
      continue;
    }
    if (current.length && type !== nextType) flush();
    if (!current.length) type = nextType;
    current.push(line);
  }
  flush();
  return blocks;
}

function headingDetails(text) {
  const match = text.match(/^(#{1,6})\s+(.+?)\s*#*$/);
  return match ? { level: match[1].length, text: match[0].trim() } : null;
}

function splitLongBlock(text, limit) {
  const pieces = [];
  let remaining = text.trim();
  while (remaining.length > limit) {
    let splitAt = 0;
    const sentencePattern = /[.!?](?:["')\]]+)?\s+/g;
    for (const match of remaining.matchAll(sentencePattern)) {
      const boundary = match.index + match[0].trimEnd().length;
      if (boundary <= limit) splitAt = boundary;
      else break;
    }
    if (!splitAt) {
      const whitespace = remaining.slice(0, limit + 1).search(/\s+\S*$/);
      if (whitespace > 0) splitAt = whitespace;
    }
    if (!splitAt) splitAt = limit;
    const piece = remaining.slice(0, splitAt).trim();
    if (!piece) throw new Error("Could not split oversized Markdown content safely.");
    pieces.push(piece);
    remaining = remaining.slice(splitAt).trimStart();
  }
  if (remaining) pieces.push(remaining);
  return pieces;
}

export function chunkApprovedNote(note, maxChars = 1000) {
  if (!Number.isSafeInteger(maxChars) || maxChars < 1) {
    throw new Error("Chunk size must be a positive integer.");
  }
  if (!note || !note.id || !note.title || !note.body) throw new Error("A validated approved note is required.");

  const blocks = splitMarkdownBlocks(note.body);
  const headings = [];
  let currentBody = [];
  let currentHeader = [`# ${note.title}`];
  const chunks = [];
  const render = (header, body) => `${header.join("\n")}\n\n${body.join("\n\n")}`;
  const flush = () => {
    if (!currentBody.length) return;
    const text = render(currentHeader, currentBody);
    chunks.push(text);
    currentBody = [];
  };

  for (const block of blocks) {
    if (block.type === "heading") {
      flush();
      const heading = headingDetails(block.text);
      if (!heading) continue;
      const headingIndex = Math.max(0, heading.level - 2);
      headings.length = headingIndex;
      headings[headingIndex] = heading.text;
      currentHeader = [`# ${note.title}`, ...headings.filter(Boolean)];
      continue;
    }

    const header = [`# ${note.title}`, ...headings.filter(Boolean)];
    const headerLength = header.join("\n").length + 2;
    const available = maxChars - headerLength;
    if (available < 1) throw new Error(`Heading context in ${note.id} exceeds the configured chunk size.`);

    if (block.text.length > available) {
      flush();
      for (const piece of splitLongBlock(block.text, available)) {
        if (piece.length > available) throw new Error(`Markdown block in ${note.id} exceeds the configured chunk size.`);
        chunks.push(render(header, [piece]));
      }
      continue;
    }

    const nextBody = [...currentBody, block.text];
    if (render(header, nextBody).length > maxChars) flush();
    if (render(header, [block.text]).length > maxChars) {
      for (const piece of splitLongBlock(block.text, available)) chunks.push(render(header, [piece]));
    } else {
      currentBody.push(block.text);
      currentHeader = header;
    }
  }
  flush();

  return chunks.map((text, index) => ({
    id: `${note.id}:${String(index + 1).padStart(4, "0")}`,
    noteId: note.id,
    ordinal: index + 1,
    text,
    hash: createHash("sha256").update(text).digest("hex")
  }));
}
