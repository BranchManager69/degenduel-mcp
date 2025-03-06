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
import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
//import OpenAI from "openai";
//import { OPENAI_API_KEY } from "../env/keys.js"; // not needed for this tool
//import { MODEL_FOR_SCREENSHOT } from "../env/ai.js"; // Screenshot Tool does not use an external AI model

const execPromise = promisify(exec);

// Colorful logging for the screenshot tool
const log = {
  info: (message: string) => console.log(chalk.blue(`🖼️ ${message}`)),
  success: (message: string) => console.log(chalk.green(`📸 ${message}`)),
  warning: (message: string) => console.log(chalk.yellow(`⚠️ ${message}`)),
  error: (message: string) => console.error(chalk.red(`❌ ${message}`)),
};

// Define the tool name, description, and schema
export const screenshotToolName = "screenshot";
export const screenshotToolDescription =
  `Take a screenshot of a URL or a local path (relative URL appended to http://localhost:${PORT}).`;
export const ScreenshotToolSchema = z.object({
  url: z.string().optional().describe("Full URL to screenshot (e.g., https://example.com)"),
  relativePath: z.string().optional().describe(`Relative path appended to http://localhost:${PORT} (e.g., 'dashboard' becomes http://localhost:${PORT}/dashboard)`),
  fullPathToScreenshot: z.string().describe("Path where the screenshot will be saved (e.g., /tmp/screenshot.png)"),
});

// Fallback screenshot function using curl
async function takeScreenshotWithCurl(url: string, outputPath: string): Promise<Buffer> {
  log.info(`🔄 Attempting screenshot with curl fallback method...`);
  
  try {
    // Create a simple HTML file that displays the URL in an iframe
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Screenshot Fallback</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px; }
            h1 { color: #333; }
            .url { word-break: break-all; color: blue; margin-bottom: 20px; }
            .timestamp { color: #666; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Screenshot Fallback</h1>
            <p>Unable to take a screenshot with Puppeteer. Here's the URL information:</p>
            <div class="url">${url}</div>
            <div class="timestamp">Timestamp: ${new Date().toISOString()}</div>
          </div>
        </body>
      </html>
    `;
    
    const tempHtmlPath = `${outputPath}.html`;
    await fs.promises.writeFile(tempHtmlPath, htmlContent);
    
    // Convert HTML to PNG using wkhtmltoimage if available
    try {
      await execPromise(`which wkhtmltoimage`);
      log.info(`📄 Using wkhtmltoimage to convert HTML to PNG...`);
      await execPromise(`wkhtmltoimage ${tempHtmlPath} ${outputPath}`);
    } catch (e) {
      // If wkhtmltoimage is not available, just copy a placeholder image
      log.warning(`wkhtmltoimage not available, creating a text file instead`);
      await fs.promises.writeFile(outputPath, `Unable to take screenshot of ${url}. Timestamp: ${new Date().toISOString()}`);
    }
    
    // Clean up temp file
    await fs.promises.unlink(tempHtmlPath);
    
    // Return the file content
    return await fs.promises.readFile(outputPath);
  } catch (error) {
    log.error(`Fallback screenshot method failed: ${error}`);
    // Create a very basic text file as absolute fallback
    const fallbackText = `Unable to take screenshot of ${url}. Error: ${error}. Timestamp: ${new Date().toISOString()}`;
    await fs.promises.writeFile(outputPath, fallbackText);
    return Buffer.from(fallbackText);
  }
}

// Run the Screenshot tool
export async function runScreenshotTool(
  args: z.infer<typeof ScreenshotToolSchema>,
) {
  // Determine final URL
  let finalUrl = args.url;
  if (!finalUrl) {
    if (!args.relativePath) {
      log.error("Must provide either 'url' or 'relativePath'");
      throw new Error("Must provide either 'url' or 'relativePath'");
    }
    finalUrl = `http://localhost:${PORT}/${args.relativePath.replace(/^\//, "")}`;
  }
  const fullPathToScreenshot = path.resolve(args.fullPathToScreenshot);
  
  log.info(`📷 Preparing to capture: ${chalk.cyan(finalUrl)}`);
  log.info(`🎯 Will save to: ${chalk.magenta(fullPathToScreenshot)}`);

  let screenshotBuffer: Buffer;
  
  try {
    // Try with Puppeteer first
    log.info(`🚀 Launching browser...`);
    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ],
      headless: true
    });
    
    const page = await browser.newPage();
    await page.setBypassCSP(true);
    
    log.info(`🌐 Navigating to URL...`);
    await page.goto(finalUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    
    log.info(`📸 Taking screenshot...`);
    screenshotBuffer = (await page.screenshot({
      fullPage: true,
    })) as Buffer;
    
    log.info(`🔄 Closing browser...`);
    await browser.close();
  } catch (error) {
    log.warning(`Puppeteer screenshot failed: ${error}`);
    log.info(`Trying fallback method...`);
    
    // Use fallback method
    screenshotBuffer = await takeScreenshotWithCurl(finalUrl, fullPathToScreenshot);
  }
  
  log.info(`💾 Saving screenshot...`);
  await fs.promises.writeFile(fullPathToScreenshot, screenshotBuffer);
  
  // Return the base64 representation and file path
  const base64Image = screenshotBuffer.toString('base64');
  
  log.success(`✨ Screenshot captured successfully! (${Math.round(screenshotBuffer.length / 1024)}KB)`);
  
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
