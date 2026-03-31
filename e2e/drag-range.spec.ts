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
  return page.locator(`[data-testid="drag-handle-${edge}"][data-active]`);
}

/**
 * Perform a real mouse drag from a drag handle to a target day button.
 * Uses Playwright's page.mouse API to dispatch genuine browser events,
 * ensuring the full pointer event pipeline is exercised.
 */
async function dragHandleToDay(
  page: Page,
  edge: "start" | "end",
  targetDay: string,
) {
  const handle = getDragHandle(page, edge);
  await expect(handle).toBeVisible();

  const handleBox = await handle.boundingBox();
  if (!handleBox) throw new Error(`No bounding box for ${edge} handle`);

  const targetBtn = getDayButton(page, targetDay);
  await expect(targetBtn).toBeVisible();
  const targetBox = await targetBtn.boundingBox();
  if (!targetBox) throw new Error(`No bounding box for day ${targetDay}`);

  const startX = handleBox.x + handleBox.width / 2;
  const startY = handleBox.y + handleBox.height / 2;
  const endX = targetBox.x + targetBox.width / 2;
  const endY = targetBox.y + targetBox.height / 2;

  // Move to handle center and press
  await page.mouse.move(startX, startY);
  await page.mouse.down();

  // Wait for React to process the drag start and set pointerEvents: "none"
  // on handle overlays so elementFromPoint can see through to day buttons
  await page.waitForTimeout(50);

  // Move to target in steps, giving React time to process state updates
  const steps = 10;
  for (let i = 1; i <= steps; i++) {
    const x = startX + ((endX - startX) * i) / steps;
    const y = startY + ((endY - startY) * i) / steps;
    await page.mouse.move(x, y);
    // Small delay between moves to let React re-render
    if (i % 3 === 0) await page.waitForTimeout(30);
  }

  await page.mouse.up();

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
    await expect(startHandle).toHaveAttribute("aria-label", "Range start date");
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
    await dragHandleToDay(page, "end", "20");

    // Verify the end handle moved to day 20
    const endHandle = getDragHandle(page, "end");
    const day20Btn = getDayButton(page, "20");
    const day20Box = await day20Btn.boundingBox();
    const handleBox = await endHandle.boundingBox();
    // The handle should be positioned on day 20's button
    expect(handleBox).toBeTruthy();
    expect(day20Box).toBeTruthy();
    // Handle center should be within the day 20 button bounds
    const handleCenterX = handleBox!.x + handleBox!.width / 2;
    const handleCenterY = handleBox!.y + handleBox!.height / 2;
    expect(handleCenterX).toBeGreaterThanOrEqual(day20Box!.x);
    expect(handleCenterX).toBeLessThanOrEqual(day20Box!.x + day20Box!.width);
    expect(handleCenterY).toBeGreaterThanOrEqual(day20Box!.y);
    expect(handleCenterY).toBeLessThanOrEqual(day20Box!.y + day20Box!.height);
  });

  test("dragging start handle adjusts the range", async ({ page }) => {
    await selectRange(page, "10", "20");

    // Drag start handle from day 10 to day 14
    await dragHandleToDay(page, "start", "14");

    // Verify the start handle moved to day 14
    const startHandle = getDragHandle(page, "start");
    const day14Btn = getDayButton(page, "14");
    const day14Box = await day14Btn.boundingBox();
    const handleBox = await startHandle.boundingBox();
    expect(handleBox).toBeTruthy();
    expect(day14Box).toBeTruthy();
    const handleCenterX = handleBox!.x + handleBox!.width / 2;
    const handleCenterY = handleBox!.y + handleBox!.height / 2;
    expect(handleCenterX).toBeGreaterThanOrEqual(day14Box!.x);
    expect(handleCenterX).toBeLessThanOrEqual(day14Box!.x + day14Box!.width);
    expect(handleCenterY).toBeGreaterThanOrEqual(day14Box!.y);
    expect(handleCenterY).toBeLessThanOrEqual(day14Box!.y + day14Box!.height);
  });

  test("range selection is visually shown", async ({ page }) => {
    await selectRange(page, "10", "15");

    const rangeIndicator = page.locator("[data-testid='selected-range']");
    await expect(rangeIndicator.first()).toBeVisible();
  });

  test("single-day range shows both handles on same cell", async ({ page }) => {
    // Use "start-end" range mode so clicking same day twice creates a single-day range
    await page.locator("#selection-mode").selectOption("range");
    await page.locator("#range-mode").selectOption("start-end");

    await selectRange(page, "12", "12");

    await expect(getDragHandle(page, "start")).toBeVisible();
    await expect(getDragHandle(page, "end")).toBeVisible();
  });

  test("drag across multiple cells updates continuously", async ({ page }) => {
    await selectRange(page, "10", "15");

    // Drag end handle from day 15 to day 22 - crosses multiple cells
    await dragHandleToDay(page, "end", "22");

    // The end handle should now be on day 22
    const endHandle = getDragHandle(page, "end");
    const day22Btn = getDayButton(page, "22");
    const day22Box = await day22Btn.boundingBox();
    const handleBox = await endHandle.boundingBox();
    expect(handleBox).toBeTruthy();
    expect(day22Box).toBeTruthy();
    const handleCenterX = handleBox!.x + handleBox!.width / 2;
    expect(handleCenterX).toBeGreaterThanOrEqual(day22Box!.x);
    expect(handleCenterX).toBeLessThanOrEqual(day22Box!.x + day22Box!.width);
  });

  test("drag start handle earlier expands range", async ({ page }) => {
    await selectRange(page, "15", "20");

    // Drag start handle from day 15 to day 8
    await dragHandleToDay(page, "start", "8");

    // The start handle should be on day 8
    const startHandle = getDragHandle(page, "start");
    const day8Btn = getDayButton(page, "8");
    const day8Box = await day8Btn.boundingBox();
    const handleBox = await startHandle.boundingBox();
    expect(handleBox).toBeTruthy();
    expect(day8Box).toBeTruthy();
    const handleCenterX = handleBox!.x + handleBox!.width / 2;
    expect(handleCenterX).toBeGreaterThanOrEqual(day8Box!.x);
    expect(handleCenterX).toBeLessThanOrEqual(day8Box!.x + day8Box!.width);
  });

  test("drag start handle backward when start clicked first (start-end mode)", async ({
    page,
  }) => {
    // Ensure start-end range mode
    await page.locator("#range-mode").selectOption("start-end");

    // Click start first (10), then end (19) — ascending order
    await selectRange(page, "10", "19");

    // Drag start handle from day 10 to day 9
    await dragHandleToDay(page, "start", "9");

    // Verify start handle moved to day 9
    const startHandle = getDragHandle(page, "start");
    const day9Btn = getDayButton(page, "9");
    const day9Box = await day9Btn.boundingBox();
    const handleBox = await startHandle.boundingBox();
    expect(handleBox).toBeTruthy();
    expect(day9Box).toBeTruthy();
    const handleCenterX = handleBox!.x + handleBox!.width / 2;
    expect(handleCenterX).toBeGreaterThanOrEqual(day9Box!.x);
    expect(handleCenterX).toBeLessThanOrEqual(day9Box!.x + day9Box!.width);
  });

  test("drag start handle backward when end clicked first (start-end mode)", async ({
    page,
  }) => {
    // Ensure start-end range mode
    await page.locator("#range-mode").selectOption("start-end");

    // Click end first (19), then start (10) — descending order
    await selectRange(page, "19", "10");

    // Drag start handle from day 10 to day 9
    await dragHandleToDay(page, "start", "9");

    // Verify start handle moved to day 9
    const startHandle = getDragHandle(page, "start");
    const day9Btn = getDayButton(page, "9");
    const day9Box = await day9Btn.boundingBox();
    const handleBox = await startHandle.boundingBox();
    expect(handleBox).toBeTruthy();
    expect(day9Box).toBeTruthy();
    const handleCenterX = handleBox!.x + handleBox!.width / 2;
    expect(handleCenterX).toBeGreaterThanOrEqual(day9Box!.x);
    expect(handleCenterX).toBeLessThanOrEqual(day9Box!.x + day9Box!.width);
  });
});
