console.log('Test script starting...')

try {
  console.log('Requiring database analysis script...')
  const { analyzeDatabase } = require('./scripts/database-performance-analysis.js')
  
  console.log('Running analysis...')
  analyzeDatabase().then(() => {
    console.log('Analysis completed!')
  }).catch(error => {
    console.error('Analysis failed:', error)
  })
} catch (error) {
  console.error('Script error:', error)
}