// src/env/ai.ts

/**
 * AI configuration for each tool
 */

// Model to use for each tool
const MODEL_FOR_TOOL_SCREENSHOT = "o3-mini";          // options: o3-mini, o1-mini, o1
const MODEL_FOR_TOOL_ARCHITECT = "o3-mini";           // options: o3-mini, o1-mini, o1
const MODEL_FOR_TOOL_CODE_REVIEW = "o3-mini";         // options: o3-mini, o1-mini, o1
const MODEL_FOR_TOOL_API_TEST_GENERATOR = "o3-mini";  // options: o3-mini, o1-mini, o1

// Export the AI config
export { 
    MODEL_FOR_TOOL_SCREENSHOT, 
    MODEL_FOR_TOOL_ARCHITECT, 
    MODEL_FOR_TOOL_CODE_REVIEW, 
    MODEL_FOR_TOOL_API_TEST_GENERATOR 
};