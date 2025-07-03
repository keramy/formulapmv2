# Gemini MCP Tool Usage Guide
## For Formula PM Team Development

### **📋 Overview**
The Gemini MCP Tool (`gemini-mcp-tool@1.1.1`) is installed and configured for large codebase analysis. It bridges Claude with Google Gemini's massive context window for comprehensive file and directory analysis.

---

## **🔧 Installation Status**
✅ **Installed**: `gemini-mcp-tool@1.1.1` via npm global  
✅ **Location**: `/home/kerem/.nvm/versions/node/v20.19.3/lib/node_modules/gemini-mcp-tool`  
✅ **Binary**: Available as `gemini-mcp` command  
✅ **Prerequisites**: Node.js v20.19.3 ✅

---

## **🎯 When to Use Gemini MCP Tool**

### **Ideal Use Cases:**
- **Large Codebase Analysis**: Analyzing entire `/src/` directory structure
- **Pattern Detection**: Finding specific patterns across multiple files
- **Architecture Review**: Understanding project-wide relationships
- **Feature Verification**: Checking if features are implemented correctly
- **Code Quality Audit**: Comprehensive analysis of code standards
- **Context Overflow**: When Claude's context window is insufficient

### **Current Formula PM Examples:**
```
# Analyze entire Wave 2B implementation
Ask gemini to analyze @src/ directory and summarize the scope management and task management implementations

# Check pattern compliance across all components  
Use gemini to examine @src/components/ and @Patterns/ to verify if all implementations follow documented patterns

# Verify authentication integration
Ask gemini to analyze @src/hooks/, @src/lib/, and @src/app/api/auth/ to check JWT authentication implementation

# Review database integration
Use gemini to examine @supabase/migrations/ and @src/lib/ to analyze database schema and client integration
```

---

## **📝 Correct Usage Syntax**

### **❌ Old Syntax (Don't Use):**
```bash
# WRONG - Direct CLI commands
gemini -p "@src/ analyze this directory"
gemini --all_files -p "Check the codebase"
```

### **✅ New Syntax (Correct MCP Usage):**
```
# CORRECT - Natural language MCP commands
Ask gemini to analyze @src/ directory and explain the architecture

Use gemini to examine @src/components/ and list all React components with their purposes

Request gemini to analyze @package.json and @src/ to understand project dependencies and usage
```

---

## **🔍 Formula PM Specific Examples**

### **Wave Implementation Analysis**
```
# Check Wave 1 Foundation completion
Ask gemini to analyze @src/lib/, @src/hooks/, and @src/components/ui/ to verify Wave 1 foundation implementation status

# Verify Wave 2A integration
Use gemini to examine @src/app/dashboard/ and @src/hooks/useProjects.ts to check project management integration

# Review Wave 2B features
Ask gemini to analyze @src/components/scope/ and @src/components/tasks/ to verify scope and task management implementations
```

### **Pattern Compliance Verification**
```
# Check authentication patterns
Use gemini to examine @src/hooks/useAuth.ts, @src/lib/permissions.ts, and @Patterns/authentication-pattern.md to verify pattern compliance

# Verify UI component patterns  
Ask gemini to analyze @src/components/ui/ and @Patterns/ui-component-pattern.md to check component library consistency

# Review database patterns
Use gemini to examine @supabase/migrations/ and @Patterns/database-implementation-pattern.md to verify schema compliance
```

### **Quality Assurance**
```
# Check TypeScript compliance
Ask gemini to analyze @src/ directory and identify any TypeScript errors or type safety issues

# Verify role-based access control
Use gemini to examine @src/hooks/usePermissions.ts and all component files to check if role-based access is properly implemented

# Review error handling
Ask gemini to analyze @src/app/api/ directory and check if all endpoints have proper error handling and validation
```

### **Integration Testing**
```
# Check Wave integration
Use gemini to analyze @src/ and verify how Wave 1, 2A, and 2B components integrate with each other

# Verify database integration
Ask gemini to examine @src/lib/supabase.ts and all hook files to check database client usage consistency

# Review API integration
Use gemini to analyze @src/app/api/ and @src/hooks/ to verify frontend-backend integration patterns
```

---

## **⚠️ Troubleshooting**

### **Common Issues:**

#### **1. MCP Server Not Responding**
```bash
# Restart MCP server
npx -y gemini-mcp-tool
# Should show: "Gemini CLI MCP server is running on stdio"
```

#### **2. File Path Issues**
- Ensure paths in `@` syntax are relative to current working directory
- Use `/mnt/c/Users/Kerem/Desktop/formulapmv2/` as base path
- Check file exists before analysis: `ls @src/` 

#### **3. Large Directory Analysis**
- For very large directories, be specific about what to analyze
- Use subdirectory analysis: `@src/components/` instead of `@src/`
- Break down analysis into smaller chunks

#### **4. API Key Issues**
- Gemini API access should be configured automatically
- If API errors occur, check network connectivity
- Tool may need Google Cloud authentication setup

---

## **📊 Performance Guidelines**

### **Optimal Usage:**
- **Small Analysis**: Single files or small directories (< 10 files)
- **Medium Analysis**: Component directories or feature modules (10-50 files)  
- **Large Analysis**: Entire `/src/` directory or full project analysis (50+ files)

### **Response Times:**
- **Small**: 2-5 seconds
- **Medium**: 5-15 seconds  
- **Large**: 15-60 seconds

### **Best Practices:**
- Be specific in your requests for faster, more relevant responses
- Use natural language that clearly describes what you want to analyze
- Include context about what you're looking for (patterns, issues, compliance)
- Break complex analysis into multiple focused requests

---

## **🔄 Integration with Development Workflow**

### **Code Review Process:**
1. **Pre-commit Analysis**: Check pattern compliance before commits
2. **Feature Verification**: Verify feature implementation before PR creation
3. **Architecture Review**: Analyze integration points before deployment
4. **Quality Assurance**: Check code standards across entire codebase

### **Documentation Updates:**
- Use results to update `/Patterns/` documentation
- Verify pattern coverage in `PATTERN_COVERAGE_SUMMARY.md`
- Update implementation status in project documentation

### **Team Collaboration:**
- Share analysis results for code review discussions
- Use for onboarding new team members to understand codebase
- Generate architecture summaries for stakeholder communication

---

## **✅ Success Verification**

### **Test MCP Tool:**
Try this test command to verify the tool works correctly:
```
Ask gemini to analyze @package.json and provide a summary of the Formula PM project dependencies and scripts
```

**Expected Response**: Should analyze package.json and provide detailed breakdown of dependencies, scripts, and project configuration.

### **Status Check:**
- ✅ **Tool Installed**: gemini-mcp-tool@1.1.1
- ✅ **Documentation Updated**: CLAUDE.md reflects correct MCP syntax  
- ✅ **Usage Examples**: All examples use natural language MCP commands
- ✅ **Formula PM Integration**: Ready for codebase analysis

**The Gemini MCP Tool is now properly configured and ready for Formula PM development!** 🚀