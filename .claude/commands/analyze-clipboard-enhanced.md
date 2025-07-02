---
description: Advanced clipboard log analysis with multiple subagent strategies and file management
allowed-tools: Bash, Task, Read, Write
---

# Analyze Clipboard Enhanced

Instructions

Determine analysis type from arguments

Default: General log analysis
"errors": Focus on error patterns
"performance": Analyze performance metrics
"security": Security audit of logs
"summary": Quick overview only


Execute clipboard extraction
bash# Create logs directory if it doesn't exist
mkdir -p ./logs

# Clean up old log files (older than 7 days)
find ./logs -name "clipboard_logs_*.txt" -type f -mtime +7 -delete 2>/dev/null || true

# Run PowerShell to save clipboard
powershell.exe "Get-Clipboard -Raw" > ./logs/clipboard_logs_$(date +%Y%m%d_%H%M%S).txt

# Check if file was created and has content
LOGFILE=$(ls -t ./logs/clipboard_logs_*.txt | head -1)
if [ -f "$LOGFILE" ] && [ -s "$LOGFILE" ]; then
    FILESIZE=$(stat -c%s "$LOGFILE")
    LINECOUNT=$(wc -l < "$LOGFILE")
    echo "SAVED:$LOGFILE"
    echo "SIZE:$FILESIZE"
    echo "LINES:$LINECOUNT"
else
    echo "ERROR:No clipboard content or file creation failed"
    exit 1
fi

Parse output and spawn appropriate subagent

Extract filename from PowerShell output
Determine file size for context management
Spawn specialized subagent based on arguments


Subagent spawning strategy
For small files (<100KB):
Task(Read and analyze the log file at [filename]. Provide comprehensive analysis including patterns, errors, and recommendations.)
For large files (>100KB):
Task(Sample and analyze the log file at [filename]. Read first 1000 lines, middle 1000 lines, and last 1000 lines. Provide analysis of patterns and anomalies found.)
For specific analysis types:
Task(Perform [analysis_type] analysis on [filename]. Focus specifically on [specific_criteria]. Do not include raw log content in response.)

Cleanup options

If arguments contain "cleanup", delete the temporary file after analysis
If arguments contain "cleanup-all", delete all log files in ./logs directory
If arguments contain "cleanup-old", delete log files older than specified days (default: 7)
Otherwise, report file location for manual review

Cleanup commands:
bash# For immediate cleanup after analysis
if [[ "$1" == *"cleanup"* ]]; then
    rm -f "$LOGFILE"
fi

# For cleaning all logs
if [[ "$1" == *"cleanup-all"* ]]; then
    rm -f ./logs/clipboard_logs_*.txt
fi

# For cleaning old logs with custom days (e.g., "cleanup-old-3" for 3 days)
if [[ "$1" == *"cleanup-old"* ]]; then
    DAYS=$(echo "$1" | grep -oP 'cleanup-old-\K\d+' || echo "7")
    find ./logs -name "clipboard_logs_*.txt" -type f -mtime +$DAYS -delete
fi



Multiple Subagent Strategy
For complex logs, spawn multiple specialized subagents:
# Spawn error analyzer
Task(Analyze [filename] for ERROR, WARN, EXCEPTION patterns. Report severity distribution and top 5 error types.)

# Spawn performance analyzer  
Task(Analyze [filename] for timing data, response times, and performance bottlenecks.)

# Spawn structure analyzer
Task(Analyze [filename] structure: log format, timestamp patterns, component identifiers.)
Then synthesize results from all subagents.
Usage Examples

/analyze-clipboard-enhanced - General analysis
/analyze-clipboard-enhanced errors - Focus on errors
/analyze-clipboard-enhanced performance cleanup - Performance analysis with cleanup
/analyze-clipboard-enhanced security - Security audit
/analyze-clipboard-enhanced summary cleanup-all - Quick summary then remove all logs
/analyze-clipboard-enhanced cleanup-old-3 - Clean logs older than 3 days
/analyze-clipboard-enhanced cleanup-old - Clean logs older than 7 days (default)

Error Handling

Check clipboard content before processing
Validate file creation
Handle PowerShell execution errors
Ensure subagent receives valid file path