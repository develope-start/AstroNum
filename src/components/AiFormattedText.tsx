import type { ReactNode } from "react";

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${keyPrefix}-${index}`} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={`${keyPrefix}-${index}`} className="rounded bg-black/20 px-1">{part.slice(1, -1)}</code>;
    }
    return <span key={`${keyPrefix}-${index}`}>{part}</span>;
  });
}

export default function AiFormattedText({
  text,
  className = "text-sm leading-7 text-slate-200",
}: {
  text: string;
  className?: string;
}) {
  const blocks = text.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        const heading = block.match(/^#{1,3}\s+(.+)$/);
        if (heading) {
          return <h4 key={index} className="pt-2 text-base font-bold text-cyan-100">{renderInline(heading[1]!, `heading-${index}`)}</h4>;
        }

        const lines = block.split("\n");
        const listItems = lines.map((line) => line.match(/^\s*(?:[-*]|\d+[.)])\s+(.+)$/));
        if (listItems.every(Boolean)) {
          return (
            <ul key={index} className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-200">
              {listItems.map((item, lineIndex) => (
                <li key={lineIndex}>{renderInline(item![1]!, `list-${index}-${lineIndex}`)}</li>
              ))}
            </ul>
          );
        }

        return <p key={index} className={`whitespace-pre-line ${className}`}>{renderInline(block, `paragraph-${index}`)}</p>;
      })}
    </div>
  );
}
