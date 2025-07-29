/**
 * Migration Generator for Supabase Specialist
 * Generates safe, production-ready database migrations with rollback procedures
 */

export interface MigrationTemplate {
  name: string
  description: string
  upScript: string
  downScript: string
  validationQueries: string[]
  performanceImpact: 'low' | 'medium' | 'high'
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

export interface TableDefinition {
  tableName: string
  columns: ColumnDefinition[]
  indexes: IndexDefinition[]
  constraints: ConstraintDefinition[]
  rlsPolicies: RlsPolicyDefinition[]
  triggers: TriggerDefinition[]
}

export interface ColumnDefinition {
  name: string
  type: string
  nullable: boolean
  defaultValue?: string
  unique?: boolean
  primaryKey?: boolean
}

export interface IndexDefinition {
  name: string
  columns: string[]
  unique?: boolean
  where?: string
  type?: 'btree' | 'hash' | 'gin' | 'gist'
}

export interface ConstraintDefinition {
  name: string
  type: 'foreign_key' | 'check' | 'unique'
  columns: string[]
  referencedTable?: string
  referencedColumns?: string[]
  checkExpression?: string
}

export interface RlsPolicyDefinition {
  name: string
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'
  role?: string
  using?: string
  withCheck?: string
}

export interface TriggerDefinition {
  name: string
  timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF'
  events: string[]
  function: string
}

export class MigrationGenerator {
  /**
   * Generate a complete table creation migration
   */
  static generateTableMigration(definition: TableDefinition): MigrationTemplate {
    const { tableName, columns, indexes, constraints, rlsPolicies, triggers } = definition

    const upScript = this.buildCreateTableScript(definition)
    const downScript = this.buildDropTableScript(tableName)
    const validationQueries = this.buildValidationQueries(tableName)

    return {
      name: `create_${tableName}_table`,
      description: `Create ${tableName} table with optimized schema and RLS policies`,
      upScript,
      downScript,
      validationQueries,
      performanceImpact: 'low',
      riskLevel: 'medium'
    }
  }

  /**
   * Generate RLS policy optimization migration
   */
  static generateRlsOptimizationMigration(tableName: string, policies: RlsPolicyDefinition[]): MigrationTemplate {
    const upScript = `-- Optimize RLS policies for ${tableName}
-- Using (SELECT auth.uid()) pattern for 10-100x performance improvement

BEGIN;

-- Drop existing policies
${policies.map(policy => `DROP POLICY IF EXISTS "${policy.name}" ON "${tableName}";`).join('\n')}

-- Create optimized policies
${policies.map(policy => this.buildOptimizedRlsPolicy(tableName, policy)).join('\n\n')}

-- Verify RLS is enabled
ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;

COMMIT;`

    const downScript = `-- Rollback RLS optimization for ${tableName}
BEGIN;

-- Drop optimized policies
${policies.map(policy => `DROP POLICY IF EXISTS "${policy.name}" ON "${tableName}";`).join('\n')}

-- Note: Manual restoration of original policies required
-- This rollback removes optimized policies but doesn't restore originals

COMMIT;`

    return {
      name: `optimize_rls_${tableName}`,
      description: `Optimize RLS policies for ${tableName} using performance patterns`,
      upScript,
      downScript,
      validationQueries: [
        `SELECT COUNT(*) FROM pg_policies WHERE tablename = '${tableName}';`,
        `SELECT schemaname, tablename, policyname, qual FROM pg_policies WHERE tablename = '${tableName}';`
      ],
      performanceImpact: 'high',
      riskLevel: 'medium'
    }
  }

  /**
   * Generate foreign key index migration
   */
  static generateForeignKeyIndexMigration(indexes: IndexDefinition[]): MigrationTemplate {
    const upScript = `-- Add foreign key indexes for optimal JOIN performance
-- Critical for production performance

BEGIN;

${indexes.map(index => this.buildIndexCreationScript(index)).join('\n\n')}

-- Analyze tables to update statistics
${indexes.map(index => `ANALYZE ${index.name.split('_')[1]};`).join('\n')}

COMMIT;`

    const downScript = `-- Remove foreign key indexes
BEGIN;

${indexes.map(index => `DROP INDEX IF EXISTS ${index.name};`).join('\n')}

COMMIT;`

    return {
      name: `add_foreign_key_indexes`,
      description: `Add critical foreign key indexes for JOIN performance`,
      upScript,
      downScript,
      validationQueries: indexes.map(index => 
        `SELECT indexname FROM pg_indexes WHERE indexname = '${index.name}';`
      ),
      performanceImpact: 'high',
      riskLevel: 'low'
    }
  }

  /**
   * Generate Formula PM V2 specific migration
   */
  static generateFormulaPMTableMigration(tableName: string): MigrationTemplate {
    const tableDefinitions = this.getFormulaPMTableDefinitions()
    
    if (!tableDefinitions[tableName]) {
      throw new Error(`Unknown Formula PM V2 table: ${tableName}`)
    }

    return this.generateTableMigration(tableDefinitions[tableName])
  }

  /**
   * Build create table script
   */
  private static buildCreateTableScript(definition: TableDefinition): string {
    const { tableName, columns, indexes, constraints, rlsPolicies, triggers } = definition

    let script = `-- Create ${tableName} table with enterprise-grade optimization
-- Formula PM V2 optimized schema

BEGIN;

-- Create table
CREATE TABLE IF NOT EXISTS "${tableName}" (
${columns.map(col => this.buildColumnDefinition(col)).join(',\n')}
);

-- Add constraints
${constraints.map(constraint => this.buildConstraintScript(tableName, constraint)).join('\n')}

-- Create indexes (including foreign key indexes)
${indexes.map(index => this.buildIndexCreationScript(index)).join('\n')}

-- Enable RLS
ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies using optimized patterns
${rlsPolicies.map(policy => this.buildOptimizedRlsPolicy(tableName, policy)).join('\n\n')}

-- Create triggers
${triggers.map(trigger => this.buildTriggerScript(tableName, trigger)).join('\n')}

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON "${tableName}" TO authenticated;
GRANT USAGE ON SEQUENCE "${tableName}_id_seq" TO authenticated;

-- Analyze table for optimal query planning
ANALYZE "${tableName}";

-- Performance verification
DO $$
BEGIN
  RAISE NOTICE '✅ Table ${tableName} created successfully with optimizations';
  RAISE NOTICE '📊 Indexes: ${indexes.length}, RLS policies: ${rlsPolicies.length}';
END $$;

COMMIT;`

    return script
  }

  /**
   * Build drop table script
   */
  private static buildDropTableScript(tableName: string): string {
    return `-- Drop ${tableName} table and all dependencies
BEGIN;

-- Drop triggers first
DROP TRIGGER IF EXISTS update_updated_at ON "${tableName}";
DROP TRIGGER IF EXISTS create_user_profile_trigger ON "${tableName}";

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view their own records" ON "${tableName}";
DROP POLICY IF EXISTS "Users can insert their own records" ON "${tableName}";
DROP POLICY IF EXISTS "Users can update their own records" ON "${tableName}";
DROP POLICY IF EXISTS "Admins can manage all records" ON "${tableName}";

-- Drop table (constraints and indexes dropped automatically)
DROP TABLE IF EXISTS "${tableName}" CASCADE;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '🗑️ Table ${tableName} dropped successfully';
END $$;

COMMIT;`
  }

  /**
   * Build validation queries
   */
  private static buildValidationQueries(tableName: string): string[] {
    return [
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '${tableName}');`,
      `SELECT COUNT(*) FROM information_schema.columns WHERE table_name = '${tableName}';`,
      `SELECT COUNT(*) FROM pg_indexes WHERE tablename = '${tableName}';`,
      `SELECT COUNT(*) FROM pg_policies WHERE tablename = '${tableName}';`,
      `SELECT relrowsecurity FROM pg_class WHERE relname = '${tableName}';`
    ]
  }

  /**
   * Build column definition
   */
  private static buildColumnDefinition(column: ColumnDefinition): string {
    let definition = `  "${column.name}" ${column.type}`
    
    if (column.defaultValue) {
      definition += ` DEFAULT ${column.defaultValue}`
    }
    
    if (!column.nullable) {
      definition += ` NOT NULL`
    }
    
    if (column.unique) {
      definition += ` UNIQUE`
    }
    
    if (column.primaryKey) {
      definition += ` PRIMARY KEY`
    }
    
    return definition
  }

  /**
   * Build optimized RLS policy
   */
  private static buildOptimizedRlsPolicy(tableName: string, policy: RlsPolicyDefinition): string {
    let policyScript = `CREATE POLICY "${policy.name}" ON "${tableName}"`
    
    if (policy.command !== 'ALL') {
      policyScript += `\nFOR ${policy.command}`
    }
    
    if (policy.role) {
      policyScript += `\nTO ${policy.role}`
    }
    
    if (policy.using) {
      // Optimize auth.uid() calls
      const optimizedUsing = policy.using.replace(/auth\.uid\(\)/g, '(SELECT auth.uid())')
      policyScript += `\nUSING (${optimizedUsing})`
    }
    
    if (policy.withCheck) {
      const optimizedWithCheck = policy.withCheck.replace(/auth\.uid\(\)/g, '(SELECT auth.uid())')
      policyScript += `\nWITH CHECK (${optimizedWithCheck})`
    }
    
    policyScript += ';'
    
    return policyScript
  }

  /**
   * Build index creation script
   */
  private static buildIndexCreationScript(index: IndexDefinition): string {
    let script = `CREATE INDEX IF NOT EXISTS "${index.name}" ON`
    
    // Extract table name from index name (assumes idx_tablename_column format)
    const tableName = index.name.split('_')[1]
    script += ` "${tableName}"`
    
    if (index.type && index.type !== 'btree') {
      script += ` USING ${index.type}`
    }
    
    script += ` (${index.columns.join(', ')})`
    
    if (index.where) {
      script += ` WHERE ${index.where}`
    }
    
    script += ';'
    
    return script
  }

  /**
   * Build constraint script
   */
  private static buildConstraintScript(tableName: string, constraint: ConstraintDefinition): string {
    switch (constraint.type) {
      case 'foreign_key':
        return `ALTER TABLE "${tableName}" ADD CONSTRAINT "${constraint.name}" 
  FOREIGN KEY (${constraint.columns.join(', ')}) 
  REFERENCES "${constraint.referencedTable}" (${constraint.referencedColumns?.join(', ')});`
      
      case 'check':
        return `ALTER TABLE "${tableName}" ADD CONSTRAINT "${constraint.name}" 
  CHECK (${constraint.checkExpression});`
      
      case 'unique':
        return `ALTER TABLE "${tableName}" ADD CONSTRAINT "${constraint.name}" 
  UNIQUE (${constraint.columns.join(', ')});`
      
      default:
        return ''
    }
  }

  /**
   * Build trigger script
   */
  private static buildTriggerScript(tableName: string, trigger: TriggerDefinition): string {
    return `CREATE TRIGGER "${trigger.name}"
  ${trigger.timing} ${trigger.events.join(' OR ')} ON "${tableName}"
  FOR EACH ROW EXECUTE FUNCTION ${trigger.function}();`
  }

  /**
   * Get Formula PM V2 table definitions
   */
  private static getFormulaPMTableDefinitions(): Record<string, TableDefinition> {
    return {
      tasks: {
        tableName: 'tasks',
        columns: [
          { name: 'id', type: 'UUID', nullable: false, primaryKey: true, defaultValue: 'gen_random_uuid()' },
          { name: 'title', type: 'TEXT', nullable: false },
          { name: 'description', type: 'TEXT', nullable: true },
          { name: 'status', type: 'task_status', nullable: false, defaultValue: "'pending'" },
          { name: 'priority', type: 'task_priority', nullable: false, defaultValue: "'medium'" },
          { name: 'project_id', type: 'UUID', nullable: false },
          { name: 'assigned_to', type: 'UUID', nullable: true },
          { name: 'created_by', type: 'UUID', nullable: false },
          { name: 'due_date', type: 'TIMESTAMP WITH TIME ZONE', nullable: true },
          { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE', nullable: false, defaultValue: 'NOW()' },
          { name: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE', nullable: false, defaultValue: 'NOW()' }
        ],
        indexes: [
          { name: 'idx_tasks_project_id', columns: ['project_id'] },
          { name: 'idx_tasks_assigned_to', columns: ['assigned_to'] },
          { name: 'idx_tasks_created_by', columns: ['created_by'] },
          { name: 'idx_tasks_status_priority', columns: ['status', 'priority'] },
          { name: 'idx_tasks_due_date', columns: ['due_date'], where: 'due_date IS NOT NULL' }
        ],
        constraints: [
          {
            name: 'fk_tasks_project_id',
            type: 'foreign_key',
            columns: ['project_id'],
            referencedTable: 'projects',
            referencedColumns: ['id']
          },
          {
            name: 'fk_tasks_assigned_to',
            type: 'foreign_key',
            columns: ['assigned_to'],
            referencedTable: 'user_profiles',
            referencedColumns: ['id']
          },
          {
            name: 'fk_tasks_created_by',
            type: 'foreign_key',
            columns: ['created_by'],
            referencedTable: 'user_profiles',
            referencedColumns: ['id']
          }
        ],
        rlsPolicies: [
          {
            name: 'Users can view tasks in their projects',
            command: 'SELECT',
            using: 'project_id IN (SELECT id FROM projects WHERE id IN (SELECT project_id FROM project_members WHERE user_id = (SELECT auth.uid())))'
          },
          {
            name: 'Users can create tasks in their projects',
            command: 'INSERT',
            withCheck: 'project_id IN (SELECT id FROM projects WHERE id IN (SELECT project_id FROM project_members WHERE user_id = (SELECT auth.uid())))'
          },
          {
            name: 'Users can update tasks they created or are assigned to',
            command: 'UPDATE',
            using: 'created_by = (SELECT auth.uid()) OR assigned_to = (SELECT auth.uid())'
          }
        ],
        triggers: [
          {
            name: 'update_tasks_updated_at',
            timing: 'BEFORE',
            events: ['UPDATE'],
            function: 'update_updated_at_column'
          }
        ]
      }
    }
  }
}