# Code Review Tool

The Code Review tool analyzes git differences to provide automated code reviews and suggested improvements.

## Overview

This tool performs:
- Analysis of changes between branches
- Code quality assessments
- Best practice recommendations
- Security vulnerability checks
- Performance optimization suggestions

The tool is particularly useful for pre-commit reviews, pull request preparation, and code quality maintenance.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| folderPath | string | Yes | Path to the repository root directory |

## Examples

### Basic Code Review

```javascript
{
  "name": "codeReview",
  "arguments": {
    "folderPath": "/home/user/projects/my-repo"
  }
}
```

## Response

The tool returns a comprehensive code review report structured like:

```
# Code Review: Feature Branch

## Summary of Changes
- 5 files changed, 102 insertions(+), 24 deletions(-)
- Main areas: Authentication module, API handlers, and test files

## Key Findings

### Strengths
- Well-structured error handling
- Good test coverage on new features
- Consistent naming conventions

### Areas for Improvement
- Authentication logic contains potential edge cases
- Missing input validation in API endpoints
- Performance concern: Unnecessary re-renders in UserProfile component

## Detailed Review

### src/auth/login.js
- Line 45: Consider using a more secure hash function than MD5
- Line 67-80: This promise chain could be simplified with async/await
- Line 120: Memory leak potential in useEffect

### src/api/users.js
- Line 33: Missing input validation before database query
- Line 98: Good error handling pattern
- Line 145: API endpoint should use rate limiting

## Recommendations
1. Add input validation to all API endpoints
2. Refactor authentication logic to address edge cases
3. Replace MD5 with a more secure hashing algorithm
4. Implement proper cleanup in React components
```

## Implementation Details

The Code Review tool:

1. Validates the repository path
2. Executes git commands to retrieve changes
3. Analyzes the changes with AI assistance
4. Structures the results into a comprehensive review
5. Returns the review to the client

## Configuration

The Code Review tool uses the following configuration:

```typescript
// In src/env/ai.ts
const MODEL_FOR_TOOL_CODE_REVIEW = "o3-mini-2025-01-31"; // Model to use
```

## Best Practices

- Run on focused branches with related changes
- Use on repositories with active development
- Provide a valid path to the repository root
- Review changes before committing
- Consider running before creating pull requests

## Advanced Usage

### Specific Branch Reviews

By default, the tool compares against the main branch. You can modify the implementation to specify different comparison branches.

### Custom Rules

The tool's behavior can be customized by modifying its implementation to enforce specific coding standards or focus on particular types of issues.

## Limitations

- Analysis quality depends on the AI model used
- May not catch all possible issues
- Works best with changes that have clear context
- Requires a valid git repository
- Performance may degrade with very large diffs

## Error Handling

The tool handles errors such as:

- Invalid repository paths
- Git command failures
- Repository permission issues
- Large or complex diffs that exceed processing limits

For troubleshooting:
- Verify the repository path is correct
- Ensure git is installed and working properly
- Check that the repository has a valid git history
- Consider breaking large reviews into smaller chunks

## Security Considerations

- The tool accesses local file content for analysis
- Be cautious when reviewing code containing sensitive information
- Avoid exposing API keys, credentials, or personal data in the code being reviewed