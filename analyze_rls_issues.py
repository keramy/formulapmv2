import csv
import json
from collections import defaultdict
import re

# Read the CSV file
with open(r'C:\Users\Kerem\Downloads\Supabase Performance Security Lints (default) (11).csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    data = list(reader)

print(f'Total issues found: {len(data)}')

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

# Group by table
table_summary = defaultdict(lambda: {'total_issues': 0, 'role_actions': defaultdict(list)})

for issue in issues:
    table = issue['table']
    table_summary[table]['total_issues'] += 1
    key = f"{issue['role']}_{issue['action']}"
    table_summary[table]['role_actions'][key].append({
        'policies': issue['policies'],
        'count': issue['policy_count']
    })

# Print summary by table
print('\n=== SUMMARY BY TABLE ===')
for table in sorted(table_summary.keys()):
    print(f'\nTable: {table}')
    print(f'  Total Issues: {table_summary[table]["total_issues"]}')
    print('  Role+Action Combinations:')
    for role_action, conflicts in sorted(table_summary[table]['role_actions'].items()):
        role, action = role_action.split('_', 1)
        for conflict in conflicts:
            print(f'    {role} + {action}: {conflict["count"]} policies -> {conflict["policies"]}')

# Get unique tables
unique_tables = sorted(set(issue['table'] for issue in issues))
print(f'\n=== AFFECTED TABLES ({len(unique_tables)}) ===')
for table in unique_tables:
    count = sum(1 for issue in issues if issue['table'] == table)
    print(f'{table}: {count} issues')

# Get unique roles
unique_roles = sorted(set(issue['role'] for issue in issues))
print(f'\n=== AFFECTED ROLES ({len(unique_roles)}) ===')
for role in unique_roles:
    count = sum(1 for issue in issues if issue['role'] == role)
    print(f'{role}: {count} issues')

# Get all unique policy names
all_policies = set()
for issue in issues:
    all_policies.update(issue['policies'])

print(f'\n=== ALL POLICY NAMES ({len(all_policies)}) ===')
for policy in sorted(all_policies):
    print(f'- {policy}')

# Create consolidation plan
print(f'\n=== CONSOLIDATION PLAN ===')
print('For each table+role+action combination, consolidate multiple policies into single policy:')
consolidation_plan = {}

for table in sorted(table_summary.keys()):
    consolidation_plan[table] = []
    for role_action, conflicts in sorted(table_summary[table]['role_actions'].items()):
        role, action = role_action.split('_', 1)
        for conflict in conflicts:
            consolidation_plan[table].append({
                'role': role,
                'action': action,
                'current_policies': conflict['policies'],
                'new_policy_name': f'{table}_{role}_{action}_consolidated',
                'consolidation_needed': True
            })

for table, plans in consolidation_plan.items():
    print(f'\n{table}:')
    for plan in plans:
        print(f"  {plan['role']} + {plan['action']}:")
        print(f"    Current: {plan['current_policies']}")
        print(f"    Consolidate to: {plan['new_policy_name']}")