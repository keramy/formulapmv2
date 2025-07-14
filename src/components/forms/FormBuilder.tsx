'use client'

import * as React from 'react'
import { useForm, Controller, FieldValues, Path } from 'react-hook-form'
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
import { ReactNode } from 'react'

export type FieldType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'textarea' 
  | 'select' 
  | 'multiselect'
  | 'date'
  | 'phone'
  | 'currency'

export interface FormFieldConfig {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  description?: string
  required?: boolean
  options?: { value: string; label: string }[]
  validation?: z.ZodType<any>
  defaultValue?: any
  className?: string
  disabled?: boolean
  prefix?: ReactNode
  suffix?: ReactNode
}

export interface FormBuilderProps<T extends FieldValues> {
  fields: FormFieldConfig[]
  onSubmit: (data: T) => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
  submitText?: string
  cancelText?: string
  title?: string
  description?: string
  className?: string
  defaultValues?: Partial<T>
  children?: ReactNode
}

export function FormBuilder<T extends FieldValues>({
  fields,
  onSubmit,
  onCancel,
  loading = false,
  submitText = 'Submit',
  cancelText = 'Cancel',
  title,
  description,
  className,
  defaultValues,
  children
}: FormBuilderProps<T>) {
  // Build validation schema from field configs
  const schemaFields = fields.reduce((acc, field) => {
    let validator = field.validation

    if (!validator) {
      switch (field.type) {
        case 'email':
          validator = z.string().email('Invalid email address')
          break
        case 'number':
        case 'currency':
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
    }

    if (field.required && validator instanceof z.ZodString) {
      validator = validator.min(1, `${field.label} is required`)
    } else if (!field.required && validator instanceof z.ZodString) {
      validator = validator.optional()
    }

    acc[field.name] = validator
    return acc
  }, {} as Record<string, z.ZodType<any>>)

  const schema = z.object(schemaFields)

  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: (defaultValues || fields.reduce((acc, field) => {
      acc[field.name as keyof T] = field.defaultValue
      return acc
    }, {} as Partial<T>)) as any
  })

  const handleSubmit = form.handleSubmit(async (data) => {
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
        return (
          <Textarea
            {...commonProps}
            rows={4}
          />
        )

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
      case 'currency':
        return (
          <div className="relative">
            {field.prefix && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {field.prefix}
              </div>
            )}
            <Input
              {...commonProps}
              type="number"
              step={field.type === 'currency' ? '0.01' : '1'}
              className={cn(
                field.prefix && 'pl-8',
                field.suffix && 'pr-8'
              )}
            />
            {field.suffix && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {field.suffix}
              </div>
            )}
          </div>
        )

      case 'date':
        return (
          <Input
            {...commonProps}
            type="date"
          />
        )

      case 'phone':
        return (
          <Input
            {...commonProps}
            type="tel"
          />
        )

      case 'email':
        return (
          <Input
            {...commonProps}
            type="email"
          />
        )

      case 'password':
        return (
          <Input
            {...commonProps}
            type="password"
          />
        )

      default:
        return (
          <Input
            {...commonProps}
            type="text"
          />
        )
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
              name={field.name as Path<T>}
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
                    <Controller
                      control={form.control}
                      name={field.name as Path<T>}
                      render={({ field: controllerField }) => (
                        <div className="relative">
                          {React.cloneElement(renderField(field), {
                            ...controllerField,
                            value: controllerField.value || '',
                            onChange: (e: any) => {
                              const value = field.type === 'number' || field.type === 'currency'
                                ? parseFloat(e.target.value) || 0
                                : e.target.value
                              controllerField.onChange(value)
                            }
                          })}
                        </div>
                      )}
                    />
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

        {children}

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

// Helper function to create common form field configurations
export const createFieldConfig = {
  text: (name: string, label: string, options?: Partial<FormFieldConfig>): FormFieldConfig => ({
    name,
    label,
    type: 'text',
    ...options
  }),

  email: (name: string, label: string, options?: Partial<FormFieldConfig>): FormFieldConfig => ({
    name,
    label,
    type: 'email',
    ...options
  }),

  password: (name: string, label: string, options?: Partial<FormFieldConfig>): FormFieldConfig => ({
    name,
    label,
    type: 'password',
    ...options
  }),

  textarea: (name: string, label: string, options?: Partial<FormFieldConfig>): FormFieldConfig => ({
    name,
    label,
    type: 'textarea',
    ...options
  }),

  select: (name: string, label: string, options: { value: string; label: string }[], extra?: Partial<FormFieldConfig>): FormFieldConfig => ({
    name,
    label,
    type: 'select',
    options,
    ...extra
  }),

  currency: (name: string, label: string, options?: Partial<FormFieldConfig>): FormFieldConfig => ({
    name,
    label,
    type: 'currency',
    prefix: '$',
    ...options
  }),

  date: (name: string, label: string, options?: Partial<FormFieldConfig>): FormFieldConfig => ({
    name,
    label,
    type: 'date',
    ...options
  }),

  phone: (name: string, label: string, options?: Partial<FormFieldConfig>): FormFieldConfig => ({
    name,
    label,
    type: 'phone',
    ...options
  })
}