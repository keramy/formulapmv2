#!/bin/bash

# Quick Migration Script
# Provides shortcuts for common migration tasks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Migration functions
migrate_api_route() {
    local file_path=$1
    
    if [[ ! -f "$file_path" ]]; then
        log_error "File not found: $file_path"
        return 1
    fi
    
    log_info "Migrating API route: $file_path"
    
    # Create backup
    cp "$file_path" "$file_path.backup"
    
    # Replace imports
    sed -i 's/import { verifyAuth } from '\''@\/lib\/middleware'\''/import { withAuth, createSuccessResponse, createErrorResponse } from '\''@\/lib\/api-middleware'\''/g' "$file_path"
    
    # Basic pattern replacement (manual verification still needed)
    log_warning "Basic imports updated. Manual verification required for function conversion."
    log_info "See docs/MIGRATION_TEMPLATES.md for complete migration patterns"
    
    return 0
}

migrate_hook() {
    local file_path=$1
    
    if [[ ! -f "$file_path" ]]; then
        log_error "File not found: $file_path"
        return 1
    fi
    
    log_info "Migrating hook: $file_path"
    
    # Create backup
    cp "$file_path" "$file_path.backup"
    
    # Add useApiQuery import
    sed -i '/import.*useState.*useEffect/a import { useApiQuery } from '\''@\/hooks\/useApiQuery'\''' "$file_path"
    
    log_warning "Import added. Manual conversion required for state management."
    log_info "See docs/MIGRATION_TEMPLATES.md for complete migration patterns"
    
    return 0
}

migrate_component() {
    local file_path=$1
    
    if [[ ! -f "$file_path" ]]; then
        log_error "File not found: $file_path"
        return 1
    fi
    
    log_info "Migrating component: $file_path"
    
    # Create backup
    cp "$file_path" "$file_path.backup"
    
    # Add DataStateWrapper import
    sed -i '/import.*React/a import { DataStateWrapper } from '\''@\/components\/ui\/loading-states'\''' "$file_path"
    
    log_warning "Import added. Manual conversion required for loading states."
    log_info "See docs/MIGRATION_TEMPLATES.md for complete migration patterns"
    
    return 0
}

# Validation functions
validate_migration() {
    log_info "Running migration validation..."
    
    # TypeScript check
    log_info "Checking TypeScript compilation..."
    if npm run type-check > /dev/null 2>&1; then
        log_success "TypeScript compilation passed"
    else
        log_error "TypeScript compilation failed"
        return 1
    fi
    
    # Build check
    log_info "Checking build..."
    if npm run build > /dev/null 2>&1; then
        log_success "Build passed"
    else
        log_error "Build failed"
        return 1
    fi
    
    # Lint check
    log_info "Checking lint..."
    if npm run lint > /dev/null 2>&1; then
        log_success "Lint passed"
    else
        log_warning "Lint issues found (non-blocking)"
    fi
    
    log_success "Migration validation complete"
    return 0
}

# Analysis functions
analyze_project() {
    log_info "Analyzing project for migration opportunities..."
    
    if [[ -f "scripts/migration-helper.js" ]]; then
        node scripts/migration-helper.js analyze
    else
        log_error "Migration helper script not found"
        return 1
    fi
}

show_progress() {
    log_info "Showing migration progress..."
    
    if [[ -f "scripts/migration-helper.js" ]]; then
        node scripts/migration-helper.js progress
    else
        log_error "Migration helper script not found"
        return 1
    fi
}

# Backup functions
create_backup() {
    local backup_dir="backups/migration-$(date +%Y%m%d-%H%M%S)"
    log_info "Creating backup in $backup_dir"
    
    mkdir -p "$backup_dir"
    
    # Backup critical directories
    cp -r src/app/api "$backup_dir/"
    cp -r src/hooks "$backup_dir/"
    cp -r src/components "$backup_dir/"
    cp -r src/lib "$backup_dir/"
    
    log_success "Backup created in $backup_dir"
}

restore_backup() {
    local backup_dir=$1
    
    if [[ ! -d "$backup_dir" ]]; then
        log_error "Backup directory not found: $backup_dir"
        return 1
    fi
    
    log_warning "Restoring from backup: $backup_dir"
    
    # Restore directories
    cp -r "$backup_dir/api" src/app/
    cp -r "$backup_dir/hooks" src/
    cp -r "$backup_dir/components" src/
    cp -r "$backup_dir/lib" src/
    
    log_success "Backup restored from $backup_dir"
}

# Batch migration functions
batch_migrate_api() {
    log_info "Starting batch API route migration..."
    
    local routes_file="/tmp/api_routes.txt"
    find src/app/api -name "*.ts" -exec grep -l "verifyAuth" {} \; > "$routes_file"
    
    while IFS= read -r route; do
        log_info "Processing: $route"
        migrate_api_route "$route"
    done < "$routes_file"
    
    rm "$routes_file"
    log_success "Batch API migration complete"
}

batch_migrate_hooks() {
    log_info "Starting batch hook migration..."
    
    local hooks_file="/tmp/hooks.txt"
    find src/hooks -name "*.ts" -exec grep -l "useState.*loading" {} \; > "$hooks_file"
    
    while IFS= read -r hook; do
        log_info "Processing: $hook"
        migrate_hook "$hook"
    done < "$hooks_file"
    
    rm "$hooks_file"
    log_success "Batch hook migration complete"
}

batch_migrate_components() {
    log_info "Starting batch component migration..."
    
    local components_file="/tmp/components.txt"
    find src/components -name "*.tsx" -exec grep -l "if.*loading.*return" {} \; > "$components_file"
    
    while IFS= read -r component; do
        log_info "Processing: $component"
        migrate_component "$component"
    done < "$components_file"
    
    rm "$components_file"
    log_success "Batch component migration complete"
}

# Main command handling
case "$1" in
    "api")
        if [[ -n "$2" ]]; then
            migrate_api_route "$2"
        else
            batch_migrate_api
        fi
        ;;
    "hook")
        if [[ -n "$2" ]]; then
            migrate_hook "$2"
        else
            batch_migrate_hooks
        fi
        ;;
    "component")
        if [[ -n "$2" ]]; then
            migrate_component "$2"
        else
            batch_migrate_components
        fi
        ;;
    "analyze")
        analyze_project
        ;;
    "progress")
        show_progress
        ;;
    "validate")
        validate_migration
        ;;
    "backup")
        create_backup
        ;;
    "restore")
        if [[ -n "$2" ]]; then
            restore_backup "$2"
        else
            log_error "Please specify backup directory"
        fi
        ;;
    "batch-all")
        log_info "Starting full batch migration..."
        create_backup
        batch_migrate_api
        batch_migrate_hooks
        batch_migrate_components
        validate_migration
        ;;
    *)
        echo "Formula PM Quick Migration Script"
        echo "================================="
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  api [file]        - Migrate API route(s) to withAuth pattern"
        echo "  hook [file]       - Migrate hook(s) to useApiQuery pattern"
        echo "  component [file]  - Migrate component(s) to DataStateWrapper pattern"
        echo "  analyze           - Analyze codebase for migration opportunities"
        echo "  progress          - Show migration progress"
        echo "  validate          - Validate migration (TypeScript, build, lint)"
        echo "  backup            - Create backup before migration"
        echo "  restore <dir>     - Restore from backup"
        echo "  batch-all         - Run full batch migration with backup"
        echo ""
        echo "Examples:"
        echo "  $0 api src/app/api/projects/route.ts"
        echo "  $0 hook src/hooks/useProjects.ts"
        echo "  $0 component src/components/ProjectList.tsx"
        echo "  $0 analyze"
        echo "  $0 batch-all"
        echo ""
        echo "See docs/MIGRATION_TEMPLATES.md for detailed migration patterns"
        ;;
esac