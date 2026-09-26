/**
 * Renders long-form content with a safe markdown subset: paragraphs, unordered lists, inline
 * bold and the shared link syntax. Raw HTML in the content is never interpreted as markup.
 */
import { cn } from "../lib/utils.js";
import {
  RICH_MARKDOWN_BLOCK_TYPE,
  RICH_MARKDOWN_INLINE_TYPE,
  parseRichMarkdownBlocks,
  type RichMarkdownInlineSegment,
} from "../lib/rich-text/rich-markdown.js";
import { RICH_TEXT_LINK_CLASS_NAME } from "./rich-text-content.js";

const LINK_TARGET = "_blank";
const LINK_REL = "noreferrer";

export interface RichMarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Renders the inline pieces of a paragraph or list item.
 * @param segments - Parsed inline segments.
 * @returns Text, bold runs and links.
 */
function renderInlineSegments(segments: RichMarkdownInlineSegment[]) {
  return segments.map((segment, segmentIndex) => {
    const segmentKey = segment.type + String(segmentIndex);

    if (segment.type === RICH_MARKDOWN_INLINE_TYPE.link) {
      return (
        <a
          data-slot="rich-text-link"
          className={RICH_TEXT_LINK_CLASS_NAME}
          href={segment.url}
          key={segmentKey}
          rel={LINK_REL}
          target={LINK_TARGET}
        >
          {segment.text}
        </a>
      );
    }

    if (segment.type === RICH_MARKDOWN_INLINE_TYPE.bold) {
      return <strong key={segmentKey}>{segment.text}</strong>;
    }

    return segment.text;
  });
}

/**
 * Parses and renders the content as paragraphs and lists.
 * @param props - Stored content and optional class name.
 * @returns The rendered blocks.
 */
export function RichMarkdownContent({ content, className }: RichMarkdownContentProps) {
  const blocks = parseRichMarkdownBlocks(content);

  return (
    <div data-slot="rich-markdown-content" className={cn("grid gap-[0.9rem]", className)}>
      {blocks.map((block, blockIndex) =>
        block.type === RICH_MARKDOWN_BLOCK_TYPE.list ? (
          <ul className="m-0 grid list-disc gap-[0.35rem] pl-[1.4rem]" key={block.type + String(blockIndex)}>
            {block.items.map((itemSegments, itemIndex) => (
              <li
                className="leading-[1.7] [overflow-wrap:anywhere] marker:text-muted-foreground"
                key={block.type + String(blockIndex) + String(itemIndex)}
              >
                {renderInlineSegments(itemSegments)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 leading-[1.7] whitespace-pre-wrap [overflow-wrap:anywhere]" key={block.type + String(blockIndex)}>
            {renderInlineSegments(block.segments)}
          </p>
        ),
      )}
    </div>
  );
}
