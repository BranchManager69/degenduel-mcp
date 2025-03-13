// src/tools/apiTestGenerator.ts

/**
 * APITestGenerator tool
 *   - Analyzes API specifications or endpoint code and generates comprehensive test suites
 *   - Input: 'spec' (OpenAPI/Swagger spec or API code), 'framework' (test framework), 'outputFormat' (file format)
 */

import { z } from "zod";
import OpenAI from "openai";
import { OPENAI_API_KEY } from "../env/keys.js";
import { MODEL_FOR_TOOL_API_TEST_GENERATOR } from "../config/ai.js";
import fs from "fs";
import path from "path";
import logger from "../utils/logger.js";

// Define the tool name, description, and schema
export const apiTestGeneratorToolName = "apitests";
export const apiTestGeneratorToolDescription =
  "Analyzes API specifications or endpoint code and generates comprehensive test suites with edge cases, validations, and mocked dependencies.";

// Define a schema for supported test frameworks
const TestFrameworkEnum = z.enum([
  "jest",
  "mocha",
  "chai",
  "supertest",
  "playwright",
  "cypress",
]);

// Define a schema for supported output formats
const OutputFormatEnum = z.enum([
  "javascript", 
  "typescript",
]);

// Input schema
export const APITestGeneratorSchema = z.object({
  spec: z.string().min(1, "API specification or code is required."),
  framework: TestFrameworkEnum.default("jest"),
  outputFormat: OutputFormatEnum.default("javascript"),
  testDir: z.string().optional(),
  endpoints: z.array(z.string()).optional(),
  currentFilePath: z.string().optional().describe("Path to the currently open file for context"),
  contextType: z.enum(["file", "endpoint", "folder"]).optional().default("file").describe("What type of context to focus on"),
  projectRoot: z.string().optional().describe("Root directory of the project"),
});

// Run the APITestGenerator tool
// Helper function to determine related files
async function getRelatedFiles(
  currentFilePath: string,
  contextType: string,
  projectRoot?: string
): Promise<string[]> {
  const relatedFiles: string[] = [];
  
  try {
    // If we have a current file, always include it
    if (currentFilePath && fs.existsSync(currentFilePath)) {
      relatedFiles.push(currentFilePath);
      
      // Read the current file to understand its structure
      const fileContent = await fs.promises.readFile(currentFilePath, 'utf8');
      
      if (contextType === 'endpoint') {
        // Try to extract the endpoint from the file (basic heuristic)
        const endpointMatches = fileContent.match(/router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g);
        if (endpointMatches && endpointMatches.length > 0) {
          logger.info(`Found endpoints in file: ${endpointMatches.join(', ')}`);
        }
      }
      
      // Extract import/require statements to find related files
      const importMatches = fileContent.match(/(?:import|require).*?(?:from\s+['"](.+?)['"]|(['"])(.+?)\2)/g);
      if (importMatches) {
        for (const importMatch of importMatches) {
          const pathMatch = importMatch.match(/(?:from\s+['"](.+?)['"]|(['"])(.+?)\2)/);
          if (pathMatch) {
            const importPath = pathMatch[1] || pathMatch[3];
            if (!importPath.startsWith('.')) continue; // Skip non-relative imports
            
            // Resolve relative path
            const basedir = path.dirname(currentFilePath);
            let resolvedPath = path.resolve(basedir, importPath);
            
            // Handle directory imports or extension-less imports
            if (!path.extname(resolvedPath)) {
              // Try .js first, then .ts
              if (fs.existsSync(`${resolvedPath}.js`)) {
                resolvedPath += '.js';
              } else if (fs.existsSync(`${resolvedPath}.ts`)) {
                resolvedPath += '.ts';
              } else if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
                if (fs.existsSync(`${resolvedPath}/index.js`)) {
                  resolvedPath = `${resolvedPath}/index.js`;
                } else if (fs.existsSync(`${resolvedPath}/index.ts`)) {
                  resolvedPath = `${resolvedPath}/index.ts`;
                }
              }
            }
            
            if (fs.existsSync(resolvedPath)) {
              relatedFiles.push(resolvedPath);
            }
          }
        }
      }
    }
    
    // If contextType is folder and we have project root, add relevant sibling files
    if (contextType === 'folder' && currentFilePath) {
      const folderPath = path.dirname(currentFilePath);
      const files = await fs.promises.readdir(folderPath);
      
      for (const file of files) {
        const filePath = path.join(folderPath, file);
        if (fs.statSync(filePath).isFile() && 
            (file.endsWith('.js') || file.endsWith('.ts')) &&
            !relatedFiles.includes(filePath)) {
          relatedFiles.push(filePath);
        }
      }
    }
    
    // Limit to a reasonable number
    return relatedFiles.slice(0, 5);
  } catch (error) {
    logger.warning(`Failed to collect related files: ${error}`);
    return relatedFiles;
  }
}

export async function runAPITestGenerator(
  args: z.infer<typeof APITestGeneratorSchema>,
) {
  logger.highlight(`🧪 Generating API tests with args: ${JSON.stringify(args, null, 2)}`);
  
  // Instantiate the OpenAI client
  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });

  const { 
    spec, 
    framework, 
    outputFormat, 
    testDir, 
    endpoints, 
    currentFilePath, 
    contextType = 'file',
    projectRoot 
  } = args;
  
  // Get context-aware additional information
  let contextData = '';
  let shouldFocusOnSpec = true;
  
  if (currentFilePath) {
    logger.info(`Context provided: ${currentFilePath} (type: ${contextType})`);
    
    // Collect related files to provide context
    const relatedFiles = await getRelatedFiles(currentFilePath, contextType, projectRoot);
    
    if (relatedFiles.length > 0) {
      logger.info(`Analyzing ${relatedFiles.length} related files for context`);
      
      // Read the content of all related files
      let contextFiles = '';
      for (const filePath of relatedFiles) {
        try {
          const content = await fs.promises.readFile(filePath, 'utf8');
          const relativePath = projectRoot ? path.relative(projectRoot, filePath) : filePath;
          contextFiles += `\n/* File: ${relativePath} */\n${content}\n\n`;
        } catch (error) {
          logger.warning(`Could not read file ${filePath}: ${error}`);
        }
      }
      
      if (contextFiles) {
        contextData = `\n\nADDITIONAL CONTEXT (related files):\n${contextFiles}`;
        shouldFocusOnSpec = false;
      }
    }
  }
  
  // Determine if we need to modify the prompt based on context
  let focusedSpec = spec;
  let endpointInfo = "";
  
  // Extract endpoints from context if available
  const extractedEndpoints = new Set<string>();
  
  if (currentFilePath && contextType === 'endpoint') {
    try {
      const content = await fs.promises.readFile(currentFilePath, 'utf8');
      const routeMatches = content.match(/\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g);
      
      if (routeMatches) {
        for (const match of routeMatches) {
          const endpointMatch = match.match(/(['"])([^'"]+)\1/);
          if (endpointMatch && endpointMatch[2]) {
            extractedEndpoints.add(endpointMatch[2]);
          }
        }
      }
    } catch (error) {
      logger.warning(`Could not extract endpoints from file: ${error}`);
    }
  }
  
  // Add explicitly specified endpoints
  if (endpoints && endpoints.length > 0) {
    endpoints.forEach(ep => extractedEndpoints.add(ep));
  }
  
  // If we have extracted endpoints, include them in the prompt
  if (extractedEndpoints.size > 0) {
    endpointInfo = `\nFocus specifically on these endpoints: ${Array.from(extractedEndpoints).join(", ")}`;
    logger.info(`Found ${extractedEndpoints.size} endpoints to focus on`);
  }
  
  // Create a filename for the test
  let suggestedFileName = "api";
  if (currentFilePath) {
    const baseName = path.basename(currentFilePath, path.extname(currentFilePath));
    suggestedFileName = baseName;
    
    // If it's a controller or route file, keep that context
    if (baseName.includes('controller') || baseName.includes('route')) {
      suggestedFileName = baseName;
    } else if (extractedEndpoints.size === 1) {
      suggestedFileName = Array.from(extractedEndpoints)[0]
        .replace(/^\/+|\/+$/g, '') // Trim leading/trailing slashes
        .replace(/\//g, '-');      // Replace slashes with dashes
    }
  }
  
  // Prepare the system prompt with detailed instructions about the expected output format
  const systemPrompt = `You are an expert API test engineer. Generate comprehensive test suites for APIs based on specifications or code.

Your tests must follow these strict requirements:
1. Write tests in ${outputFormat} using the ${framework} framework
2. Include tests for edge cases, validations, error conditions, and success scenarios
3. Use proper mocking for external dependencies and database calls
4. Follow best practices for the specified test framework
5. Include appropriate assertions for each test case
6. Use descriptive test names that explain what's being tested
7. Group tests logically by endpoint, feature, or scenario
${shouldFocusOnSpec ? '' : '8. IMPORTANT: Focus only on endpoints/functionality from the currently viewed file and related context'}

FORMAT REQUIREMENTS:
- Return valid, runnable code only
- Include all necessary imports at the top
- For JavaScript: Use modern JS syntax (ES6+) with proper semicolons
- For TypeScript: Include proper type definitions and interfaces
- Include setup/teardown functions where appropriate
- Add detailed comments explaining complex test logic
- Format code with proper indentation and spacing

IMPORTANT: DO NOT include any explanations outside the code blocks. Return ONLY valid ${outputFormat} code that can be directly saved to a file and executed.`;

  // Define the user prompt
  const userPrompt = `Generate a comprehensive test suite for the following API ${outputFormat === "typescript" ? "in TypeScript" : "in JavaScript"} using the ${framework} framework.

API Specification or Code:
\`\`\`
${focusedSpec}
\`\`\`
${endpointInfo}
${!shouldFocusOnSpec ? contextData : ''}

${currentFilePath ? `Based on the context, this test should be focused on testing the functionality in: ${path.basename(currentFilePath)}` : ''}
${suggestedFileName ? `Suggested filename for this test: ${suggestedFileName}.test.${outputFormat === 'typescript' ? 'ts' : 'js'}` : ''}

Return a complete, runnable test suite that I can save directly to a file. Follow all format requirements strictly.`;

  try {
    logger.info(`Calling OpenAI model: ${MODEL_FOR_TOOL_API_TEST_GENERATOR}`);
    const response = await openai.chat.completions.create({
      model: MODEL_FOR_TOOL_API_TEST_GENERATOR,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5, // higher temperature = more "creative" test scenarios
    });

    // Extract the content from the assistant's message
    const assistantMessage = response.choices?.[0]?.message?.content ?? "No response from model.";
    
    // Extract code from the response if it's wrapped in markdown code blocks
    const codePattern = /\`\`\`(?:javascript|typescript|js|ts)?\s*([\s\S]*?)\`\`\`/;
    const match = assistantMessage.match(codePattern);
    const testCode = match ? match[1].trim() : assistantMessage;
    
    // Save the file if testDir is provided
    if (testDir) {
      try {
        // Make sure the directory exists
        if (!fs.existsSync(testDir)) {
          fs.mkdirSync(testDir, { recursive: true });
        }
        
        // Use the suggested filename if available
        const filename = `${suggestedFileName}.test.${outputFormat === "typescript" ? "ts" : "js"}`;
        
        // Save the file
        const filePath = path.join(testDir, filename);
        fs.writeFileSync(filePath, testCode);
        logger.success(`Test file saved to: ${filePath}`);
      } catch (err: any) {
        logger.error(`Failed to save test file: ${err.message}`);
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `# API Test Suite Generated (${framework} - ${outputFormat})\n\`\`\`${outputFormat}\n${testCode}\n\`\`\``,
        },
      ],
    };
  } catch (error: any) {
    logger.error(`OpenAI Error: ${error.message || error}`);
    
    // If the request fails, return the error as text
    return {
      content: [
        {
          type: "text",
          text: `Error generating API tests: ${error.message || error}`,
        },
      ],
    };
  }
}