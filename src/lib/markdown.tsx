// src/lib/markdown.tsx
// Tiny, streaming-safe markdown renderer for AI chat bubbles.
// We deliberately avoid react-markdown here — every streamed token re-renders
// the whole bubble, and a heavy parser causes visible jank. This handles just
// what the LLM actually emits in Slovak replies: **bold**, *italic*, `code`,
// ```code blocks```, [links](url), lists (- / 1.), paragraphs, headings (#).

import React from "react";

type InlineToken =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "code"; value: string }
  | { type: "link"; label: string; href: string };

// Escape HTML-ish chars in plain text so we don't accidentally render markup.
// React already escapes via text nodes, so we don't re-escape — just return as-is.

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let i = 0;
  let buf = "";

  const pushText = () => {
    if (buf) {
      tokens.push({ type: "text", value: buf });
      buf = "";
    }
  };

  while (i < text.length) {
    const ch = text[i];

    // Inline code: `foo`
    if (ch === "`") {
      const end = text.indexOf("`", i + 1);
      if (end !== -1) {
        pushText();
        tokens.push({ type: "code", value: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    // Bold: **foo**
    if (ch === "*" && text[i + 1] === "*") {
      const end = text.indexOf("**", i + 2);
      if (end !== -1) {
        pushText();
        tokens.push({ type: "bold", value: text.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }

    // Italic: *foo* or _foo_ (single delimiter)
    if ((ch === "*" || ch === "_") && text[i + 1] !== ch) {
      const end = text.indexOf(ch, i + 1);
      // Avoid grabbing random asterisks — require closing delim on same line.
      if (end !== -1 && !text.slice(i + 1, end).includes("\n")) {
        pushText();
        tokens.push({ type: "italic", value: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    // Link: [label](url)
    if (ch === "[") {
      const close = text.indexOf("]", i + 1);
      if (close !== -1 && text[close + 1] === "(") {
        const urlEnd = text.indexOf(")", close + 2);
        if (urlEnd !== -1) {
          pushText();
          tokens.push({
            type: "link",
            label: text.slice(i + 1, close),
            href: text.slice(close + 2, urlEnd),
          });
          i = urlEnd + 1;
          continue;
        }
      }
    }

    buf += ch;
    i++;
  }

  pushText();
  return tokens;
}

function renderInline(tokens: InlineToken[], keyBase: string): React.ReactNode[] {
  return tokens.map((t, idx) => {
    const key = `${keyBase}-${idx}`;
    switch (t.type) {
      case "bold":
        return <strong key={key} className="font-semibold">{t.value}</strong>;
      case "italic":
        return <em key={key} className="italic">{t.value}</em>;
      case "code":
        return (
          <code
            key={key}
            className="px-1 py-0.5 rounded text-[0.85em]"
            style={{
              background: "rgba(99,102,241,0.18)",
              color: "#e0e7ff",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            {t.value}
          </code>
        );
      case "link":
        return (
          <a
            key={key}
            href={t.href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted underline-offset-2 hover:opacity-80"
            style={{ color: "#a5b4fc" }}
          >
            {t.label}
          </a>
        );
      default:
        return <React.Fragment key={key}>{t.value}</React.Fragment>;
    }
  });
}

type Block =
  | { type: "p"; text: string }
  | { type: "h"; level: 1 | 2 | 3; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "pre"; code: string; lang?: string }
  | { type: "hr" }
  | { type: "blank" };

function parseBlocks(src: string): Block[] {
  const blocks: Block[] = [];
  const lines = src.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code fence
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim() || undefined;
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push({ type: "pre", code: codeLines.join("\n"), lang });
      continue;
    }

    // Horizontal rule
    if (/^\s*---\s*$/.test(line)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Heading
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      blocks.push({ type: "h", level: h[1].length as 1 | 2 | 3, text: h[2] });
      i++;
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      blocks.push({ type: "blank" });
      i++;
      continue;
    }

    // Paragraph — merge consecutive non-empty, non-structural lines
    const paraLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("```") &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^\s*---\s*$/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: "p", text: paraLines.join("\n") });
  }

  return blocks;
}

export function MarkdownText({ source }: { source: string }) {
  const blocks = parseBlocks(source);

  return (
    <>
      {blocks.map((b, idx) => {
        const key = `b${idx}`;
        switch (b.type) {
          case "p":
            return (
              <p key={key} className="whitespace-pre-wrap [&:not(:first-child)]:mt-2">
                {renderInline(parseInline(b.text), key)}
              </p>
            );
          case "h": {
            const sizes = { 1: "text-base font-bold", 2: "text-sm font-bold", 3: "text-sm font-semibold" };
            const Tag = (b.level === 1 ? "h3" : b.level === 2 ? "h4" : "h5") as keyof React.JSX.IntrinsicElements;
            return (
              <Tag key={key} className={`${sizes[b.level]} mt-3 mb-1 first:mt-0`}>
                {renderInline(parseInline(b.text), key)}
              </Tag>
            );
          }
          case "ul":
            return (
              <ul key={key} className="list-disc pl-5 my-1 space-y-0.5">
                {b.items.map((it, i2) => (
                  <li key={`${key}-${i2}`}>{renderInline(parseInline(it), `${key}-${i2}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key} className="list-decimal pl-5 my-1 space-y-0.5">
                {b.items.map((it, i2) => (
                  <li key={`${key}-${i2}`}>{renderInline(parseInline(it), `${key}-${i2}`)}</li>
                ))}
              </ol>
            );
          case "pre":
            return (
              <pre
                key={key}
                className="my-2 p-2.5 rounded-lg overflow-x-auto text-[0.8em] leading-relaxed"
                style={{
                  background: "rgba(15,18,32,0.85)",
                  border: "1px solid rgba(99,102,241,0.22)",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
              >
                <code>{b.code}</code>
              </pre>
            );
          case "hr":
            return (
              <hr
                key={key}
                className="my-3"
                style={{ borderColor: "rgba(99,102,241,0.2)" }}
              />
            );
          case "blank":
            return null;
        }
      })}
    </>
  );
}
