# Using Gemini MCP Tool for Large Codebase Analysis

When analyzing large codebases or multiple files that might exceed context limits, use the Gemini MCP Tool with its massive context window. This tool bridges Claude with Google Gemini's large context capacity through natural language commands.

## MCP Tool Overview

The `gemini-mcp-tool` is a Model Context Protocol server that allows Claude to interact with Gemini AI for powerful file and codebase analysis. It uses natural language commands with `@` syntax for file inclusion.

**Installation Status**: ✅ Installed as `gemini-mcp-tool@1.1.1`

## File and Directory Inclusion Syntax

Use natural language commands with the `@` syntax to include files and directories. The paths should be relative to your current working directory:

### Examples:

**Single file analysis:**
```
Ask gemini to analyze @src/main.py and explain this file's purpose and structure
```

**Multiple files:**
```
Use gemini to analyze @package.json and @src/index.js to understand the dependencies used in the code
```

**Entire directory:**
```
Ask gemini to summarize the architecture of @src/ directory
```

**Multiple directories:**
```
Use gemini to analyze @src/ and @tests/ directories for test coverage analysis
```

**Current directory and subdirectories:**
```
Ask gemini to give an overview of @./ entire project structure
```

## Implementation Verification Examples

**Check if a feature is implemented:**
```
Ask gemini to analyze @src/ and @lib/ directories to check if dark mode has been implemented and show me the relevant files and functions
```

**Verify authentication implementation:**
```
Use gemini to examine @src/ and @middleware/ to determine if JWT authentication is implemented and list all auth-related endpoints and middleware
```

**Check for specific patterns:**
```
Ask gemini to analyze @src/ directory and find any React hooks that handle WebSocket connections, listing them with file paths
```

**Verify error handling:**
```
Use gemini to examine @src/ and @api/ directories to check if proper error handling is implemented for all API endpoints and show examples of try-catch blocks
```

**Check for rate limiting:**
```
Ask gemini to analyze @backend/ and @middleware/ directories to determine if rate limiting is implemented for the API and show implementation details
```

**Verify caching strategy:**
```
Use gemini to examine @src/, @lib/, and @services/ directories to check if Redis caching is implemented and list all cache-related functions and their usage
```

**Check for specific security measures:**
```
Ask gemini to analyze @src/ and @api/ directories to verify if SQL injection protections are implemented and show how user inputs are sanitized
```

**Verify test coverage for features:**
```
Use gemini to examine @src/payment/ and @tests/ directories to check if the payment processing module is fully tested and list all test cases
```

## When to Use Gemini MCP Tool

Use Gemini MCP tool when:
- Analyzing entire codebases or large directories that exceed Claude's context window
- Comparing multiple large files simultaneously
- Need to understand project-wide patterns or architecture
- Working with files totaling more than 100KB
- Verifying if specific features, patterns, or security measures are implemented
- Checking for the presence of certain coding patterns across the entire codebase
- Performing comprehensive codebase analysis that requires Gemini's large context window

## Setup and Configuration

### Prerequisites
- Node.js (v16.0.0+)
- MCP tool installed: `npm install -g gemini-mcp-tool` ✅
- Google Gemini API access (configured automatically)

### MCP Server Status
The Gemini MCP tool is installed and ready to use. It runs as an MCP server that bridges Claude with Google Gemini's analysis capabilities.

### Usage Notes
- Paths in @ syntax are relative to your current working directory
- Use natural language commands to interact with the tool
- The MCP server includes file contents directly in the context
- Gemini's context window can handle entire codebases that would overflow Claude's context
- When checking implementations, be specific about what you're looking for to get accurate results
- The tool works within Claude's MCP environment for seamless integration