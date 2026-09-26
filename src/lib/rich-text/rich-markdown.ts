import { parseRichTextSegments } from "./link-markdown.js";
import { RICH_TEXT_SEGMENT_TYPE } from "./link-markdown-constants.js";

/**
 * Block-level markdown subset for long-form content such as descriptions and stories.
 *
 * It builds on top of the shared link parser (`parseRichTextSegments`) without
 * touching it, adding paragraphs, unordered lists (`- item` / `* item`) and
 * inline bold (`**text**`). Everything else stays plain text, so the renderer
 * never interprets raw HTML.
 */

export const RICH_MARKDOWN_BLOCK_TYPE = {
  list: "list",
  paragraph: "paragraph",
} as const;

export const RICH_MARKDOWN_INLINE_TYPE = {
  bold: "bold",
  link: "link",
  text: "text",
} as const;

export type RichMarkdownInlineSegment =
  | { text: string; type: typeof RICH_MARKDOWN_INLINE_TYPE.bold }
  | { text: string; type: typeof RICH_MARKDOWN_INLINE_TYPE.text }
  | { text: string; type: typeof RICH_MARKDOWN_INLINE_TYPE.link; url: string };

export type RichMarkdownBlock =
  | { segments: RichMarkdownInlineSegment[]; type: typeof RICH_MARKDOWN_BLOCK_TYPE.paragraph }
  | { items: RichMarkdownInlineSegment[][]; type: typeof RICH_MARKDOWN_BLOCK_TYPE.list };

const LINE_BREAK_PATTERN = /\r?\n/;
const LIST_ITEM_PATTERN = /^\s*[-*]\s+(.*)$/;
const BOLD_PATTERN = /\*\*([^*]+)\*\*/g;
const PARAGRAPH_LINE_SEPARATOR = "\n";

function parseInlineLinks(text: string): RichMarkdownInlineSegment[] {
  return parseRichTextSegments(text).map((segment) =>
    segment.type === RICH_TEXT_SEGMENT_TYPE.link
      ? { text: segment.text, type: RICH_MARKDOWN_INLINE_TYPE.link, url: segment.url }
      : { text: segment.text, type: RICH_MARKDOWN_INLINE_TYPE.text }
  );
}

function parseInlineSegments(text: string): RichMarkdownInlineSegment[] {
  const segments: RichMarkdownInlineSegment[] = [];
  let lastIndex = 0;

  for (const boldMatch of text.matchAll(BOLD_PATTERN)) {
    const matchIndex = boldMatch.index ?? 0;

    if (matchIndex > lastIndex) {
      segments.push(...parseInlineLinks(text.slice(lastIndex, matchIndex)));
    }

    segments.push({ text: boldMatch[1], type: RICH_MARKDOWN_INLINE_TYPE.bold });
    lastIndex = matchIndex + boldMatch[0].length;
  }

  if (lastIndex < text.length) {
    segments.push(...parseInlineLinks(text.slice(lastIndex)));
  }

  return segments;
}

const EXCERPT_SEGMENT_SEPARATOR = " ";
const EXCERPT_ELLIPSIS = "…";

/**
 * Flattens the parsed content into plain text (formatting stripped) and trims it
 * to `maxLength`, for SEO descriptions and previews.
 */
export function buildRichMarkdownExcerpt(
  content: string,
  maxLength: number
): string {
  const plainText = parseRichMarkdownBlocks(content)
    .flatMap((block) =>
      block.type === RICH_MARKDOWN_BLOCK_TYPE.paragraph
        ? block.segments.map((segment) => segment.text)
        : block.items.flatMap((itemSegments) =>
            itemSegments.map((segment) => segment.text)
          )
    )
    .join(EXCERPT_SEGMENT_SEPARATOR)
    .replace(/\s+/g, EXCERPT_SEGMENT_SEPARATOR)
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return plainText.slice(0, maxLength - EXCERPT_ELLIPSIS.length).trimEnd() +
    EXCERPT_ELLIPSIS;
}

export function parseRichMarkdownBlocks(content: string): RichMarkdownBlock[] {
  const blocks: RichMarkdownBlock[] = [];
  let paragraphLines: string[] = [];
  let listItems: RichMarkdownInlineSegment[][] = [];

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      blocks.push({
        segments: parseInlineSegments(
          paragraphLines.join(PARAGRAPH_LINE_SEPARATOR)
        ),
        type: RICH_MARKDOWN_BLOCK_TYPE.paragraph,
      });
      paragraphLines = [];
    }
  };
  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ items: listItems, type: RICH_MARKDOWN_BLOCK_TYPE.list });
      listItems = [];
    }
  };

  for (const line of content.split(LINE_BREAK_PATTERN)) {
    const listItemMatch = LIST_ITEM_PATTERN.exec(line);

    if (listItemMatch) {
      flushParagraph();
      listItems.push(parseInlineSegments(listItemMatch[1]));
      continue;
    }

    flushList();

    if (line.trim().length === 0) {
      flushParagraph();
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}
