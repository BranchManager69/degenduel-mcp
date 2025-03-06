// src/tools/architect.ts

/**
 * Architect tool
 *   - Calls an OpenAI model (o3-mini-01-31-24) to generate a series of steps
 *   - Input: 'task' (description of the task), 'code' (one or more code files concatenated)
 */

import { z } from "zod";
//import { PORT } from "../env/config.js";
import OpenAI from "openai";
import { OPENAI_API_KEY } from "../env/keys.js";
import { MODEL_FOR_TOOL_ARCHITECT } from "../env/ai.js";


// Define the tool name, description, and schema
export const architectToolName = "architect";
export const architectToolDescription =
  "Analyzes a task description plus some code, then outlines steps for an AI coding agent.";
export const ArchitectToolSchema = z.object({
  task: z.string().min(1, "Task description is required."),
  code: z
    .string()
    .min(1, "Code string is required (one or more files concatenated)."),
});

// Run the Architect tool
// TODO: add a timeout
export async function runArchitectTool(
  args: z.infer<typeof ArchitectToolSchema>,
) {
  // Instantiate the new OpenAI client
  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });

  const { task, code } = args;
  const systemPrompt = `You are an expert software architect. Given a task and some code, outline the steps that an AI coding agent should take to complete or improve the code.`;

  // We'll prompt the model with both the task and code
  const userPrompt = `Task: ${task}\n\nCode:\n${code}\n\nPlease provide a step-by-step plan.`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL_FOR_TOOL_ARCHITECT,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    // Extract the content from the assistant's message (if available)
    const assistantMessage =
      response.choices?.[0]?.message?.content ?? "No response from model.";

    return {
      content: [
        {
          type: "text",
          text: assistantMessage,
        },
      ],
    };
  } catch (error: any) {
    // If the request fails, return the error as text
    return {
      content: [
        {
          type: "text",
          text: `OpenAI Error: ${error.message || error}`,
        },
      ],
    };
  }
}
