/** Demonstrates Pagination as a complete, interactive composition. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "beez-ui";
import { useArgs } from "storybook/preview-api";
/** Editable inputs specific to this example. */
type Args = { page: number; pageCount: number };
const meta = {
  title: "Components/Pagination",
  args: {
    page: 2,
    pageCount: 5,
  },
  argTypes: {
    page: {
      control: {
        type: "range",
        min: 1,
        max: 10,
        step: 1,
      },
    },
    pageCount: {
      control: {
        type: "range",
        min: 1,
        max: 10,
        step: 1,
      },
    },
  },
  parameters: { controls: { include: ["page", "pageCount"] } },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    const currentPage = Math.min(args.page, args.pageCount);
    const navigate =
      (page: number) => (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        updateArgs({ page: Math.max(1, Math.min(page, args.pageCount)) });
      };
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#previous"
              text="Anterior"
              onClick={navigate(currentPage - 1)}
            />
          </PaginationItem>
          {Array.from({ length: args.pageCount }, (_, index) => (
            <PaginationItem key={index}>
              <PaginationLink
                href={`#page-${index + 1}`}
                isActive={currentPage === index + 1}
                onClick={navigate(index + 1)}
              >
                {index + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              href="#next"
              text="Siguiente"
              onClick={navigate(currentPage + 1)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
