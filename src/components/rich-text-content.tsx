/**
 * Renders persisted rich text (markdown links plus auto-detected URLs) as plain text interleaved
 * with safe `<a>` links. Raw HTML in the content is never interpreted as markup.
 */
import type { MouseEvent } from "react";

import { cn } from "../lib/utils.js";
import { RICH_TEXT_SEGMENT_TYPE } from "../lib/rich-text/link-markdown-constants.js";
import { parseRichTextSegments } from "../lib/rich-text/link-markdown.js";

const LINK_TARGET = "_blank";
const LINK_REL = "noreferrer";

/** Shared look of links inside rendered rich text. */
export const RICH_TEXT_LINK_CLASS_NAME =
  "rounded-[0.2rem] text-primary underline decoration-primary/45 underline-offset-[0.18em] transition-[color,text-decoration-color] [word-break:break-word] hover:text-[color-mix(in_oklab,var(--primary)_72%,var(--foreground))] hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export interface RichTextContentProps {
  content: string;
  onLinkClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  linkClassName?: string;
}

/**
 * Renders an inline fragment instead of a wrapper element, so it composes inside any container
 * without altering layout-sensitive behavior such as `line-clamp` on an ancestor.
 * @param props - Stored content, optional link click handler and link class name.
 * @returns Text and links.
 */
export function RichTextContent({ content, onLinkClick, linkClassName }: RichTextContentProps) {
  const segments = parseRichTextSegments(content);

  return (
    <>
      {segments.map((segment, segmentIndex) =>
        segment.type === RICH_TEXT_SEGMENT_TYPE.link ? (
          <a
            data-slot="rich-text-link"
            className={cn(RICH_TEXT_LINK_CLASS_NAME, "font-bold decoration-[0.08em]", linkClassName)}
            href={segment.url}
            key={segment.type + String(segmentIndex)}
            onClick={onLinkClick}
            rel={LINK_REL}
            target={LINK_TARGET}
          >
            {segment.text}
          </a>
        ) : (
          segment.text
        ),
      )}
    </>
  );
}
