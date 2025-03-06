# Screenshot Tool

The Screenshot tool captures web pages and local applications for visual analysis and reference.

## Overview

This tool uses Puppeteer to take screenshots of:
- Public websites via their URL
- Local applications via a relative path to your localhost server

The tool saves images to a specified file path and also returns the image directly in the conversation when used with Claude Code.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | No* | Full URL to screenshot (e.g., https://example.com) |
| relativePath | string | No* | Relative path appended to http://localhost:PORT (e.g., 'dashboard') |
| fullPathToScreenshot | string | Yes | Path where the screenshot will be saved (e.g., /tmp/screenshot.png) |

\* Either `url` or `relativePath` must be provided

## Examples

### Taking a Screenshot of a Website

```javascript
{
  "name": "screenshot",
  "arguments": {
    "url": "https://github.com",
    "fullPathToScreenshot": "/tmp/github-screenshot.png"
  }
}
```

### Taking a Screenshot of a Local Application

```javascript
{
  "name": "screenshot",
  "arguments": {
    "relativePath": "dashboard",
    "fullPathToScreenshot": "/tmp/local-dashboard.png"
  }
}
```

## Response

The tool returns a multi-part response:

```javascript
{
  "content": [
    {
      "type": "text",
      "text": "Screenshot of https://github.com has been captured and saved to /tmp/github-screenshot.png."
    },
    {
      "type": "image",
      "image_url": {
        "url": "data:image/png;base64,..."
      }
    }
  ]
}
```

## Implementation Details

The Screenshot tool uses Puppeteer, a headless Chrome browser, to render and capture web pages. The implementation:

1. Validates input parameters
2. Constructs the target URL from either direct URL or relative path
3. Launches a headless browser
4. Navigates to the target URL
5. Takes a full-page screenshot
6. Saves the image to the specified path
7. Returns the image as base64 data

## Configuration

The Screenshot tool uses the PORT setting from `src/env/config.ts` when constructing URLs for relative paths:

```typescript
// In src/env/config.ts
const PORT = 3333; // Used for http://localhost:PORT/{relativePath}
```

## Best Practices

- For public websites, use the `url` parameter with a complete URL
- For local applications, use the `relativePath` parameter
- Always provide a writable path for `fullPathToScreenshot`
- Use descriptive filenames with .png extension
- Consider using timestamp-based filenames to avoid overwriting

## Limitations

- Requires network access to the target URL
- May not render pages that require authentication
- Dynamic content might not be fully loaded if it depends on user interaction
- Maximum file size might be limited by your system's memory

## Error Handling

The tool handles several common errors:

- Missing required parameters
- Invalid URLs
- Failed network requests
- Permission issues when saving files

For troubleshooting:
- Check if the URL is accessible in a regular browser
- Verify the target directory is writable
- Ensure Puppeteer dependencies are installed if running on Linux