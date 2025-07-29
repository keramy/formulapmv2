import csv
import json
from collections import defaultdict
import re

# Read the CSV file
with open(r'C:\Users\Kerem\Downloads\Supabase Performance Security Lints (default) (11).csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    data = list(reader)

print(f'SUPABASE RLS PERFORMANCE ANALYSIS - {len(data)} Issues Found')
print('='*60)

# Parse each row to extract structured information
issues = []
for row in data:
    detail = row['detail']
    
    # Extract table name
    table_match = re.search(r'Table `public\.([^`]+)`', detail)
    table = table_match.group(1) if table_match else 'Unknown'
    
    # Extract role
    role_match = re.search(r'for role `([^`]+)`', detail)
    role = role_match.group(1) if role_match else 'Unknown'
    
    # Extract action
    action_match = re.search(r'for action `([^`]+)`', detail)
    action = action_match.group(1) if action_match else 'Unknown'
    
    # Extract policies - handle the complex JSON-like format
    policies_match = re.search(r'Policies include `\{(.+?)\}`', detail)
    if policies_match:
        policies_str = policies_match.group(1)
        # Clean up the policy names - remove quotes and split
        policies = [p.strip('"') for p in policies_str.split('","')]
        # Clean first and last elements
        if policies:
            policies[0] = policies[0].lstrip('"')
            policies[-1] = policies[-1].rstrip('"')
    else:
        policies = []
    
    issues.append({
        'table': table,
        'role': role,
        'action': action,
        'policies': policies,
        'policy_count': len(policies)
    })

# Group by table and action
table_summary = defaultdict(lambda: {'total_issues': 0, 'role_actions': defaultdict(list)})

for issue in issues:
    table = issue['table']
    table_summary[table]['total_issues'] += 1
    key = f"{issue['role']}+{issue['action']}"
    table_summary[table]['role_actions'][key].append({
        'policies': issue['policies'],
        'count': issue['policy_count']
    })

# Print detailed summary
print('\nISSUE BREAKDOWN BY TABLE:')
print('-' * 40)

for table in sorted(table_summary.keys()):
    issues_count = table_summary[table]["total_issues"]
    print(f'\nTABLE: {table.upper()} ({issues_count} issues)')
    
    # Group by action to see patterns
    actions = defaultdict(list)
    for role_action, conflicts in table_summary[table]['role_actions'].items():
        role, action = role_action.split('+', 1)
        actions[action].extend([(role, conflicts[0]['policies'], conflicts[0]['count'])])
    
    for action in sorted(actions.keys()):
        print(f'  {action}:')
        role_data = actions[action]
        # Get unique policy combinations for this action
        unique_policies = set()
        for role, policies, count in role_data:
            policy_tuple = tuple(sorted(policies))
            unique_policies.add((policy_tuple, count))
        
        for policy_tuple, count in unique_policies:
            roles_with_this_combo = [role for role, policies, _ in role_data if tuple(sorted(policies)) == policy_tuple]
            print(f'    * {count} policies affecting roles: {", ".join(roles_with_this_combo)}')
            for policy in policy_tuple:
                print(f'      - {policy}')

print(f'\n\nCRITICAL STATISTICS:')
print('='*20)
print(f'Total Issues: {len(data)}')
print(f'Affected Tables: {len(table_summary)}')
print(f'Unique Roles: {len(set(issue["role"] for issue in issues))}')

# Get all unique policy names
all_policies = set()
for issue in issues:
    all_policies.update(issue['policies'])
print(f'Total Unique Policies: {len(all_policies)}')

# Calculate severity by table
severity_by_table = []
for table, data in table_summary.items():
    total_issues = data['total_issues']
    max_policies = max([conflict['count'] for conflicts in data['role_actions'].values() for conflict in conflicts])
    severity_by_table.append((table, total_issues, max_policies))

severity_by_table.sort(key=lambda x: (x[1], x[2]), reverse=True)

print(f'\nSEVERITY RANKING (by issue count + max policies):')
print('-' * 50)
for i, (table, issues, max_policies) in enumerate(severity_by_table, 1):
    print(f'{i:2d}. {table:<20} {issues:2d} issues, up to {max_policies} policies per role+action')

# Generate consolidation SQL
print(f'\n\nCONSOLIDATION STRATEGY:')
print('='*25)
print('Each table+role+action combination needs ONE consolidated policy.')
print('Current multiple policies must be combined using OR logic.')
print('\nFor example:')
print('  Instead of: Policy A (condition1) + Policy B (condition2)')
print('  Create: Consolidated Policy (condition1 OR condition2)')

consolidation_needed = 0
for table, data in table_summary.items():
    consolidation_needed += data['total_issues']

print(f'\nTotal consolidations needed: {consolidation_needed}')
print('This will reduce policy execution overhead significantly.')
print('Each query currently executes 2-4 policies; after consolidation: 1 policy per role+action.')

# Performance impact calculation
total_policy_executions_before = sum(
    conflict['count'] for table_data in table_summary.values()
    for conflicts in table_data['role_actions'].values()
    for conflict in conflicts
)

total_policy_executions_after = len(data)  # One policy per issue

performance_improvement = ((total_policy_executions_before - total_policy_executions_after) / total_policy_executions_before) * 100

print(f'\nPERFORMANCE IMPACT:')
print(f'Policy executions before: {total_policy_executions_before}')
print(f'Policy executions after: {total_policy_executions_after}')
print(f'Reduction: {performance_improvement:.1f}%')