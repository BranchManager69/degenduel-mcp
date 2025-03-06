// src/tools/screenshot.ts

/**
 * Screenshot tool
 *   - Takes in either "url" (a full URL) or "relativePath" to open on localhost:{PORT}
 *   - Returns a base64-encoded PNG screenshot
 */

import puppeteer from "puppeteer";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { PORT } from "../env/config.js";
//import OpenAI from "openai";
//import { OPENAI_API_KEY } from "../env/keys.js"; // not needed for this tool
//import { MODEL_FOR_SCREENSHOT } from "../env/ai.js"; // Screenshot Tool does not use an external AI model


// Define the tool name, description, and schema
export const screenshotToolName = "screenshot";
export const screenshotToolDescription =
  `Take a screenshot of a URL or a local path (relative URL appended to http://localhost:${PORT}).`;
export const ScreenshotToolSchema = z.object({
  url: z.string().optional().describe("Full URL to screenshot (e.g., https://example.com)"),
  relativePath: z.string().optional().describe(`Relative path appended to http://localhost:${PORT} (e.g., 'dashboard' becomes http://localhost:${PORT}/dashboard)`),
  fullPathToScreenshot: z.string().describe("Path where the screenshot will be saved (e.g., /tmp/screenshot.png)"),
});

// Run the Screenshot tool
export async function runScreenshotTool(
  args: z.infer<typeof ScreenshotToolSchema>,
) {
  // Determine final URL
  let finalUrl = args.url;
  if (!finalUrl) {
    if (!args.relativePath) {
      throw new Error("Must provide either 'url' or 'relativePath'");
    }
    finalUrl = `http://localhost:${PORT}/${args.relativePath.replace(/^\//, "")}`;
  }
  const fullPathToScreenshot = path.resolve(args.fullPathToScreenshot);

  // Launch Puppeteer with no-sandbox flag to avoid permission issues
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto(finalUrl);
  const screenshotBuffer = (await page.screenshot({
    fullPage: true,
  })) as Buffer;
  await browser.close();
  await fs.promises.writeFile(fullPathToScreenshot, screenshotBuffer);
  // Return the base64 representation and file path
  const base64Image = screenshotBuffer.toString('base64');
  
  return {
    content: [
      {
        type: "text",
        text: `Screenshot of ${finalUrl} has been captured and saved to ${fullPathToScreenshot}.`,
      },
      {
        type: "image",
        image_url: {
          url: `data:image/png;base64,${base64Image}`
        }
      }
    ],
  };
}
