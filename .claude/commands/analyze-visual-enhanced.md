---
description: Advanced clipboard image/screenshot analysis with multiple subagent strategies and intelligent processing
allowed-tools: Bash, Task, Read, Write
---

# Analyze Visual Enhanced

Instructions

Determine analysis type from arguments

Default: General visual analysis
"ui": UI/UX analysis for screenshots
"text": OCR and text extraction
"error": Error message analysis in screenshots
"diagram": Technical diagram analysis
"compare": Compare with previous image


Execute clipboard image extraction
bash# Create images directory if it doesn't exist
mkdir -p ./images

# Clean up old image files (older than 7 days)
find ./images -name "clipboard_*.png" -type f -mtime +7 -delete 2>/dev/null || true

# Run PowerShell to save clipboard image
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
\$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
\$filename = './images/clipboard_' + \$timestamp + '.png'

try {
    \$image = [System.Windows.Forms.Clipboard]::GetImage()
    if (\$image) {
        \$image.Save(\$filename, [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Host \"SAVED:\$filename\"
        Write-Host \"SIZE:\$(([System.IO.FileInfo]\$filename).Length)\"
        Write-Host \"DIMS:\$(\$image.Width)x\$(\$image.Height)\"
        \$image.Dispose()
    } else {
        # Try to get image file from clipboard
        \$files = [System.Windows.Forms.Clipboard]::GetFileDropList()
        if (\$files -and \$files.Count -gt 0) {
            \$src = \$files[0]
            if (Test-Path \$src) {
                Copy-Item \$src \$filename
                Write-Host \"SAVED:\$filename\"
                Write-Host \"SOURCE:\$src\"
            } else {
                Write-Host 'ERROR:No valid image source'
                exit 1
            }
        } else {
            Write-Host 'ERROR:No image in clipboard'
            exit 1
        }
    }
} catch {
    Write-Host \"ERROR:\$_\"
    exit 1
}
"

Parse output and spawn appropriate subagent

Extract filename and dimensions from PowerShell output
Determine image type (screenshot, photo, diagram)
Spawn specialized subagent based on arguments


Specialized subagent strategies
For UI/Screenshot analysis:
Task(Analyze the UI screenshot at [filename]. Identify:
- Layout structure and component hierarchy
- Color scheme and visual consistency
- Potential usability issues
- Error messages or warnings visible
- Suggestions for improvement)
For text extraction:
Task(Extract and analyze text from image at [filename]:
- Perform OCR on all readable text
- Organize text by visual sections
- Identify headers, body text, and UI labels
- Note any text that's unclear or partially visible)
For error analysis:
Task(Analyze error screenshot at [filename]:
- Extract exact error message text
- Identify application/system generating error
- Note error codes or stack traces
- Suggest potential causes and solutions)
For diagram analysis:
Task(Analyze technical diagram at [filename]:
- Identify diagram type (flowchart, architecture, etc.)
- List all components and their relationships
- Extract text labels and annotations
- Describe the overall system/process shown)

Multi-agent analysis for complex images
For comprehensive analysis, spawn multiple specialists:
# Visual design expert
Task(Analyze [filename] from a visual design perspective: colors, balance, typography, spacing)

# Content expert  
Task(Analyze [filename] content: text, data, information architecture, clarity)

# Technical expert
Task(Analyze [filename] for technical details: implementation clues, frameworks used, potential issues)

Comparison mode
If "compare" in arguments and previous image exists:
Task(Compare images [filename] and [previous_filename]:
- List visual differences
- Identify what changed
- Note improvements or regressions
- Highlight new elements or removed items)


Image Processing Options

Resize large images: If image > 5MB, resize before analysis
Format conversion: Convert to JPG for photos, keep PNG for screenshots
Annotation: Save annotated version with analysis overlay

Cleanup Options

If arguments contain "cleanup", delete the image file after analysis
If arguments contain "cleanup-all", delete all image files in ./images directory
If arguments contain "cleanup-old", delete image files older than specified days (default: 7)
Otherwise, report file location for manual review

Cleanup commands:
bash# For immediate cleanup after analysis
if [[ "$1" == *"cleanup"* ]]; then
    rm -f "$IMAGEFILE"
fi

# For cleaning all images
if [[ "$1" == *"cleanup-all"* ]]; then
    rm -f ./images/clipboard_*.png
fi

# For cleaning old images with custom days (e.g., "cleanup-old-3" for 3 days)
if [[ "$1" == *"cleanup-old"* ]]; then
    DAYS=$(echo "$1" | grep -oP 'cleanup-old-\K\d+' || echo "7")
    find ./images -name "clipboard_*.png" -type f -mtime +$DAYS -delete
fi

Usage Examples

/analyze-visual-enhanced - General image analysis
/analyze-visual-enhanced ui - UI/UX focused analysis
/analyze-visual-enhanced text - Extract and analyze text
/analyze-visual-enhanced error debug - Error screenshot debugging
/analyze-visual-enhanced diagram - Technical diagram analysis
/analyze-visual-enhanced compare - Compare with previous image
/analyze-visual-enhanced ui cleanup - UI analysis then delete image
/analyze-visual-enhanced cleanup-all - Remove all saved images
/analyze-visual-enhanced cleanup-old-3 - Clean images older than 3 days

Batch Processing
For multiple images in clipboard (file list):
Task(Process all images in clipboard file list:
1. Save each image with sequential naming
2. Create summary analysis of image set
3. Identify patterns across images
4. Generate consolidated report)
Output Options
Based on arguments, generate different outputs:

Summary report (default)
Detailed annotation file
Extracted text file
JSON metadata file
Comparison report

Error Handling

Validate clipboard contains image data
Handle various image formats (PNG, JPG, GIF, BMP)
Check for corrupted image data
Manage file system permissions
Provide clear error messages