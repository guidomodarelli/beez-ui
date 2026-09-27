/** Verifies the progress ring and the reaction toggle through their public contracts. */
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProgressRing, ReactionButton } from "beez-ui";

describe("ProgressRing", () => {
  it("stays decorative without a label", () => {
    const { container } = render(<ProgressRing fraction={0.5} />);

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("exposes the clamped value when labelled and hides the arc when empty", () => {
    const { rerender, container } = render(<ProgressRing fraction={1.4} label="Cuotas pagadas" />);

    expect(screen.getByRole("progressbar", { name: "Cuotas pagadas" })).toHaveAttribute("aria-valuenow", "100");

    rerender(<ProgressRing fraction={0} label="Cuotas pagadas" />);

    expect(screen.getByRole("progressbar", { name: "Cuotas pagadas" })).toHaveAttribute("aria-valuenow", "0");
    expect(container.querySelector('[data-slot="progress-ring-indicator"]')).not.toBeInTheDocument();
  });
});

describe("ReactionButton", () => {
  /** Owns the optimistic reaction state like a consumer would. */
  function ReactionHarness() {
    const [isActive, setIsActive] = useState(false);
    const [count, setCount] = useState(2);

    return (
      <ReactionButton
        ariaLabel={`Me gusta ${count}`}
        isActive={isActive}
        count={count}
        onClick={() => {
          setIsActive(!isActive);
          setCount(isActive ? count - 1 : count + 1);
        }}
      />
    );
  }

  it("exposes the state as a pressed toggle and settles on the new count", async () => {
    const user = userEvent.setup();
    render(<ReactionHarness />);

    const button = screen.getByRole("button", { name: "Me gusta 2" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    await user.click(button);

    const likedButton = screen.getByRole("button", { name: "Me gusta 3" });
    expect(likedButton).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(likedButton).toHaveTextContent(/^3$/));
  });

  it("fills the active icon with the requested color", () => {
    render(<ReactionButton ariaLabel="Me gusta 1" isActive count={1} activeColor="var(--primary)" onClick={() => {}} />);

    expect(screen.getByRole("button", { name: "Me gusta 1" }).style.getPropertyValue("--beez-reaction-active-color")).toBe("var(--primary)");
  });

  it("does not react while disabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<ReactionButton ariaLabel="Me gusta 1" isActive={false} count={1} isDisabled onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: "Me gusta 1" }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
