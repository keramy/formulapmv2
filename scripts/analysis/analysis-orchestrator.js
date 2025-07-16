#!/usr/bin/env node

/**
 * Analysis Orchestrator - Main entry point for automated analysis
 * Coordinates all analysis tools and generates comprehensive reports
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class AnalysisOrchestrator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      summary: {
        totalIssues: 0,
        criticalIssues: 0,
        highPriorityIssues: 0,
        mediumPriorityIssues: 0,
        lowPriorityIssues: 0,
        productionBlockers: [],
        estimatedEffort: 0
      },
      bugReport: {},
      performanceReport: {},
      securityReport: {},
      qualityReport: {},
      infrastructureReport: {},
      recommendations: [],
      errors: []
    };
    
    this.outputDir = path.join(process.cwd(), 'analysis-reports');
    this.ensureOutputDirectory();
  }

  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async runAnalysis(options = {}) {
    console.log('🚀 Starting Formula PM 2.0 Analysis...\n');
    
    const analyses = [
      { name: 'TypeScript Error Detection', fn: () => this.runTypeScriptAnalysis() },
      { name: 'Bundle Analysis', fn: () => this.runBundleAnalysis() },
      { name: 'Database Performance Monitoring', fn: () => this.runDatabaseAnalysis() },
      { name: 'Security Scanning', fn: () => this.runSecurityAnalysis() },
      { name: 'Code Quality Assessment', fn: () => this.runCodeQualityAnalysis() }
    ];

    for (const analysis of analyses) {
      try {
        console.log(`📊 Running ${analysis.name}...`);
        await analysis.fn();
        console.log(`✅ ${analysis.name} completed\n`);
      } catch (error) {
        console.error(`❌ ${analysis.name} failed:`, error.message);
        this.results.errors.push({
          component: analysis.name,
          error: error.message,
          severity: 'warning',
          timestamp: new Date().toISOString()
        });
      }
    }

    await this.generateReport();
    console.log('🎉 Analysis completed! Check analysis-reports/ directory for results.');
  }

  async runTypeScriptAnalysis() {
    const TypeScriptAnalyzer = require('./typescript-analyzer');
    const analyzer = new TypeScriptAnalyzer();
    this.results.bugReport.typescript = await analyzer.analyze();
    this.updateSummary(this.results.bugReport.typescript.issues);
  }

  async runBundleAnalysis() {
    const BundleAnalyzer = require('./bundle-analyzer');
    const analyzer = new BundleAnalyzer();
    this.results.performanceReport.bundle = await analyzer.analyze();
    this.updateSummary(this.results.performanceReport.bundle.issues);
  }

  async runDatabaseAnalysis() {
    const DatabaseAnalyzer = require('./database-analyzer');
    const analyzer = new DatabaseAnalyzer();
    this.results.performanceReport.database = await analyzer.analyze();
    this.updateSummary(this.results.performanceReport.database.issues);
  }

  async runSecurityAnalysis() {
    const SecurityAnalyzer = require('./security-analyzer');
    const analyzer = new SecurityAnalyzer();
    this.results.securityReport = await analyzer.analyze();
    this.updateSummary(this.results.securityReport.issues);
  }

  async runCodeQualityAnalysis() {
    const CodeQualityAnalyzer = require('./code-quality-analyzer');
    const analyzer = new CodeQualityAnalyzer();
    this.results.qualityReport = await analyzer.analyze();
    this.updateSummary(this.results.qualityReport.issues);
  }

  updateSummary(issues) {
    if (!issues || !Array.isArray(issues)) return;
    
    issues.forEach(issue => {
      this.results.summary.totalIssues++;
      
      switch (issue.severity) {
        case 'critical':
          this.results.summary.criticalIssues++;
          if (issue.isProductionBlocker) {
            this.results.summary.productionBlockers.push(issue);
          }
          break;
        case 'high':
          this.results.summary.highPriorityIssues++;
          break;
        case 'medium':
          this.results.summary.mediumPriorityIssues++;
          break;
        case 'low':
          this.results.summary.lowPriorityIssues++;
          break;
      }
      
      this.results.summary.estimatedEffort += issue.estimatedEffort || 0;
    });
  }

  async generateReport() {
    // Generate JSON report
    const jsonReport = path.join(this.outputDir, 'analysis-report.json');
    fs.writeFileSync(jsonReport, JSON.stringify(this.results, null, 2));

    // Generate HTML report
    const htmlReport = await this.generateHTMLReport();
    const htmlReportPath = path.join(this.outputDir, 'analysis-report.html');
    fs.writeFileSync(htmlReportPath, htmlReport);

    // Generate summary report
    const summaryReport = this.generateSummaryReport();
    const summaryReportPath = path.join(this.outputDir, 'analysis-summary.md');
    fs.writeFileSync(summaryReportPath, summaryReport);

    console.log(`📄 Reports generated:`);
    console.log(`   - JSON: ${jsonReport}`);
    console.log(`   - HTML: ${htmlReportPath}`);
    console.log(`   - Summary: ${summaryReportPath}`);
  }

  generateSummaryReport() {
    const { summary } = this.results;
    
    return `# Formula PM 2.0 Analysis Summary

**Generated:** ${this.results.timestamp}
**Version:** ${this.results.version}

## Overview

- **Total Issues:** ${summary.totalIssues}
- **Critical Issues:** ${summary.criticalIssues}
- **High Priority:** ${summary.highPriorityIssues}
- **Medium Priority:** ${summary.mediumPriorityIssues}
- **Low Priority:** ${summary.lowPriorityIssues}
- **Production Blockers:** ${summary.productionBlockers.length}
- **Estimated Effort:** ${summary.estimatedEffort} hours

## Production Blockers

${summary.productionBlockers.length > 0 
  ? summary.productionBlockers.map(issue => `- **${issue.title}**: ${issue.description}`).join('\n')
  : 'No production blockers identified.'
}

## Next Steps

1. Address all critical issues and production blockers
2. Prioritize high-priority issues based on user impact
3. Plan medium and low priority fixes for future releases
4. Review detailed reports for specific recommendations

## Detailed Reports

- Full JSON report: \`analysis-report.json\`
- Interactive HTML report: \`analysis-report.html\`
`;
  }

  async generateHTMLReport() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Formula PM 2.0 Analysis Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #e1e5e9; padding-bottom: 20px; margin-bottom: 30px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2563eb; }
        .metric-label { color: #6b7280; margin-top: 5px; }
        .critical { color: #dc2626; }
        .high { color: #ea580c; }
        .medium { color: #ca8a04; }
        .low { color: #16a34a; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
        .issue-list { list-style: none; padding: 0; }
        .issue-item { background: #f9fafb; margin: 10px 0; padding: 15px; border-left: 4px solid #e5e7eb; border-radius: 4px; }
        .issue-item.critical { border-left-color: #dc2626; }
        .issue-item.high { border-left-color: #ea580c; }
        .issue-item.medium { border-left-color: #ca8a04; }
        .issue-item.low { border-left-color: #16a34a; }
        .issue-title { font-weight: 600; margin-bottom: 5px; }
        .issue-description { color: #6b7280; margin-bottom: 10px; }
        .issue-meta { font-size: 0.9em; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Formula PM 2.0 Analysis Report</h1>
            <p><strong>Generated:</strong> ${this.results.timestamp}</p>
            <p><strong>Version:</strong> ${this.results.version}</p>
        </div>
        
        <div class="summary-grid">
            <div class="metric-card">
                <div class="metric-value">${this.results.summary.totalIssues}</div>
                <div class="metric-label">Total Issues</div>
            </div>
            <div class="metric-card">
                <div class="metric-value critical">${this.results.summary.criticalIssues}</div>
                <div class="metric-label">Critical</div>
            </div>
            <div class="metric-card">
                <div class="metric-value high">${this.results.summary.highPriorityIssues}</div>
                <div class="metric-label">High Priority</div>
            </div>
            <div class="metric-card">
                <div class="metric-value medium">${this.results.summary.mediumPriorityIssues}</div>
                <div class="metric-label">Medium Priority</div>
            </div>
            <div class="metric-card">
                <div class="metric-value low">${this.results.summary.lowPriorityIssues}</div>
                <div class="metric-label">Low Priority</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${this.results.summary.estimatedEffort}h</div>
                <div class="metric-label">Estimated Effort</div>
            </div>
        </div>

        ${this.results.summary.productionBlockers.length > 0 ? `
        <div class="section">
            <h2>🚨 Production Blockers</h2>
            <ul class="issue-list">
                ${this.results.summary.productionBlockers.map(issue => `
                <li class="issue-item critical">
                    <div class="issue-title">${issue.title}</div>
                    <div class="issue-description">${issue.description}</div>
                    <div class="issue-meta">Location: ${issue.location?.file || 'N/A'} | Effort: ${issue.estimatedEffort || 0}h</div>
                </li>
                `).join('')}
            </ul>
        </div>
        ` : ''}

        <div class="section">
            <h2>📊 Analysis Details</h2>
            <p>Detailed analysis results have been saved to <code>analysis-report.json</code> for programmatic access.</p>
        </div>
    </div>
</body>
</html>`;
  }
}

// CLI interface
if (require.main === module) {
  const orchestrator = new AnalysisOrchestrator();
  
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose'),
    skipSecurity: args.includes('--skip-security'),
    skipPerformance: args.includes('--skip-performance')
  };
  
  orchestrator.runAnalysis(options).catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
}

module.exports = AnalysisOrchestrator;