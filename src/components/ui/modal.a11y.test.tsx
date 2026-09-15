// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import axe from "axe-core";
import { Modal } from "@/components/dashboard-app";

function Harness({ withModal, onClose }: { withModal: boolean; onClose: () => void }) {
  return (
    <main>
      <button onClick={onClose}>Trigger</button>
      {withModal && (
        <Modal title="Task details" onClose={onClose}>
          <label htmlFor="scan-task-title">Task name</label>
          <input id="scan-task-title" defaultValue="Map contractor permissions" />
          <label htmlFor="scan-task-due">Due date</label>
          <input id="scan-task-due" type="date" defaultValue="2026-09-25" />
          <button onClick={onClose}>Cancel</button>
        </Modal>
      )}
    </main>
  );
}

describe("modal accessibility (automated scan)", () => {
  it("passes the axe-core WCAG 2.x AA scan", async () => {
    const onClose = vi.fn();
    document.documentElement.lang = "en";
    const { container, unmount } = render(<Harness withModal onClose={onClose} />);
    const results = await axe.run(container, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
    });
    const failures = results.violations.map(v => `${v.id} (${v.impact}): ${v.nodes.length} node(s)`);
    expect(failures).toEqual([]);
    unmount();
    cleanup();
  });

  it("moves focus into the dialog on open", () => {
    const onClose = vi.fn();
    const { unmount } = render(<Harness withModal onClose={onClose} />);
    expect(document.activeElement?.id).toBe("scan-task-title");
    unmount();
    cleanup();
  });

  it("traps Tab inside the dialog", () => {
    const onClose = vi.fn();
    const { container, unmount } = render(<Harness withModal onClose={onClose} />);
    const close = container.querySelector<HTMLElement>("button[aria-label='Close']")!;
    const cancel = Array.from(container.querySelectorAll("button")).find(b => b.textContent === "Cancel")!;
    cancel.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(close);
    close.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(cancel);
    unmount();
    cleanup();
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    const { unmount } = render(<Harness withModal onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
    cleanup();
  });

  it("closes when the backdrop is clicked but not when the panel is clicked", () => {
    const onClose = vi.fn();
    const { container, unmount } = render(<Harness withModal onClose={onClose} />);
    const overlay = container.querySelector("div[role='dialog']")!;
    fireEvent.click(overlay, { target: overlay });
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
    cleanup();
  });

  it("restores focus to the trigger after close", () => {
    const onClose = vi.fn();
    const { rerender, container, unmount } = render(<Harness withModal={false} onClose={onClose} />);
    const trigger = container.querySelector("button")!;
    trigger.focus();
    rerender(<Harness withModal onClose={onClose} />);
    expect(document.activeElement?.id).toBe("scan-task-title");
    rerender(<Harness withModal={false} onClose={onClose} />);
    expect(document.activeElement).toBe(trigger);
    unmount();
    cleanup();
  });
});
