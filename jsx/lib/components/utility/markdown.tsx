import React from "react";
import styled from "styled-components";

/**
 * Lightweight Markdown renderer for LLM-generated content.
 * Supports: bold, italic, code, code blocks, links, lists, headers, line breaks.
 * No external dependencies - ~2KB.
 */

const MarkdownContainer = styled.div`
  line-height: 1.6;

  p {
    margin: 0.5em 0;
  }

  p:first-child {
    margin-top: 0;
  }

  p:last-child {
    margin-bottom: 0;
  }

  h1, h2, h3, h4, h5, h6 {
    margin: 0.75em 0 0.5em;
    font-weight: 600;
    line-height: 1.3;
  }

  h1 { font-size: 1.4em; }
  h2 { font-size: 1.25em; }
  h3 { font-size: 1.1em; }
  h4, h5, h6 { font-size: 1em; }

  code {
    background: var(--color-background-subtle, rgba(0, 0, 0, 0.05));
    padding: 0.15em 0.4em;
    border-radius: 4px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.9em;
  }

  pre {
    background: var(--color-background-subtle, #1a1a1a);
    color: var(--color-foreground, #e0e0e0);
    padding: 12px 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 0.75em 0;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.85em;
    line-height: 1.5;
  }

  pre code {
    background: none;
    padding: 0;
    font-size: inherit;
  }

  a {
    color: var(--color-primary, #3b82f6);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  ul, ol {
    margin: 0.5em 0;
    padding-left: 1.5em;
  }

  li {
    margin: 0.25em 0;
  }

  strong {
    font-weight: 600;
  }

  em {
    font-style: italic;
  }

  blockquote {
    border-left: 3px solid var(--color-border, #e0e0e0);
    margin: 0.75em 0;
    padding-left: 1em;
    color: var(--color-secondary-text, #666);
  }

  hr {
    border: none;
    border-top: 1px solid var(--color-border, #e0e0e0);
    margin: 1em 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
    font-size: 0.9em;
  }

  th, td {
    border: 1px solid var(--color-border, #e0e0e0);
    padding: 8px 12px;
    text-align: left;
  }

  th {
    background: var(--color-background-subtle, rgba(0, 0, 0, 0.05));
    font-weight: 600;
  }
`;

interface MarkdownProps {
    children: string;
    className?: string;
}

// Parse inline elements (bold, italic, code, links)
function parseInline(text: string): React.ReactNode[] {
    const elements: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    // Patterns in order of precedence
    const patterns: Array<{
        regex: RegExp;
        render: (match: RegExpMatchArray, k: number) => React.ReactNode;
    }> = [
            // Inline code: `code`
            {
                regex: /^`([^`]+)`/,
                render: (m, k) => <code key={k}>{m[1]}</code>,
            },
            // Bold: **text** or __text__
            {
                regex: /^(\*\*|__)(.+?)\1/,
                render: (m, k) => <strong key={k}>{parseInline(m[2])}</strong>,
            },
            // Italic: *text* or _text_ (not preceded by word char)
            {
                regex: /^(\*|_)([^*_]+?)\1/,
                render: (m, k) => <em key={k}>{parseInline(m[2])}</em>,
            },
            // Links: [text](url)
            {
                regex: /^\[([^\]]+)\]\(([^)]+)\)/,
                render: (m, k) => (
                    <a key={k} href={m[2]} target="_blank" rel="noopener noreferrer">
                        {m[1]}
                    </a>
                ),
            },
        ];

    while (remaining.length > 0) {
        let matched = false;

        for (const { regex, render } of patterns) {
            const match = remaining.match(regex);
            if (match) {
                elements.push(render(match, key++));
                remaining = remaining.slice(match[0].length);
                matched = true;
                break;
            }
        }

        if (!matched) {
            // No pattern matched, take one character as plain text
            const nextSpecial = remaining.slice(1).search(/[`*_\[]/);
            if (nextSpecial === -1) {
                elements.push(remaining);
                break;
            } else {
                elements.push(remaining.slice(0, nextSpecial + 1));
                remaining = remaining.slice(nextSpecial + 1);
                key++;
            }
        }
    }

    return elements;
}

// Parse a single line and return appropriate element
function parseLine(line: string, key: number): React.ReactNode {
    // Headers: # text
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
        const level = headerMatch[1].length;
        const content = parseInline(headerMatch[2]);
        switch (level) {
            case 1: return <h1 key={key}>{content}</h1>;
            case 2: return <h2 key={key}>{content}</h2>;
            case 3: return <h3 key={key}>{content}</h3>;
            case 4: return <h4 key={key}>{content}</h4>;
            case 5: return <h5 key={key}>{content}</h5>;
            case 6: return <h6 key={key}>{content}</h6>;
            default: return <p key={key}>{content}</p>;
        }
    }

    // Horizontal rule: --- or ***
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
        return <hr key={key} />;
    }

    // Blockquote: > text
    if (line.startsWith("> ")) {
        return <blockquote key={key}>{parseInline(line.slice(2))}</blockquote>;
    }

    // Unordered list: - text or * text
    if (/^[-*]\s/.test(line)) {
        return <li key={key}>{parseInline(line.slice(2))}</li>;
    }

    // Ordered list: 1. text
    const olMatch = line.match(/^(\d+)\.\s(.+)$/);
    if (olMatch) {
        return <li key={key}>{parseInline(olMatch[2])}</li>;
    }

    // Regular paragraph
    if (line.trim()) {
        return <p key={key}>{parseInline(line)}</p>;
    }

    return null;
}

function renderTable(rows: string[], key: number): React.ReactNode {
    // Basic table parser
    // Assumes | header | header |
    const processRow = (row: string) => {
        const content = row.trim();
        // Remove leading/trailing pipes if present
        const clean = content.replace(/^\|/, '').replace(/\|$/, '');
        return clean.split('|').map(c => c.trim());
    };

    const headers = processRow(rows[0]);
    // row[1] is separator, skip for now or use for alignment
    const bodyRows = rows.slice(2);

    return (
        <div key={key} style={{ overflowX: 'auto' }}>
            <table>
                <thead>
                    <tr>
                        {headers.map((h, i) => (
                            <th key={i}>{parseInline(h)}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {bodyRows.map((row, i) => (
                        <tr key={i}>
                            {processRow(row).map((cell, j) => (
                                <td key={j}>{parseInline(cell)}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function Markdown({ children, className }: MarkdownProps) {
    if (!children || typeof children !== "string") {
        return null;
    }

    const elements: React.ReactNode[] = [];
    const lines = children.split("\n");
    let i = 0;
    let key = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Code blocks: ```language\ncode\n```
        if (line.startsWith("```")) {
            const lang = line.slice(3).trim();
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].startsWith("```")) {
                codeLines.push(lines[i]);
                i++;
            }
            elements.push(
                <pre key={key++} data-language={lang || undefined}>
                    <code>{codeLines.join("\n")}</code>
                </pre>
            );
            i++; // skip closing ```
            continue;
        }

        // Collect consecutive list items
        if (/^[-*]\s/.test(line)) {
            const listItems: React.ReactNode[] = [];
            while (i < lines.length && /^[-*]\s/.test(lines[i])) {
                listItems.push(parseLine(lines[i], key++));
                i++;
            }
            elements.push(<ul key={key++}>{listItems}</ul>);
            continue;
        }

        // Collect consecutive ordered list items
        if (/^\d+\.\s/.test(line)) {
            const listItems: React.ReactNode[] = [];
            while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
                listItems.push(parseLine(lines[i], key++));
                i++;
            }
            elements.push(<ol key={key++}>{listItems}</ol>);
            continue;
        }

        // Tables
        // Look for | Header | ... and subsequent | --- |
        if (line.trim().startsWith("|")) {
            // Check if next line looks like a separator |---|
            if (i + 1 < lines.length && /^[|\s:-]+$/.test(lines[i + 1].trim()) && lines[i + 1].trim().includes("-")) {
                const tableRows: string[] = [];
                while (i < lines.length && lines[i].trim().startsWith("|")) {
                    tableRows.push(lines[i]);
                    i++;
                }
                if (tableRows.length >= 2) {
                    elements.push(renderTable(tableRows, key++));
                    continue;
                }
                // If not a valid table, backlog these lines? 
                // For now, if it failed validation but looked like table, we might have skipped lines.
                // Rollback is complex, but for valid GFM tables this works.
                // If we consumed lines but didn't render, we'd lose them. 
                // But the condition is strict on the separator.
            }
        }

        // Single line
        const parsed = parseLine(line, key++);
        if (parsed) {
            elements.push(parsed);
        }
        i++;
    }

    return (
        <MarkdownContainer className={className}>
            {elements}
        </MarkdownContainer>
    );
}

export default Markdown;
