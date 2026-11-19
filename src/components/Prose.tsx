import { Fragment, type ReactNode } from "react";

/**
 * Markdown mínimo y seguro (sin HTML): párrafos, listas, **negrita**, *cursiva*,
 * enlaces [texto](https://...) y URLs sueltas. Genera nodos React, así que el
 * contenido de los usuarios nunca se inyecta como HTML.
 */

const INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s<]+[^\s<.,;:!?)])/g;

function inline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (link)
      return (
        <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer nofollow">
          {link[1]}
        </a>
      );
    if (/^https?:\/\//.test(part))
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer nofollow">
          {part}
        </a>
      );
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function Prose({ text, className = "" }: { text: string; className?: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r/g, "").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ""));
      blocks.push(<ul key={blocks.length}>{items.map((t, k) => <li key={k}>{inline(t)}</li>)}</ul>);
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ""));
      blocks.push(<ol key={blocks.length}>{items.map((t, k) => <li key={k}>{inline(t)}</li>)}</ol>);
      continue;
    }
    if (/^#{1,3}\s+/.test(line)) {
      blocks.push(<h3 key={blocks.length}>{inline(line.replace(/^#{1,3}\s+/, ""))}</h3>);
      i++;
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^\s*([-*]|\d+[.)]|#{1,3})\s+/.test(lines[i])) para.push(lines[i++]);
    blocks.push(
      <p key={blocks.length}>
        {para.map((l, k) => (
          <Fragment key={k}>
            {k > 0 && <br />}
            {inline(l)}
          </Fragment>
        ))}
      </p>,
    );
  }
  return <div className={`prose-vice break-words ${className}`}>{blocks}</div>;
}
