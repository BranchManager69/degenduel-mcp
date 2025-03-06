# Logging System

DegenDuel MCP Server includes a robust logging system with colorful, informative output to help with debugging and monitoring.

## Overview

The logging system provides:
- Color-coded messages by severity level
- Emoji indicators for quick visual identification
- Special formatting options like "rainbow" text for important announcements
- Tool-specific logging in the screenshot module

## Default Logger

The main logging utility is defined in `src/env/logger.ts`:

```typescript
// src/env/logger.ts
import chalk from "chalk";

const logger = {
    info: (message: string) => console.log(chalk.cyan(`|  ℹ️ ${message}`)),
    success: (message: string) => console.log(chalk.green(`| ✅ ${message}`)),
    warning: (message: string) => console.log(chalk.yellow(`| ⚠️ ${message}`)),
    error: (message: string) => console.error(chalk.red(`| ❌ ${message}`)),
    highlight: (message: string) => console.log(chalk.magenta(`| 🔮 ${message}`)),
    rainbow: (message: string) => {
        const colors = [
        chalk.red,
        chalk.yellow,
        chalk.green,
        chalk.cyan,
        chalk.blue,
        chalk.magenta
        ];
        const coloredChars = message.split('').map((char, i) => 
        colors[i % colors.length](char)
        ).join('');
        console.log(coloredChars);
    }
};

export default logger;
```

## Screenshot Tool Logger

The screenshot tool includes its own specialized logger for detailed output during screenshot operations:

```typescript
// In screenshot.ts
const log = {
  info: (message: string) => console.log(chalk.blue(`🖼️ ${message}`)),
  success: (message: string) => console.log(chalk.green(`📸 ${message}`)),
  warning: (message: string) => console.log(chalk.yellow(`⚠️ ${message}`)),
  error: (message: string) => console.error(chalk.red(`❌ ${message}`)),
};
```

## Log Levels

The logging system uses the following levels:

| Level | Function | Color | Emoji | Use Case |
|-------|----------|-------|-------|----------|
| Info | `logger.info()` | Cyan | ℹ️ | General information messages |
| Success | `logger.success()` | Green | ✅ | Successful operations |
| Warning | `logger.warning()` | Yellow | ⚠️ | Non-critical issues |
| Error | `logger.error()` | Red | ❌ | Critical failures |
| Highlight | `logger.highlight()` | Magenta | 🔮 | Important operations starting |
| Rainbow | `logger.rainbow()` | Multiple | None | Server startup and major events |

## Example Usage

### Server Startup

```typescript
// In index.ts
logger.rainbow(`.========== DegenDuel MCP Server Starting ============.`);
logger.success(`MCP Server running on ${transportMode} transport`);
logger.info(`Port configured: ${port} (for screenshot tool)`);
logger.rainbow(`'====================================================='\n\n`);
```

### Tool Execution

```typescript
// In index.ts - callTool handler
logger.highlight(`📸 Taking screenshot with args: ${JSON.stringify(args)}`);
const result = await runScreenshotTool(validated);
logger.success(`Screenshot captured successfully!`);
```

### Error Handling

```typescript
// In index.ts - main error handler
main().catch((error) => {
  logger.error(`FATAL ERROR: ${error}`);
  process.exit(1);
});
```

## Viewing Logs

When running with PM2, you can view logs using:

```bash
# Standard mode
npm run logs

# HTTP mode
npm run logs:http
```

## Customizing the Logger

To customize or extend the logger:

1. Edit `src/env/logger.ts` to add new logging methods or modify existing ones
2. Import and use the logger in your modules:

```typescript
import logger from "./env/logger.js";

// Use the logger
logger.info("This is an informational message");
```

## Best Practices

- Use appropriate log levels based on message importance
- Include relevant contextual information in log messages
- Use `highlight` to mark the beginning of important operations
- Use `rainbow` sparingly for major system events
- Log both the start and successful completion of important operations