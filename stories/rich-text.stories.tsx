/** Demonstrates the rich text renderer, the block markdown content and the link editor. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { RichLinkEditor, RichMarkdownContent, RichTextContent, useRichLinkEditor } from "beez-ui";

const INITIAL_MARKDOWN = "Mirá [el programa](https://example.com/programa) o escribí a example.com";
const LONG_FORM_MARKDOWN = [
  "Somos una comunidad de **aprendizaje**.",
  "",
  "- Clases en vivo",
  "- Material en [la biblioteca](https://example.com/biblioteca)",
].join("\n");

/** Edits markdown links and shows how stored values render. */
function RichTextExample() {
  const editor = useRichLinkEditor({ initialMarkdown: INITIAL_MARKDOWN });

  return (
    <div className="grid max-w-xl gap-4">
      <div className="rounded-lg border border-border p-3">
        <RichLinkEditor ariaLabel="Mensaje" editor={editor} placeholder="Escribí un mensaje" />
      </div>
      <p className="m-0 text-sm">
        <RichTextContent content={INITIAL_MARKDOWN} />
      </p>
      <RichMarkdownContent content={LONG_FORM_MARKDOWN} />
    </div>
  );
}

const meta = {
  title: "Components/RichText",
  render: () => <RichTextExample />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
