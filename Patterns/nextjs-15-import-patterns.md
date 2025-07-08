# Next.js 15 Import/Export Patterns

## Overview
Next.js 15 has stricter ESM (ECMAScript Modules) requirements that can cause webpack bundling errors if import/export patterns don't match expectations.

## Common Issues and Solutions

### Issue 1: `__webpack_require__.n is not a function`

**Symptoms:**
- Error occurs when loading React components
- Stack trace points to specific line in component file
- Usually happens with UI components or form elements

**Root Cause:**
Import/export pattern mismatch between component definition and usage.

**Solution Pattern:**

```typescript
// ❌ Problematic Pattern
// In component file:
export const MyComponent = React.forwardRef<...>((props, ref) => {
  return <div>...</div>
})

// In usage file:
import { MyComponent } from './MyComponent'

// ✅ Fixed Pattern  
// In component file:
const MyComponent = React.forwardRef<...>((props, ref) => {
  return <div>...</div>
})

// Export both default and named for compatibility
export default MyComponent
export { MyComponent }

// In usage file (choose one):
import MyComponent from './MyComponent'  // Preferred for Next.js 15
// OR
import { MyComponent } from './MyComponent'  // Still works
```

### Issue 2: UI Component Import Patterns

**Shadcn/UI Components Pattern:**

```typescript
// ❌ May cause bundling issues
export { Input }

// ✅ Next.js 15 compatible
const Input = React.forwardRef<...>((props, ref) => {
  return <input ref={ref} {...props} />
})

export default Input
export { Input }
```

**Usage in forms/components:**

```typescript
// ✅ Preferred import method
import Input from '@/components/ui/input'

// Instead of:
// import { Input } from '@/components/ui/input'
```

### Issue 3: Authentication Component Patterns

**LoginForm and similar components:**

```typescript
// ✅ Recommended pattern for Next.js 15
const LoginForm = () => {
  // Component logic
  return <form>...</form>
}

// Provide both export types
export default LoginForm
export { LoginForm }
```

## Best Practices

### 1. Consistent Export Pattern
Always provide both default and named exports for maximum compatibility:

```typescript
const Component = () => { /* ... */ }

export default Component
export { Component }
```

### 2. Import Preferences
- **Default imports** are preferred for Next.js 15 webpack optimization
- **Named imports** should still be supported for backward compatibility

### 3. Component Definition
- Define component as `const` first, then export
- Avoid `export const` pattern for complex components
- Use React.forwardRef properly with explicit typing

### 4. File Structure
```
src/components/
├── ui/
│   ├── input.tsx        # export default Input; export { Input }
│   ├── button.tsx       # export default Button; export { Button }
├── auth/
│   ├── LoginForm.tsx    # export default LoginForm; export { LoginForm }
```

## Migration Guide

When encountering webpack bundling errors:

1. **Identify the problematic import** from the error stack trace
2. **Check the export pattern** in the referenced component
3. **Update to dual export pattern** (default + named)
4. **Prefer default imports** in consuming components
5. **Test bundling** to ensure error is resolved

## Real-World Example

**Error encountered:**
```
TypeError: __webpack_require__.n is not a function
at eval (webpack-internal:///(app-pages-browser)/./src/components/auth/LoginForm.tsx:7:104)
```

**Investigation:**
- Line 7 in LoginForm.tsx was importing Input component
- Input was exported as named export only
- Next.js 15 webpack expected default export pattern

**Fix applied:**
1. Updated Input component to provide both exports
2. Changed LoginForm to use default import
3. Added dual export pattern to LoginForm itself

**Result:**
- Webpack error eliminated
- Authentication flow restored
- Backward compatibility maintained

## Testing Pattern

After making import/export changes:

```bash
# Clear Next.js cache
rm -rf .next

# Start development server
npm run dev

# Test component loading in browser
# Check browser console for webpack errors
```

## Notes

- This pattern is specific to Next.js 15 with React 18+
- Earlier Next.js versions may be more forgiving
- Always test after making import/export changes
- Consider this pattern for all new component development