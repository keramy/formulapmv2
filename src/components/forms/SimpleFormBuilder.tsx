'use client'

import * as React from 'react'
import { useForm, FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { projectSchemas, validateData } from '@/lib/form-validation'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { DataStateWrapper } from '@/components/ui/loading-states'

export type FieldType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'textarea' 
  | 'select' 
  | 'date'
  | 'phone'

export interface FormFieldConfig {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  description?: string
  required?: boolean
  options?: { value: string; label: string }[]
  defaultValue?: any
  className?: string
  disabled?: boolean
}

export interface SimpleFormBuilderProps {
  fields: FormFieldConfig[]
  onSubmit: (data: any) => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
  submitText?: string
  cancelText?: string
  title?: string
  description?: string
  className?: string
  defaultValues?: Record<string, any>
}

export function SimpleFormBuilder({
  fields,
  onSubmit,
  onCancel,
  loading = false,
  submitText = 'Submit',
  cancelText = 'Cancel',
  title,
  description,
  className,
  defaultValues
}: SimpleFormBuilderProps) {
  // Build validation schema from field configs
  const schemaFields = fields.reduce((acc, field) => {
    let validator: z.ZodType<any>

    switch (field.type) {
      case 'email':
        validator = z.string().email('Invalid email address')
        break
      case 'number':
        validator = z.number().min(0, 'Must be a positive number')
        break
      case 'phone':
        validator = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number')
        break
      case 'date':
        validator = z.string().min(1, 'Date is required')
        break
      default:
        validator = z.string()
    }

    if (field.required) {
      if (validator instanceof z.ZodString) {
        validator = validator.min(1, `${field.label} is required`)
      }
    } else {
      validator = validator.optional()
    }

    acc[field.name] = validator
    return acc
  }, {} as Record<string, z.ZodType<any>>)

  const schema = z.object(schemaFields)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || fields.reduce((acc, field) => {
      acc[field.name] = field.defaultValue || ''
      return acc
    }, {} as Record<string, any>)
  })

  const handleSubmit = form.handleSubmit(async (data: any) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  })

  const renderField = (field: FormFieldConfig) => {
    const commonProps = {
      placeholder: field.placeholder,
      disabled: field.disabled || loading,
      className: field.className
    }

    switch (field.type) {
      case 'textarea':
        return <Textarea {...commonProps} rows={4} />

      case 'select':
        return (
          <Select disabled={field.disabled || loading}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'number':
        return <Input {...commonProps} type="number" step="1" />

      case 'date':
        return <Input {...commonProps} type="date" />

      case 'phone':
        return <Input {...commonProps} type="tel" />

      case 'email':
        return <Input {...commonProps} type="email" />

      case 'password':
        return <Input {...commonProps} type="password" />

      default:
        return <Input {...commonProps} type="text" />
    }
  }

  const formContent = (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4">
          {fields.map((field) => (
            <FormField
              key={field.name}
              control={form.control}
              name={field.name}
              render={({ field: formField }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    {field.label}
                    {field.required && (
                      <Badge variant="destructive" className="text-xs px-1 py-0">
                        Required
                      </Badge>
                    )}
                  </FormLabel>
                  <FormControl>
                    {React.cloneElement(renderField(field), {
                      ...formField,
                      onChange: (e: any) => {
                        const value = field.type === 'number'
                          ? parseFloat(e.target.value) || 0
                          : e.target?.value || e
                        formField.onChange(value)
                      }
                    })}
                  </FormControl>
                  {field.description && (
                    <FormDescription>
                      {field.description}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              {cancelText}
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Submitting...' : submitText}
          </Button>
        </div>
      </form>
    </Form>
  )

  if (title || description) {
    return (
      <Card className={className}>
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          {formContent}
        </CardContent>
      </Card>
    )
  }

  return <div className={className}>{formContent}</div>
}

/**
 * Enhanced SimpleFormBuilder using DataStateWrapper pattern (claude.md aligned)
 * Following the proven form component optimization pattern from claude.md
 */
interface EnhancedSimpleFormBuilderProps extends SimpleFormBuilderProps {
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

export function EnhancedSimpleFormBuilder({
  fields,
  onSubmit,
  defaultValues,
  title,
  description,
  submitText = 'Submit',
  loading: formLoading = false,
  error = null,
  onRetry,
  className
}: EnhancedSimpleFormBuilderProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Build Zod schema from field definitions
  const schemaFields = fields.reduce((acc, field) => {
    let validator: z.ZodType<any>

    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
        validator = field.type === 'email' ? z.string().email('Invalid email') : z.string()
        break
      case 'number':
        validator = z.number()
        break
      case 'select':
        validator = z.string()
        break
      case 'textarea':
        validator = z.string()
        break
      case 'checkbox':
        validator = z.boolean()
        break
      case 'date':
        validator = z.string()
        break
      default:
        validator = z.string()
    }

    if (field.required) {
      if (validator instanceof z.ZodString) {
        validator = validator.min(1, `${field.label} is required`)
      }
    } else {
      validator = validator.optional()
    }

    acc[field.name] = validator
    return acc
  }, {} as Record<string, z.ZodType<any>>)

  const schema = z.object(schemaFields)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || fields.reduce((acc, field) => {
      acc[field.name] = field.defaultValue || ''
      return acc
    }, {} as Record<string, any>)
  })

  const handleSubmit = form.handleSubmit(async (data: any) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  })

  const renderField = (field: SimpleFieldConfig) => {
    const commonProps = {
      placeholder: field.placeholder,
      disabled: field.disabled || formLoading || isSubmitting,
      className: field.className
    }

    return (
      <FormField
        key={field.name}
        control={form.control}
        name={field.name}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>{field.label}</FormLabel>
            <FormControl>
              {field.type === 'textarea' ? (
                <Textarea {...formField} {...commonProps} />
              ) : field.type === 'select' ? (
                <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  {...formField}
                  type={field.type}
                  {...commonProps}
                />
              )}
            </FormControl>
            {field.description && (
              <FormDescription>{field.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  return (
    <DataStateWrapper
      loading={formLoading}
      error={error}
      data={fields}
      onRetry={onRetry}
      emptyComponent={
        <Card className={className}>
          <CardContent className="p-6 text-center">
            <div className="text-muted-foreground">No form fields configured</div>
          </CardContent>
        </Card>
      }
    >
      <Card className={className}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {fields.map(renderField)}

              <Button
                type="submit"
                disabled={isSubmitting || formLoading}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  submitText
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </DataStateWrapper>
  )
}