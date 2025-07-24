#!/usr/bin/env node

/**
 * Documentation Analyzer
 * Analyzes documentation and code maintainability in the codebase
 */

const fs = require('fs');
const path = require('path');

class DocumentationAnalyzer {
  constructor() {
    this.results = {
      documentationFiles: [],
      codeDocumentation: [],
      apiDocumentation: [],
      workflowDocumentation: [],
      missingDocumentation: [],
      filesAnalyzed: 0
    };

    // File extensions to analyze
    this.fileExtensions = ['.ts', '.tsx', '.js', '.jsx', '.md'];

    // Directories to exclude
    this.excludeDirs = ['node_modules', '.git', '.next', 'dist', 'build', 'coverage'];
    
    // Documentation patterns to look for
    this.docPatterns = [
      '/**', // JSDoc comments
      '@param', // Parameter documentation
      '@returns', // Return value documentation
      '@example', // Examples
      '@description', // Descriptions
      '@typedef', // Type definitions
      '@interface', // Interface definitions
      '@deprecated', // Deprecation notices
      '// NOTE:', // Notes
      '// TODO:', // TODOs
      '// FIXME:', // FIXMEs
      '// WARNING:', // Warnings
    ];
  }

  /**
   * Main execution method
   */
  async execute() {
    console.log('🔍 ANALYZING DOCUMENTATION AND MAINTAINABILITY');
    console.log('===========================================');
    console.log('Scanning codebase for documentation and maintainability issues...');

    // Find documentation files
    console.log('\nFinding documentation files...');
    this.findDocumentationFiles();
    
    // Analyze code documentation
    console.log('Analyzing code documentation...');
    this.analyzeCodeDocumentation();
    
    // Analyze API documentation
    console.log('Analyzing API documentation...');
    this.analyzeApiDocumentation();
    
    // Analyze workflow documentation
    console.log('Analyzing workflow documentation...');
    this.analyzeWorkflowDocumentation();
    
    // Find missing documentation
    console.log('Finding missing documentation...');
    this.findMissingDocumentation();

    // Generate report
    this.generateReport();

    return this.results;
  }

  /**
   * Find documentation files
   */
  findDocumentationFiles() {
    try {
      // Look for .md files in the docs directory
      const docsDir = 'docs';
      if (fs.existsSync(docsDir)) {
        const docFiles = this.findFilesInDirectory(docsDir, ['.md']);
        
        for (const file of docFiles) {
          const content = fs.readFileSync(file, 'utf8');
          const lines = content.split('\n').length;
          
          this.results.documentationFiles.push({
            file: file,
            lines: lines,
            headings: this.countMarkdownHeadings(content),
            codeBlocks: this.countMarkdownCodeBlocks(content),
            quality: this.assessDocumentationQuality(content)
          });
        }
      }
      
      // Look for README.md files
      if (fs.existsSync('README.md')) {
        const content = fs.readFileSync('README.md', 'utf8');
        const lines = content.split('\n').length;
        
        this.results.documentationFiles.push({
          file: 'README.md',
          lines: lines,
          headings: this.countMarkdownHeadings(content),
          codeBlocks: this.countMarkdownCodeBlocks(content),
          quality: this.assessDocumentationQuality(content)
        });
      }
    } catch (error) {
      console.error('Error finding documentation files:', error.message);
    }
  }

  /**
   * Analyze code documentation
   */
  analyzeCodeDocumentation() {
    try {
      // Find source files
      const sourceFiles = [
        ...this.findFilesInDirectory('src', ['.ts', '.tsx', '.js', '.jsx']),
        ...this.findFilesInDirectory('lib', ['.ts', '.tsx', '.js', '.jsx'])
      ];
      
      this.results.filesAnalyzed = sourceFiles.length;
      
      for (const file of sourceFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        // Count documentation patterns
        let docCount = 0;
        let jsdocCount = 0;
        let todoCount = 0;
        let fixmeCount = 0;
        
        let inJSDoc = false;
        
        for (const line of lines) {
          // Check for JSDoc comments
          if (line.trim().startsWith('/**')) {
            inJSDoc = true;
            jsdocCount++;
          }
          
          if (inJSDoc && line.trim().startsWith('*/')) {
            inJSDoc = false;
          }
          
          // Check for other documentation patterns
          for (const pattern of this.docPatterns) {
            if (line.includes(pattern)) {
              docCount++;
              break;
            }
          }
          
          // Check for TODOs and FIXMEs
          if (line.includes('// TODO:') || line.includes('//TODO:')) {
            todoCount++;
          }
          
          if (line.includes('// FIXME:') || line.includes('//FIXME:')) {
            fixmeCount++;
          }
        }
        
        // Count functions and classes
        const functionMatches = content.match(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|class\s+\w+/g) || [];
        const functionCount = functionMatches.length;
        
        // Calculate documentation ratio
        const docRatio = functionCount > 0 ? jsdocCount / functionCount : 0;
        
        this.results.codeDocumentation.push({
          file: file,
          docCount: docCount,
          jsdocCount: jsdocCount,
          todoCount: todoCount,
          fixmeCount: fixmeCount,
          functionCount: functionCount,
          docRatio: docRatio,
          quality: this.assessCodeDocumentationQuality(docRatio, todoCount, fixmeCount)
        });
      }
    } catch (error) {
      console.error('Error analyzing code documentation:', error.message);
    }
  }

  /**
   * Analyze API documentation
   */
  analyzeApiDocumentation() {
    try {
      // Find API route files
      const apiRouteFiles = this.findFilesInDirectory('src/app/api', ['.ts', '.js']);
      
      for (const file of apiRouteFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for API documentation patterns
        const hasJSDoc = content.includes('/**');
        const hasParamDocs = content.includes('@param');
        const hasReturnDocs = content.includes('@returns') || content.includes('@return');
        const hasExamples = content.includes('@example');
        const hasErrorHandling = content.includes('try') && content.includes('catch');
        
        // Check for OpenAPI/Swagger annotations
        const hasOpenAPI = content.includes('@openapi') || content.includes('@swagger');
        
        this.results.apiDocumentation.push({
          file: file,
          hasJSDoc: hasJSDoc,
          hasParamDocs: hasParamDocs,
          hasReturnDocs: hasReturnDocs,
          hasExamples: hasExamples,
          hasErrorHandling: hasErrorHandling,
          hasOpenAPI: hasOpenAPI,
          quality: this.assessApiDocumentationQuality(hasJSDoc, hasParamDocs, hasReturnDocs, hasExamples, hasErrorHandling)
        });
      }
    } catch (error) {
      console.error('Error analyzing API documentation:', error.message);
    }
  }

  /**
   * Analyze workflow documentation
   */
  analyzeWorkflowDocumentation() {
    try {
      // Check for workflow documentation in docs directory
      const docsDir = 'docs';
      if (fs.existsSync(docsDir)) {
        const workflowDocs = this.findFilesWithContent(docsDir, ['.md'], ['workflow', 'process', 'step-by-step']);
        
        for (const file of workflowDocs) {
          const content = fs.readFileSync(file, 'utf8');
          
          // Identify workflow type
          let workflowType = 'Unknown';
          if (content.toLowerCase().includes('authentication') || content.toLowerCase().includes('login')) {
            workflowType = 'Authentication';
          } else if (content.toLowerCase().includes('project') || content.toLowerCase().includes('projects')) {
            workflowType = 'Project Management';
          } else if (content.toLowerCase().includes('scope')) {
            workflowType = 'Scope Management';
          } else if (content.toLowerCase().includes('material') || content.toLowerCase().includes('approval')) {
            workflowType = 'Material Approval';
          } else if (content.toLowerCase().includes('purchase')) {
            workflowType = 'Purchase Process';
          }
          
          this.results.workflowDocumentation.push({
            file: file,
            workflowType: workflowType,
            hasDiagrams: content.includes('```mermaid') || content.includes('!['),
            hasSteps: this.countOrderedLists(content) > 0,
            quality: this.assessWorkflowDocumentationQuality(content)
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing workflow documentation:', error.message);
    }
  }

  /**
   * Find missing documentation
   */
  findMissingDocumentation() {
    try {
      // Find complex functions without documentation
      for (const item of this.results.codeDocumentation) {
        if (item.docRatio < 0.5 && item.functionCount > 3) {
          this.results.missingDocumentation.push({
            file: item.file,
            type: 'Code',
            severity: item.functionCount > 10 ? 'High' : 'Medium',
            recommendation: `Add JSDoc comments to ${item.functionCount - item.jsdocCount} undocumented functions`
          });
        }
      }
      
      // Find API routes without documentation
      for (const item of this.results.apiDocumentation) {
        if (!item.hasJSDoc || !item.hasParamDocs) {
          this.results.missingDocumentation.push({
            file: item.file,
            type: 'API',
            severity: 'High',
            recommendation: 'Add JSDoc comments with @param and @returns annotations'
          });
        }
      }
      
      // Check for missing workflow documentation
      const workflowTypes = [
        'Authentication',
        'Project Management',
        'Scope Management',
        'Material Approval',
        'Purchase Process'
      ];
      
      const documentedWorkflows = new Set(this.results.workflowDocumentation.map(item => item.workflowType));
      
      for (const workflow of workflowTypes) {
        if (!documentedWorkflows.has(workflow)) {
          this.results.missingDocumentation.push({
            file: 'N/A',
            type: 'Workflow',
            severity: 'Medium',
            recommendation: `Create documentation for ${workflow} workflow`
          });
        }
      }
    } catch (error) {
      console.error('Error finding missing documentation:', error.message);
    }
  }

  /**
   * Find files in directory
   */
  findFilesInDirectory(dir, extensions) {
    let results = [];
    
    try {
      if (!fs.existsSync(dir)) {
        return results;
      }
      
      const list = fs.readdirSync(dir);
      
      for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          if (!this.excludeDirs.includes(file)) {
            results = results.concat(this.findFilesInDirectory(filePath, extensions));
          }
        } else {
          const ext = path.extname(file);
          if (extensions.includes(ext)) {
            results.push(filePath);
          }
        }
      }
    } catch (error) {
      console.error(`Error finding files in ${dir}:`, error.message);
    }
    
    return results;
  }

  /**
   * Find files with specific content
   */
  findFilesWithContent(dir, extensions, patterns) {
    let results = [];
    
    try {
      const files = this.findFilesInDirectory(dir, extensions);
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8').toLowerCase();
        
        let matchesPattern = false;
        for (const pattern of patterns) {
          if (content.includes(pattern.toLowerCase())) {
            matchesPattern = true;
            break;
          }
        }
        
        if (matchesPattern) {
          results.push(file);
        }
      }
    } catch (error) {
      console.error(`Error finding files with content in ${dir}:`, error.message);
    }
    
    return results;
  }

  /**
   * Count markdown headings
   */
  countMarkdownHeadings(content) {
    const headingMatches = content.match(/^#{1,6}\s+.+$/gm);
    return headingMatches ? headingMatches.length : 0;
  }

  /**
   * Count markdown code blocks
   */
  countMarkdownCodeBlocks(content) {
    const codeBlockMatches = content.match(/```[\s\S]*?```/g);
    return codeBlockMatches ? codeBlockMatches.length : 0;
  }

  /**
   * Count ordered lists
   */
  countOrderedLists(content) {
    const orderedListMatches = content.match(/^\d+\.\s+.+$/gm);
    return orderedListMatches ? orderedListMatches.length : 0;
  }

  /**
   * Assess documentation quality
   */
  assessDocumentationQuality(content) {
    // Count headings, code blocks, and images
    const headings = this.countMarkdownHeadings(content);
    const codeBlocks = this.countMarkdownCodeBlocks(content);
    const images = (content.match(/!\[.*?\]\(.*?\)/g) || []).length;
    const orderedLists = this.countOrderedLists(content);
    
    // Calculate quality score
    let score = 0;
    if (headings > 5) score += 2;
    else if (headings > 2) score += 1;
    
    if (codeBlocks > 3) score += 2;
    else if (codeBlocks > 0) score += 1;
    
    if (images > 2) score += 2;
    else if (images > 0) score += 1;
    
    if (orderedLists > 2) score += 2;
    else if (orderedLists > 0) score += 1;
    
    // Return quality rating
    if (score >= 6) return 'Excellent';
    if (score >= 4) return 'Good';
    if (score >= 2) return 'Fair';
    return 'Poor';
  }

  /**
   * Assess code documentation quality
   */
  assessCodeDocumentationQuality(docRatio, todoCount, fixmeCount) {
    // Calculate quality score
    let score = 0;
    if (docRatio >= 0.8) score += 3;
    else if (docRatio >= 0.5) score += 2;
    else if (docRatio >= 0.2) score += 1;
    
    if (todoCount === 0) score += 1;
    if (fixmeCount === 0) score += 1;
    
    // Return quality rating
    if (score >= 4) return 'Excellent';
    if (score >= 3) return 'Good';
    if (score >= 2) return 'Fair';
    return 'Poor';
  }

  /**
   * Assess API documentation quality
   */
  assessApiDocumentationQuality(hasJSDoc, hasParamDocs, hasReturnDocs, hasExamples, hasErrorHandling) {
    // Calculate quality score
    let score = 0;
    if (hasJSDoc) score += 1;
    if (hasParamDocs) score += 1;
    if (hasReturnDocs) score += 1;
    if (hasExamples) score += 1;
    if (hasErrorHandling) score += 1;
    
    // Return quality rating
    if (score >= 4) return 'Excellent';
    if (score >= 3) return 'Good';
    if (score >= 2) return 'Fair';
    return 'Poor';
  }

  /**
   * Assess workflow documentation quality
   */
  assessWorkflowDocumentationQuality(content) {
    // Check for key elements of good workflow documentation
    const hasDiagrams = content.includes('```mermaid') || content.includes('![');
    const hasSteps = this.countOrderedLists(content) > 0;
    const hasRoles = content.toLowerCase().includes('role') || content.toLowerCase().includes('user');
    const hasExamples = content.toLowerCase().includes('example') || content.toLowerCase().includes('sample');
    
    // Calculate quality score
    let score = 0;
    if (hasDiagrams) score += 2;
    if (hasSteps) score += 1;
    if (hasRoles) score += 1;
    if (hasExamples) score += 1;
    
    // Return quality rating
    if (score >= 4) return 'Excellent';
    if (score >= 3) return 'Good';
    if (score >= 2) return 'Fair';
    return 'Poor';
  }

  /**
   * Generate report
   */
  generateReport() {
    console.log('\n📊 DOCUMENTATION AND MAINTAINABILITY ANALYSIS REPORT');
    console.log('===============================================');
    
    console.log(`\n📈 Files analyzed: ${this.results.filesAnalyzed}`);
    
    // Documentation files
    console.log('\n📘 DOCUMENTATION FILES');
    console.log('====================');
    
    if (this.results.documentationFiles.length === 0) {
      console.log('❌ No documentation files found.');
    } else {
      console.log(`Found ${this.results.documentationFiles.length} documentation files:`);
      
      for (const item of this.results.documentationFiles) {
        console.log(`\n📄 ${item.file}`);
        console.log(`  - Lines: ${item.lines}`);
        console.log(`  - Headings: ${item.headings}`);
        console.log(`  - Code blocks: ${item.codeBlocks}`);
        console.log(`  - Quality: ${item.quality}`);
      }
    }
    
    // Code documentation
    console.log('\n🔵 CODE DOCUMENTATION');
    console.log('===================');
    
    // Calculate overall documentation ratio
    const totalFunctions = this.results.codeDocumentation.reduce((sum, item) => sum + item.functionCount, 0);
    const totalJSDocs = this.results.codeDocumentation.reduce((sum, item) => sum + item.jsdocCount, 0);
    const overallDocRatio = totalFunctions > 0 ? totalJSDocs / totalFunctions : 0;
    
    console.log(`Overall documentation ratio: ${(overallDocRatio * 100).toFixed(2)}%`);
    console.log(`Total functions/classes: ${totalFunctions}`);
    console.log(`Total JSDoc comments: ${totalJSDocs}`);
    
    // Group by quality
    const codeDocByQuality = {
      'Excellent': [],
      'Good': [],
      'Fair': [],
      'Poor': []
    };
    
    for (const item of this.results.codeDocumentation) {
      codeDocByQuality[item.quality].push(item);
    }
    
    console.log('\nCode documentation quality breakdown:');
    console.log(`  - Excellent: ${codeDocByQuality['Excellent'].length} files`);
    console.log(`  - Good: ${codeDocByQuality['Good'].length} files`);
    console.log(`  - Fair: ${codeDocByQuality['Fair'].length} files`);
    console.log(`  - Poor: ${codeDocByQuality['Poor'].length} files`);
    
    // Show files with poor documentation
    if (codeDocByQuality['Poor'].length > 0) {
      console.log('\nFiles with poor documentation:');
      
      for (const item of codeDocByQuality['Poor'].slice(0, 5)) {
        console.log(`  - ${item.file} (${item.jsdocCount}/${item.functionCount} functions documented)`);
      }
      
      if (codeDocByQuality['Poor'].length > 5) {
        console.log(`  ... and ${codeDocByQuality['Poor'].length - 5} more files`);
      }
    }
    
    // API documentation
    console.log('\n🟢 API DOCUMENTATION');
    console.log('==================');
    
    // Calculate API documentation stats
    const apiWithJSDoc = this.results.apiDocumentation.filter(item => item.hasJSDoc).length;
    const apiWithParamDocs = this.results.apiDocumentation.filter(item => item.hasParamDocs).length;
    const apiWithReturnDocs = this.results.apiDocumentation.filter(item => item.hasReturnDocs).length;
    const apiWithExamples = this.results.apiDocumentation.filter(item => item.hasExamples).length;
    const apiWithErrorHandling = this.results.apiDocumentation.filter(item => item.hasErrorHandling).length;
    
    console.log(`API routes with JSDoc: ${apiWithJSDoc}/${this.results.apiDocumentation.length} (${(apiWithJSDoc / this.results.apiDocumentation.length * 100).toFixed(2)}%)`);
    console.log(`API routes with parameter docs: ${apiWithParamDocs}/${this.results.apiDocumentation.length} (${(apiWithParamDocs / this.results.apiDocumentation.length * 100).toFixed(2)}%)`);
    console.log(`API routes with return docs: ${apiWithReturnDocs}/${this.results.apiDocumentation.length} (${(apiWithReturnDocs / this.results.apiDocumentation.length * 100).toFixed(2)}%)`);
    console.log(`API routes with examples: ${apiWithExamples}/${this.results.apiDocumentation.length} (${(apiWithExamples / this.results.apiDocumentation.length * 100).toFixed(2)}%)`);
    console.log(`API routes with error handling: ${apiWithErrorHandling}/${this.results.apiDocumentation.length} (${(apiWithErrorHandling / this.results.apiDocumentation.length * 100).toFixed(2)}%)`);
    
    // Group by quality
    const apiDocByQuality = {
      'Excellent': [],
      'Good': [],
      'Fair': [],
      'Poor': []
    };
    
    for (const item of this.results.apiDocumentation) {
      apiDocByQuality[item.quality].push(item);
    }
    
    console.log('\nAPI documentation quality breakdown:');
    console.log(`  - Excellent: ${apiDocByQuality['Excellent'].length} routes`);
    console.log(`  - Good: ${apiDocByQuality['Good'].length} routes`);
    console.log(`  - Fair: ${apiDocByQuality['Fair'].length} routes`);
    console.log(`  - Poor: ${apiDocByQuality['Poor'].length} routes`);
    
    // Workflow documentation
    console.log('\n🟣 WORKFLOW DOCUMENTATION');
    console.log('======================');
    
    if (this.results.workflowDocumentation.length === 0) {
      console.log('❌ No workflow documentation found.');
    } else {
      console.log(`Found ${this.results.workflowDocumentation.length} workflow documentation files:`);
      
      // Group by workflow type
      const workflowsByType = {};
      for (const item of this.results.workflowDocumentation) {
        if (!workflowsByType[item.workflowType]) {
          workflowsByType[item.workflowType] = [];
        }
        workflowsByType[item.workflowType].push(item);
      }
      
      for (const [type, workflows] of Object.entries(workflowsByType)) {
        console.log(`\n${type} workflows:`);
        
        for (const workflow of workflows) {
          console.log(`  - ${workflow.file}`);
          console.log(`    - Has diagrams: ${workflow.hasDiagrams ? 'Yes' : 'No'}`);
          console.log(`    - Has steps: ${workflow.hasSteps ? 'Yes' : 'No'}`);
          console.log(`    - Quality: ${workflow.quality}`);
        }
      }
    }
    
    // Missing documentation
    console.log('\n🔴 MISSING DOCUMENTATION');
    console.log('=====================');
    
    if (this.results.missingDocumentation.length === 0) {
      console.log('✅ No significant documentation gaps found.');
    } else {
      console.log(`Found ${this.results.missingDocumentation.length} documentation gaps:`);
      
      // Group by type
      const missingByType = {
        'Code': [],
        'API': [],
        'Workflow': []
      };
      
      for (const item of this.results.missingDocumentation) {
        missingByType[item.type].push(item);
      }
      
      if (missingByType['Code'].length > 0) {
        console.log('\nCode documentation gaps:');
        
        for (const item of missingByType['Code'].slice(0, 5)) {
          console.log(`  - ${item.file} (${item.severity} severity)`);
          console.log(`    - Recommendation: ${item.recommendation}`);
        }
        
        if (missingByType['Code'].length > 5) {
          console.log(`  ... and ${missingByType['Code'].length - 5} more files`);
        }
      }
      
      if (missingByType['API'].length > 0) {
        console.log('\nAPI documentation gaps:');
        
        for (const item of missingByType['API'].slice(0, 5)) {
          console.log(`  - ${item.file} (${item.severity} severity)`);
          console.log(`    - Recommendation: ${item.recommendation}`);
        }
        
        if (missingByType['API'].length > 5) {
          console.log(`  ... and ${missingByType['API'].length - 5} more files`);
        }
      }
      
      if (missingByType['Workflow'].length > 0) {
        console.log('\nWorkflow documentation gaps:');
        
        for (const item of missingByType['Workflow']) {
          console.log(`  - ${item.recommendation} (${item.severity} severity)`);
        }
      }
    }
    
    // Summary
    console.log('\n🎯 SUMMARY');
    console.log('=========');
    
    // Calculate overall documentation quality
    let overallQuality = 'Unknown';
    
    if (this.results.codeDocumentation.length > 0) {
      const qualityScores = {
        'Excellent': 4,
        'Good': 3,
        'Fair': 2,
        'Poor': 1
      };
      
      const codeDocScore = this.results.codeDocumentation.reduce((sum, item) => sum + qualityScores[item.quality], 0) / this.results.codeDocumentation.length;
      const apiDocScore = this.results.apiDocumentation.length > 0 ? 
        this.results.apiDocumentation.reduce((sum, item) => sum + qualityScores[item.quality], 0) / this.results.apiDocumentation.length : 0;
      const workflowDocScore = this.results.workflowDocumentation.length > 0 ? 
        this.results.workflowDocumentation.reduce((sum, item) => sum + qualityScores[item.quality], 0) / this.results.workflowDocumentation.length : 0;
      
      const overallScore = (codeDocScore * 0.5) + (apiDocScore * 0.3) + (workflowDocScore * 0.2);
      
      if (overallScore >= 3.5) overallQuality = 'Excellent';
      else if (overallScore >= 2.5) overallQuality = 'Good';
      else if (overallScore >= 1.5) overallQuality = 'Fair';
      else overallQuality = 'Poor';
    }
    
    console.log(`Overall documentation quality: ${overallQuality}`);
    
    if (this.results.missingDocumentation.length > 0) {
      console.log('\nRecommendations:');
      console.log('1. Add JSDoc comments to undocumented functions, especially in complex files');
      console.log('2. Improve API route documentation with parameter and return type annotations');
      console.log('3. Create or enhance workflow documentation with diagrams and step-by-step guides');
      console.log('4. Establish documentation standards and enforce them in code reviews');
    } else {
      console.log('\nDocumentation is comprehensive. Focus on maintaining and improving existing documentation.');
    }
    
    // Save detailed results to file
    this.saveResultsToFile('scripts/documentation-results.json');
  }

  /**
   * Save results to file
   */
  saveResultsToFile(filePath) {
    fs.writeFileSync(filePath, JSON.stringify(this.results, null, 2));
    console.log(`\nDetailed results saved to ${filePath}`);
  }
}

// Execute if run directly
if (require.main === module) {
  const analyzer = new DocumentationAnalyzer();
  
  analyzer.execute()
    .then(results => {
      console.log('\n🏁 Analysis completed.');
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { DocumentationAnalyzer };