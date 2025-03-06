// src/env/logger.ts

import chalk from "chalk";


/**
 * Custom logger with colorful output
 */

// Custom colorful logger
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