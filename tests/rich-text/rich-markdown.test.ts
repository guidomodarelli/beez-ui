/** Verifies the safe block markdown subset used by RichMarkdownContent. */
import { describe, it, expect } from "vitest";
import {
  RICH_MARKDOWN_BLOCK_TYPE,
  RICH_MARKDOWN_INLINE_TYPE,
  buildRichMarkdownExcerpt,
  parseRichMarkdownBlocks,
} from "../../dist/lib/rich-text/rich-markdown.js";

describe("buildRichMarkdownExcerpt", () => {
  it("strips formatting and keeps the plain text", () => {
    expect(
      buildRichMarkdownExcerpt(
        "Somos **una tribu**\n- Honestidad\nMirá [el manifiesto](https://tribu.example.com)",
        160
      )
    ).toBe("Somos una tribu Honestidad Mirá el manifiesto");
  });

  it("trims long content with an ellipsis within the limit", () => {
    const excerpt = buildRichMarkdownExcerpt("a".repeat(300), 160);

    expect(excerpt.length).toBeLessThanOrEqual(160);
    expect(excerpt.endsWith("…")).toBe(true);
  });
});

describe("parseRichMarkdownBlocks", () => {
  it("splits paragraphs on blank lines and keeps single line breaks inside a paragraph", () => {
    const blocks = parseRichMarkdownBlocks(
      "Primera línea\nsegunda línea\n\nOtro párrafo"
    );

    expect(blocks).toEqual([
      {
        segments: [
          {
            text: "Primera línea\nsegunda línea",
            type: RICH_MARKDOWN_INLINE_TYPE.text,
          },
        ],
        type: RICH_MARKDOWN_BLOCK_TYPE.paragraph,
      },
      {
        segments: [{ text: "Otro párrafo", type: RICH_MARKDOWN_INLINE_TYPE.text }],
        type: RICH_MARKDOWN_BLOCK_TYPE.paragraph,
      },
    ]);
  });

  it("groups consecutive dash and asterisk lines into a single list", () => {
    const blocks = parseRichMarkdownBlocks(
      "Nuestros valores:\n- Honestidad\n* Comunidad\nCierre"
    );

    expect(blocks).toEqual([
      {
        segments: [
          { text: "Nuestros valores:", type: RICH_MARKDOWN_INLINE_TYPE.text },
        ],
        type: RICH_MARKDOWN_BLOCK_TYPE.paragraph,
      },
      {
        items: [
          [{ text: "Honestidad", type: RICH_MARKDOWN_INLINE_TYPE.text }],
          [{ text: "Comunidad", type: RICH_MARKDOWN_INLINE_TYPE.text }],
        ],
        type: RICH_MARKDOWN_BLOCK_TYPE.list,
      },
      {
        segments: [{ text: "Cierre", type: RICH_MARKDOWN_INLINE_TYPE.text }],
        type: RICH_MARKDOWN_BLOCK_TYPE.paragraph,
      },
    ]);
  });

  it("parses inline bold segments", () => {
    const blocks = parseRichMarkdownBlocks("Somos **una tribu** abierta");

    expect(blocks).toEqual([
      {
        segments: [
          { text: "Somos ", type: RICH_MARKDOWN_INLINE_TYPE.text },
          { text: "una tribu", type: RICH_MARKDOWN_INLINE_TYPE.bold },
          { text: " abierta", type: RICH_MARKDOWN_INLINE_TYPE.text },
        ],
        type: RICH_MARKDOWN_BLOCK_TYPE.paragraph,
      },
    ]);
  });

  it("keeps markdown links working next to bold text and inside list items", () => {
    const blocks = parseRichMarkdownBlocks(
      "**Sumate** vía [el manifiesto](https://tribu.example.com)\n- Leé [las reglas](https://tribu.example.com/reglas)"
    );

    expect(blocks).toEqual([
      {
        segments: [
          { text: "Sumate", type: RICH_MARKDOWN_INLINE_TYPE.bold },
          { text: " vía ", type: RICH_MARKDOWN_INLINE_TYPE.text },
          {
            text: "el manifiesto",
            type: RICH_MARKDOWN_INLINE_TYPE.link,
            url: "https://tribu.example.com",
          },
        ],
        type: RICH_MARKDOWN_BLOCK_TYPE.paragraph,
      },
      {
        items: [
          [
            { text: "Leé ", type: RICH_MARKDOWN_INLINE_TYPE.text },
            {
              text: "las reglas",
              type: RICH_MARKDOWN_INLINE_TYPE.link,
              url: "https://tribu.example.com/reglas",
            },
          ],
        ],
        type: RICH_MARKDOWN_BLOCK_TYPE.list,
      },
    ]);
  });

  it("never interprets raw HTML as markup", () => {
    const blocks = parseRichMarkdownBlocks("<script>alert(1)</script>");

    expect(blocks).toEqual([
      {
        segments: [
          { text: "<script>alert(1)</script>", type: RICH_MARKDOWN_INLINE_TYPE.text },
        ],
        type: RICH_MARKDOWN_BLOCK_TYPE.paragraph,
      },
    ]);
  });
});
