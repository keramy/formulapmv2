/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Formula PM Role-based colors - Updated 6-Role System
        management: "hsl(var(--management))",
        purchase: "hsl(var(--purchase))",
        technical: "hsl(var(--technical))",
        project: "hsl(var(--project))",
        client: "hsl(var(--client))",
        admin: "hsl(var(--admin))",
        
        // Comprehensive Status Color System
        "status-success": "hsl(var(--status-success))",
        "status-warning": "hsl(var(--status-warning))",
        "status-danger": "hsl(var(--status-danger))",
        "status-info": "hsl(var(--status-info))",
        "status-pending": "hsl(var(--status-pending))",
        "status-review": "hsl(var(--status-review))",
        "status-blocked": "hsl(var(--status-blocked))",
        
        // Priority System
        "priority-low": "hsl(var(--priority-low))",
        "priority-medium": "hsl(var(--priority-medium))",
        "priority-high": "hsl(var(--priority-high))",
        "priority-urgent": "hsl(var(--priority-urgent))",
        
        // Scope Categories - Construction Industry
        "scope-construction": "hsl(var(--scope-construction))",
        "scope-millwork": "hsl(var(--scope-millwork))",
        "scope-electrical": "hsl(var(--scope-electrical))",
        "scope-mechanical": "hsl(var(--scope-mechanical))",
        
        // Risk Levels - Safety-First
        "risk-low": "hsl(var(--risk-low))",
        "risk-medium": "hsl(var(--risk-medium))",
        "risk-high": "hsl(var(--risk-high))",
        
        // Project Status Extended
        "project-planning": "hsl(var(--project-planning))",
        "project-bidding": "hsl(var(--project-bidding))",
        "project-active": "hsl(var(--project-active))",
        "project-on-hold": "hsl(var(--project-on-hold))",
        "project-completed": "hsl(var(--project-completed))",
        "project-cancelled": "hsl(var(--project-cancelled))",
        
        // Task Status Extended
        "task-pending": "hsl(var(--task-pending))",
        "task-in-progress": "hsl(var(--task-in-progress))",
        "task-review": "hsl(var(--task-review))",
        "task-completed": "hsl(var(--task-completed))",
        "task-cancelled": "hsl(var(--task-cancelled))",
        "task-blocked": "hsl(var(--task-blocked))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}