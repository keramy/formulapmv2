const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Bundle Analysis Automation System
 * Uses existing webpack-bundle-analyzer to identify optimization opportunities
 */
class BundleAnalyzer {
  constructor() {
    this.projectRoot = process.cwd();
    this.buildDir = path.join(this.projectRoot, '.next');
    this.reportPath = path.join(this.projectRoot, 'bundle-analysis.html');
  }

  async analyze() {
    console.log('📦 Analyzing bundle size and composition...');
    
    const results = {
      timestamp: new Date().toISOString(),
      issues: [],
      summary: {
        totalBundleSize: 0,
        javascriptSize: 0,
        cssSize: 0,
        imageSize: 0,
        largestChunks: [],
        duplicatedPackages: [],
        unusedDependencies: []
      },
      recommendations: []
    };

    try {
      // Build the application with bundle analysis
      await this.buildWithAnalysis();
      
      // Analyze the generated bundle report
      const bundleData = await this.parseBundleReport();
      
      // Check for common bundle issues
      const bundleIssues = await this.identifyBundleIssues(bundleData);
      results.issues.push(...bundleIssues);
      
      // Analyze dependencies
      const dependencyIssues = await this.analyzeDependencies();
      results.issues.push(...dependencyIssues);
      
      // Check for optimization opportunities
      const optimizationIssues = await this.identifyOptimizations();
      results.issues.push(...optimizationIssues);
      
      // Update summary
      this.updateSummary(results, bundleData);
      
      // Generate recommendations
      results.recommendations = this.generateRecommendations(results.issues);
      
    } catch (error) {
      results.issues.push({
        id: 'bundle-analyzer-error',
        category: 'performance',
        severity: 'medium',
        title: 'Bundle Analysis Error',
        description: `Failed to analyze bundle: ${error.message}`,
        location: { file: 'bundle-analyzer.js', line: 0 },
        recommendation: 'Check build configuration and try running bundle analysis manually',
        estimatedEffort: 2,
        isProductionBlocker: false
      });
    }

    return results;
  }

  async buildWithAnalysis() {
    console.log('🔨 Building application with bundle analysis...');
    
    try {
      // Set environment variable to enable bundle analysis
      const env = { ...process.env, ANALYZE: 'true' };
      
      // Build the application
      execSync('npm run build', {
        cwd: this.projectRoot,
        stdio: 'pipe',
        env: env,
        timeout: 300000 // 5 minutes timeout
      });
      
      console.log('✅ Build completed with bundle analysis');
      
    } catch (error) {
      console.warn('⚠️  Build failed, attempting to analyze existing build...');
      
      // If build fails, try to analyze existing build if available
      if (!fs.existsSync(this.buildDir)) {
        throw new Error('No build directory found and build failed');
      }
    }
  }

  async parseBundleReport() {
    // Since webpack-bundle-analyzer generates an HTML report,
    // we'll analyze the build directory structure instead
    const buildStats = await this.analyzeBuildDirectory();
    return buildStats;
  }

  async analyzeBuildDirectory() {
    const stats = {
      chunks: [],
      totalSize: 0,
      staticFiles: []
    };

    try {
      const staticDir = path.join(this.buildDir, 'static');
      
      if (fs.existsSync(staticDir)) {
        const jsDir = path.join(staticDir, 'chunks');
        const cssDir = path.join(staticDir, 'css');
        
        // Analyze JavaScript chunks
        if (fs.existsSync(jsDir)) {
          const jsFiles = this.getFilesRecursively(jsDir, '.js');
          jsFiles.forEach(file => {
            const size = fs.statSync(file).size;
            stats.chunks.push({
              name: path.relative(staticDir, file),
              size: size,
              type: 'javascript'
            });
            stats.totalSize += size;
          });
        }
        
        // Analyze CSS files
        if (fs.existsSync(cssDir)) {
          const cssFiles = this.getFilesRecursively(cssDir, '.css');
          cssFiles.forEach(file => {
            const size = fs.statSync(file).size;
            stats.chunks.push({
              name: path.relative(staticDir, file),
              size: size,
              type: 'css'
            });
            stats.totalSize += size;
          });
        }
      }
      
      // Sort chunks by size
      stats.chunks.sort((a, b) => b.size - a.size);
      
    } catch (error) {
      console.warn('Warning: Could not analyze build directory:', error.message);
    }

    return stats;
  }

  getFilesRecursively(dir, extension) {
    const files = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getFilesRecursively(fullPath, extension));
      } else if (item.endsWith(extension)) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  async identifyBundleIssues(bundleData) {
    const issues = [];
    
    // Check for oversized chunks
    const largeChunks = bundleData.chunks.filter(chunk => chunk.size > 500000); // 500KB
    largeChunks.forEach(chunk => {
      issues.push({
        id: `large-chunk-${chunk.name}`,
        category: 'performance',
        severity: chunk.size > 1000000 ? 'high' : 'medium', // 1MB threshold for high severity
        title: `Large Bundle Chunk: ${chunk.name}`,
        description: `Chunk size is ${this.formatBytes(chunk.size)}, which may impact loading performance`,
        location: { file: chunk.name, line: 0 },
        recommendation: 'Consider code splitting or removing unused dependencies from this chunk',
        estimatedEffort: 4,
        isProductionBlocker: false,
        metadata: {
          chunkSize: chunk.size,
          chunkType: chunk.type
        }
      });
    });
    
    // Check total bundle size
    if (bundleData.totalSize > 2000000) { // 2MB threshold
      issues.push({
        id: 'total-bundle-size',
        category: 'performance',
        severity: bundleData.totalSize > 5000000 ? 'high' : 'medium', // 5MB for high severity
        title: 'Large Total Bundle Size',
        description: `Total bundle size is ${this.formatBytes(bundleData.totalSize)}, which may impact initial page load`,
        location: { file: 'bundle', line: 0 },
        recommendation: 'Implement code splitting, lazy loading, and remove unused dependencies',
        estimatedEffort: 8,
        isProductionBlocker: false,
        metadata: {
          totalSize: bundleData.totalSize
        }
      });
    }
    
    return issues;
  }

  async analyzeDependencies() {
    const issues = [];
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Check for potentially large dependencies
      const heavyDependencies = [
        'moment', 'lodash', 'rxjs', 'core-js', 'babel-polyfill'
      ];
      
      heavyDependencies.forEach(dep => {
        if (dependencies[dep]) {
          issues.push({
            id: `heavy-dependency-${dep}`,
            category: 'performance',
            severity: 'medium',
            title: `Heavy Dependency: ${dep}`,
            description: `${dep} is known to be a large dependency that may impact bundle size`,
            location: { file: 'package.json', line: 0 },
            recommendation: this.getAlternativeRecommendation(dep),
            estimatedEffort: 3,
            isProductionBlocker: false,
            metadata: {
              dependency: dep,
              version: dependencies[dep]
            }
          });
        }
      });
      
      // Check for duplicate functionality
      const duplicateChecks = [
        { deps: ['moment', 'date-fns'], recommendation: 'Use only one date library' },
        { deps: ['lodash', 'ramda'], recommendation: 'Use only one utility library' },
        { deps: ['axios', 'node-fetch'], recommendation: 'Use only one HTTP client library' }
      ];
      
      duplicateChecks.forEach(check => {
        const foundDeps = check.deps.filter(dep => dependencies[dep]);
        if (foundDeps.length > 1) {
          issues.push({
            id: `duplicate-functionality-${foundDeps.join('-')}`,
            category: 'performance',
            severity: 'low',
            title: `Duplicate Functionality: ${foundDeps.join(', ')}`,
            description: `Multiple libraries providing similar functionality: ${foundDeps.join(', ')}`,
            location: { file: 'package.json', line: 0 },
            recommendation: check.recommendation,
            estimatedEffort: 4,
            isProductionBlocker: false,
            metadata: {
              duplicateDependencies: foundDeps
            }
          });
        }
      });
      
    } catch (error) {
      console.warn('Warning: Could not analyze dependencies:', error.message);
    }
    
    return issues;
  }

  async identifyOptimizations() {
    const issues = [];
    
    // Check Next.js configuration for optimization opportunities
    try {
      const nextConfigPath = path.join(this.projectRoot, 'next.config.js');
      if (fs.existsSync(nextConfigPath)) {
        const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
        
        // Check for image optimization
        if (!nextConfigContent.includes('images:')) {
          issues.push({
            id: 'missing-image-optimization',
            category: 'performance',
            severity: 'medium',
            title: 'Missing Image Optimization Configuration',
            description: 'Next.js image optimization is not configured',
            location: { file: 'next.config.js', line: 0 },
            recommendation: 'Configure Next.js Image component and optimization settings',
            estimatedEffort: 2,
            isProductionBlocker: false
          });
        }
        
        // Check for compression
        if (!nextConfigContent.includes('compress:')) {
          issues.push({
            id: 'missing-compression',
            category: 'performance',
            severity: 'low',
            title: 'Missing Compression Configuration',
            description: 'Gzip compression is not explicitly configured',
            location: { file: 'next.config.js', line: 0 },
            recommendation: 'Enable gzip compression in Next.js configuration',
            estimatedEffort: 1,
            isProductionBlocker: false
          });
        }
      }
      
    } catch (error) {
      console.warn('Warning: Could not analyze Next.js configuration:', error.message);
    }
    
    return issues;
  }

  getAlternativeRecommendation(dependency) {
    const alternatives = {
      'moment': 'Consider using date-fns or native Date API for smaller bundle size',
      'lodash': 'Consider using native ES6+ methods or import only needed functions',
      'rxjs': 'Consider if all RxJS features are needed, or use lighter alternatives',
      'core-js': 'Consider using targeted polyfills instead of the full core-js',
      'babel-polyfill': 'Use @babel/preset-env with useBuiltIns for targeted polyfills'
    };
    
    return alternatives[dependency] || `Consider if ${dependency} is necessary or if there are lighter alternatives`;
  }

  updateSummary(results, bundleData) {
    results.summary.totalBundleSize = bundleData.totalSize;
    
    // Calculate sizes by type
    results.summary.javascriptSize = bundleData.chunks
      .filter(chunk => chunk.type === 'javascript')
      .reduce((sum, chunk) => sum + chunk.size, 0);
      
    results.summary.cssSize = bundleData.chunks
      .filter(chunk => chunk.type === 'css')
      .reduce((sum, chunk) => sum + chunk.size, 0);
    
    // Get largest chunks
    results.summary.largestChunks = bundleData.chunks
      .slice(0, 5)
      .map(chunk => ({
        name: chunk.name,
        size: chunk.size,
        formattedSize: this.formatBytes(chunk.size)
      }));
    
    // Identify duplicated packages from issues
    results.summary.duplicatedPackages = results.issues
      .filter(issue => issue.id.startsWith('duplicate-functionality'))
      .map(issue => issue.metadata?.duplicateDependencies || [])
      .flat();
  }

  generateRecommendations(issues) {
    const recommendations = [];
    
    const performanceIssues = issues.filter(i => i.category === 'performance');
    const highSeverityIssues = performanceIssues.filter(i => i.severity === 'high');
    
    if (highSeverityIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Address Critical Bundle Size Issues',
        description: `Found ${highSeverityIssues.length} high-severity bundle size issues`,
        action: 'Implement code splitting and remove large unused dependencies immediately'
      });
    }
    
    const largeChunkIssues = issues.filter(i => i.id.startsWith('large-chunk'));
    if (largeChunkIssues.length > 3) {
      recommendations.push({
        priority: 'medium',
        title: 'Implement Code Splitting Strategy',
        description: `Found ${largeChunkIssues.length} oversized chunks`,
        action: 'Implement dynamic imports and route-based code splitting'
      });
    }
    
    const dependencyIssues = issues.filter(i => i.id.includes('dependency'));
    if (dependencyIssues.length > 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Optimize Dependencies',
        description: `Found ${dependencyIssues.length} dependency optimization opportunities`,
        action: 'Review and replace heavy dependencies with lighter alternatives'
      });
    }
    
    return recommendations;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = BundleAnalyzer;