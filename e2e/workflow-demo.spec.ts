import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

test("homepage entrance runs to completion without a click", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".ww-launch-intro video")).toBeVisible();
  await expect(page.locator(".ww-entrance-on")).toBeVisible({timeout:12000});
  await expect(page.getByRole("button", {name:/Run example|Approve example|Service request/})).toHaveCount(0);
  await expect.poll(() => page.locator(".ww-outcome").last().evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
  await expect.poll(() => page.locator(".ww-energy-paths path:not(.ww-flow-packet)").last().evaluate(el => getComputedStyle(el).strokeDashoffset)).toBe("0px");
  await expect(page.locator(".ww-hero h1")).toBeVisible();
  await page.locator(".ww-hero").getByRole("link",{name:"Assess your operations"}).click();
  await expect(page).toHaveURL(/assessment$/);
});

test("entrance remains readable on mobile and with reduced motion", async ({ page }) => {
  await mkdir("output/wonder-workflow/qa",{recursive:true});
  await page.emulateMedia({reducedMotion:"reduce"});
  for (const width of [1440,390]) {
    await page.setViewportSize({width,height:900});
    await page.goto("/");
    await expect(page.locator(".ww-operating-scene")).toBeVisible();
    await expect(page.locator("video")).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:"output/wonder-workflow/qa/automatic-entrance-"+width+".png",fullPage:true});
  }
});


test("explicit full motion works even when browser prefers reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?motion=full");
  const video = page.locator(".ww-launch-intro video");
  await expect(video).toBeVisible();
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime > 0 && !v.paused)).toBe(true);
  await page.screenshot({path:"output/wonder-workflow/qa/live-logo-playing.png"});
  await expect(page.locator(".ww-launch-intro")).toHaveCount(0, {timeout:12000});
  const packet = page.locator(".ww-flow-packet").first();
  await expect.poll(() => packet.evaluate(el => getComputedStyle(el).animationName)).toBe("ww-live-packet");
  const first = await packet.evaluate(el => getComputedStyle(el).strokeDashoffset);
  await expect.poll(() => packet.evaluate(el => getComputedStyle(el).strokeDashoffset)).not.toBe(first);
  const phase = await page.locator(".ww-live-scene").getAttribute("data-phase");
  await expect.poll(() => page.locator(".ww-live-scene").getAttribute("data-phase")).not.toBe(phase);
  await page.getByRole("button",{name:"Pause animation"}).click();
  await expect.poll(() => packet.evaluate(el => getComputedStyle(el).animationPlayState)).toBe("paused");
  await page.getByRole("button",{name:"Resume animation"}).click();
  await expect.poll(() => packet.evaluate(el => getComputedStyle(el).animationPlayState)).toBe("running");
  await page.screenshot({path:"output/wonder-workflow/qa/live-workflow-running.png"});
  await page.goto("/");
  await expect(page.locator(".ww-site")).toHaveClass(/ww-full-motion/);
  await page.getByRole("button",{name:"Skip intro"}).click();
  await expect(page.locator(".ww-launch-intro")).toHaveCount(0);
  await page.locator(".ww-hero").getByRole("link",{name:"Assess your operations"}).click();
  await expect(page).toHaveURL(/assessment$/);
});
