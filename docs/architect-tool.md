# Architect Tool

The Architect tool generates development plans and architecture designs using OpenAI's advanced models.

## Overview

This tool helps with:
- Planning software architecture for new features
- Designing component structures
- Creating implementation roadmaps
- Suggesting best practices
- Providing code examples

It analyzes your existing code and task description to produce a comprehensive development plan.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| task | string | Yes | Description of the development task or problem |
| code | string | Yes | Concatenated code from one or more files for context |

## Examples

### Planning a New Feature

```javascript
{
  "name": "architect",
  "arguments": {
    "task": "Create a responsive navbar component with dropdown menus",
    "code": "// Current App.js\nimport React from 'react';\n\nfunction App() {\n  return (\n    <div className=\"App\">\n      <header>My App</header>\n      <main>Content goes here</main>\n    </div>\n  );\n}\n\nexport default App;"
  }
}
```

### Refactoring Existing Code

```javascript
{
  "name": "architect",
  "arguments": {
    "task": "Refactor this authentication code to use React Context instead of prop drilling",
    "code": "// Current components\nfunction LoginPage({onLogin}) {\n  const [username, setUsername] = useState('');\n  const [password, setPassword] = useState('');\n  \n  const handleSubmit = (e) => {\n    e.preventDefault();\n    onLogin(username, password);\n  }\n  \n  return (\n    <form onSubmit={handleSubmit}>\n      {/* form fields */}\n    </form>\n  );\n}\n\nfunction App() {\n  const [user, setUser] = useState(null);\n  \n  const handleLogin = (username, password) => {\n    // authentication logic\n    setUser({username});\n  }\n  \n  return (\n    <div>\n      {user ? (\n        <Dashboard user={user} />\n      ) : (\n        <LoginPage onLogin={handleLogin} />\n      )}\n    </div>\n  );\n}\n\nfunction Dashboard({user}) {\n  return <div>Welcome, {user.username}</div>;\n}"
  }
}
```

## Response

The tool returns a structured architecture plan with sections like:

```
# Architecture Plan: Responsive Navbar with Dropdowns

## Overview
This plan outlines how to implement a responsive navbar component with dropdown menus for your React application.

## Component Structure
- NavBar (main container)
  - Logo
  - NavLinks
    - NavLink
    - DropdownMenu
      - DropdownItem

## Implementation Steps
1. Create base NavBar component
2. Implement responsive design with media queries
3. Build dropdown functionality
4. Add animations and transitions
5. Integrate with existing app

## Code Examples
```jsx
// NavBar.jsx
import React, { useState } from 'react';
import './NavBar.css';

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  
  return (
    <nav className="navbar">
      {/* Component implementation */}
    </nav>
  );
};
```

## Considerations
- Mobile-first approach recommended
- Accessibility concerns addressed with ARIA attributes
- Performance optimizations suggested
```

## Implementation Details

The Architect tool:

1. Validates input parameters
2. Connects to OpenAI using the configured API key
3. Sends a carefully structured prompt to the AI model
4. Formats the response into a structured plan
5. Returns the plan to the client

## Configuration

The Architect tool uses these configuration settings:

```typescript
// In src/env/keys.ts
export const OPENAI_API_KEY = "your-openai-api-key"; // Required

// In src/env/ai.ts
const MODEL_FOR_TOOL_ARCHITECT = "o3-mini-2025-01-31"; // Model to use
```

## Best Practices

- Provide a clear, specific task description
- Include relevant code context
- Focus on one architectural challenge at a time
- Provide enough context about your tech stack
- Review and adapt the suggestions to your specific needs

## Limitations

- The generated plans are suggestions, not definitive solutions
- Quality depends on the clarity of your task description
- Code examples may need customization for your specific environment
- The tool works best with context that includes imports and dependencies
- Large codebases may need to be summarized or reduced to relevant parts

## Error Handling

The tool handles errors such as:

- Missing or invalid parameters
- OpenAI API connection issues
- Rate limiting or quota exceeded
- Invalid responses from the AI model

For troubleshooting:
- Verify your OpenAI API key is valid and has sufficient credits
- Check network connectivity to OpenAI's API
- Ensure the specified AI model is available to your account
- Try breaking down complex tasks into smaller, more focused requests