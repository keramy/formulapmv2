#!/usr/bin/env python3
"""
Database Analysis Script using postgres-mcp
Run various analyses on your Supabase PostgreSQL database
"""

import subprocess
import json
import sys
import os

# Database connection from environment or direct
DATABASE_URL = os.getenv('DATABASE_URL', 
    "postgresql://postgres.xrrrtwrfadcilwkgwacs:535425Keramy!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require")

def run_mcp_command(command):
    """Run a postgres-mcp command and return the result"""
    # Create the input for the MCP server
    mcp_input = {
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": command['name'],
            "arguments": command.get('arguments', {})
        },
        "id": 1
    }
    
    # Run postgres-mcp with the command
    process = subprocess.Popen(
        ['postgres-mcp', '--access-mode=restricted', DATABASE_URL],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Send the command and get response
    stdout, stderr = process.communicate(input=json.dumps(mcp_input))
    
    if stderr:
        print(f"Error: {stderr}")
    
    return stdout

def analyze_db_health():
    """Run comprehensive database health check"""
    print("🏥 Running Database Health Analysis...")
    result = run_mcp_command({"name": "analyze_db_health"})
    print(result)

def get_top_queries():
    """Get the slowest queries"""
    print("🐌 Finding Slowest Queries...")
    result = run_mcp_command({"name": "get_top_queries"})
    print(result)

def analyze_workload_indexes():
    """Get index recommendations for entire workload"""
    print("📊 Analyzing Workload for Index Recommendations...")
    result = run_mcp_command({"name": "analyze_workload_indexes"})
    print(result)

def explain_query(query):
    """Explain a specific query"""
    print(f"🔍 Explaining Query: {query[:50]}...")
    result = run_mcp_command({
        "name": "explain_query",
        "arguments": {"query": query}
    })
    print(result)

def main():
    if len(sys.argv) < 2:
        print("""
Usage: python analyze-db.py <command> [arguments]

Commands:
  health              - Run comprehensive database health check
  slow-queries        - Find the slowest queries
  index-recommend     - Get index recommendations
  explain <query>     - Explain a specific query

Examples:
  python analyze-db.py health
  python analyze-db.py slow-queries
  python analyze-db.py explain "SELECT * FROM projects WHERE status = 'active'"
        """)
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "health":
        analyze_db_health()
    elif command == "slow-queries":
        get_top_queries()
    elif command == "index-recommend":
        analyze_workload_indexes()
    elif command == "explain" and len(sys.argv) > 2:
        explain_query(sys.argv[2])
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)

if __name__ == "__main__":
    main()