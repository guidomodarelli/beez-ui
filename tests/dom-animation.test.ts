/** Verifies the native animation cancellation contract used by Motion cleanup. */
import { describe, expect, it } from "vitest";

describe("DOM animation cancellation", () => {
  it("should preserve AbortError without an unhandled rejection when canceled before a consumer subscribes", async () => {
    const element = document.createElement("div");
    const animation = element.animate({ opacity: [0, 1] }, { duration: 1000 });
    const finished = animation.finished;

    animation.cancel();
    // Cross an event-loop turn before subscribing: browsers mark this rejection
    // as handled during cancel(), and Vitest must not report it as unhandled.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(animation.playState).toBe("idle");
    expect(animation.currentTime).toBeNull();
    await expect(finished).rejects.toMatchObject({ name: "AbortError" });
  });

  it("should retain successful completion when a finished animation is canceled", async () => {
    const element = document.createElement("div");
    const animation = element.animate({ opacity: [0, 1] }, { duration: 1000 });
    const finished = animation.finished;

    animation.finish();
    animation.cancel();

    await expect(finished).resolves.toBe(animation);
    expect(animation.playState).toBe("idle");
  });
});
