import { test, expect, type Page, type Locator } from "@playwright/test";

/**
 * Helper to select a date range by clicking two day buttons.
 */
async function selectRange(page: Page, startDay: string, endDay: string) {
  const startBtn = getDayButton(page, startDay);
  await startBtn.click();
  const endBtn = getDayButton(page, endDay);
  await endBtn.click();
}

/**
 * Get a day button by its visible text (day number).
 */
function getDayButton(page: Page, day: string): Locator {
  return page
    .locator("button")
    .filter({ hasText: new RegExp(`^${day}$`) })
    .first();
}

/**
 * Get the visible drag handle for a specific edge.
 */
function getDragHandle(page: Page, edge: "start" | "end"): Locator {
  return page.locator(
    `[data-testid="drag-handle-${edge}"][data-active]`,
  );
}

/**
 * Perform a pointer-based drag from a drag handle to a target date.
 * Dispatches pointer events directly in the page context to ensure
 * pointer capture works correctly.
 */
async function pointerDragToDate(
  page: Page,
  handleSelector: string,
  targetDateStr: string,
) {
  await page.evaluate(
    ({ handleSel, targetDate }) => {
      const handle = document.querySelector(handleSel);
      const target = document.querySelector(
        `[data-drop-date="${targetDate}"]`,
      );
      if (!handle || !target) {
        throw new Error(
          `Missing elements: handle=${!!handle} target=${!!target}`,
        );
      }

      const hBox = handle.getBoundingClientRect();
      const tBox = target.getBoundingClientRect();
      const startX = hBox.x + hBox.width / 2;
      const startY = hBox.y + hBox.height / 2;
      const endX = tBox.x + tBox.width / 2;
      const endY = tBox.y + tBox.height / 2;

      handle.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          button: 0,
          clientX: startX,
          clientY: startY,
          pointerType: "mouse",
        }),
      );

      const steps = 10;
      for (let i = 1; i <= steps; i++) {
        const x = startX + ((endX - startX) * i) / steps;
        const y = startY + ((endY - startY) * i) / steps;
        handle.dispatchEvent(
          new PointerEvent("pointermove", {
            bubbles: true,
            cancelable: true,
            pointerId: 1,
            clientX: x,
            clientY: y,
            pointerType: "mouse",
          }),
        );
      }

      handle.dispatchEvent(
        new PointerEvent("pointerup", {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          clientX: endX,
          clientY: endY,
          pointerType: "mouse",
        }),
      );
    },
    { handleSel: handleSelector, targetDate: targetDateStr },
  );
  // Allow React state to settle
  await page.waitForTimeout(100);
}

test.describe("Drag Range Handles", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // The app defaults to "range" selection mode
    await page.waitForSelector("[data-testid='button-prev-month']");
  });

  test("drag handles appear when a range is selected", async ({ page }) => {
    await expect(getDragHandle(page, "start")).not.toBeVisible();
    await expect(getDragHandle(page, "end")).not.toBeVisible();

    await selectRange(page, "10", "15");

    await expect(getDragHandle(page, "start")).toBeVisible();
    await expect(getDragHandle(page, "end")).toBeVisible();
  });

  test("drag handles have correct data attributes", async ({ page }) => {
    await selectRange(page, "10", "15");

    const startHandle = getDragHandle(page, "start");
    const endHandle = getDragHandle(page, "end");

    await expect(startHandle).toHaveAttribute("data-edge", "start");
    await expect(endHandle).toHaveAttribute("data-edge", "end");
    await expect(startHandle).toHaveAttribute("role", "slider");
    await expect(endHandle).toHaveAttribute("role", "slider");
  });

  test("drag handles have correct aria attributes", async ({ page }) => {
    await selectRange(page, "10", "15");

    const startHandle = getDragHandle(page, "start");
    const endHandle = getDragHandle(page, "end");

    await expect(startHandle).toHaveAttribute(
      "aria-roledescription",
      "drag handle",
    );
    await expect(endHandle).toHaveAttribute(
      "aria-roledescription",
      "drag handle",
    );
    await expect(startHandle).toHaveAttribute(
      "aria-label",
      "Range start date",
    );
    await expect(endHandle).toHaveAttribute("aria-label", "Range end date");
  });

  test("start drag handle is draggable", async ({ page }) => {
    await selectRange(page, "10", "15");
    const startHandle = getDragHandle(page, "start");
    await expect(startHandle).toHaveAttribute("draggable", "true");
  });

  test("end drag handle is draggable", async ({ page }) => {
    await selectRange(page, "10", "15");
    const endHandle = getDragHandle(page, "end");
    await expect(endHandle).toHaveAttribute("draggable", "true");
  });

  test("dragging end handle extends the range", async ({ page }) => {
    await selectRange(page, "10", "15");

    const selectedRange = page.locator("[data-testid='selected-range']");
    await expect(selectedRange.first()).toBeVisible();

    // Drag end handle from day 15 to day 20
    await pointerDragToDate(
      page,
      '[data-testid="drag-handle-end"][data-active]',
      "2026-03-20",
    );

    // Verify the range was extended
    await expect(page.locator("text=Mar 20")).toBeVisible();
  });

  test("dragging start handle adjusts the range", async ({ page }) => {
    await selectRange(page, "10", "20");

    // Drag start handle from day 10 to day 14
    await pointerDragToDate(
      page,
      '[data-testid="drag-handle-start"][data-active]',
      "2026-03-14",
    );

    // Verify the range start was adjusted
    await expect(page.locator("text=Mar 14")).toBeVisible();
  });

  test("range selection is visually shown", async ({ page }) => {
    await selectRange(page, "10", "15");

    const rangeIndicator = page.locator("[data-testid='selected-range']");
    await expect(rangeIndicator.first()).toBeVisible();
  });

  test("single-day range shows both handles on same cell", async ({
    page,
  }) => {
    // Use "start-end" range mode so clicking same day twice creates a single-day range
    await page.locator("#selection-mode").selectOption("range");
    await page.locator("#range-mode").selectOption("start-end");

    await selectRange(page, "12", "12");

    await expect(getDragHandle(page, "start")).toBeVisible();
    await expect(getDragHandle(page, "end")).toBeVisible();
  });
});
