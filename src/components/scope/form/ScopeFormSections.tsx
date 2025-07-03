/**
 * Formula PM 2.0 Scope Form Sections
 * Wave 2B Business Logic Implementation
 * 
 * Extracted form sections for better modularization and reduced complexity
 */

'use client'

import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'

interface FormSectionProps {
  form: any
  isReadOnly: boolean
  canViewPricing?: boolean
  canEditPricing?: boolean
  canViewCosts?: boolean
  canEditCosts?: boolean
}

// Core Information Section
export const CoreInformationSection: React.FC<FormSectionProps> = ({ form, isReadOnly }) => {
  const { watch, setValue } = form
  const quantity = watch('quantity')
  const unitPrice = watch('unit_price')
  const totalPrice = quantity * unitPrice

  return (
    <Card>
      <CardHeader>
        <CardTitle>Core Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="millwork">Millwork</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="mechanical">Mechanical</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="item_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item Code</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Client-provided code..." 
                    {...field} 
                    disabled={isReadOnly}
                  />
                </FormControl>
                <FormDescription>Optional code provided by client</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Detailed item description..." 
                  className="min-h-20"
                  {...field} 
                  disabled={isReadOnly}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit_of_measure"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit of Measure *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="pcs, m², kg, etc." 
                    {...field} 
                    disabled={isReadOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <Label>Total Price</Label>
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="text-lg font-medium">${totalPrice.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                {quantity} × ${unitPrice}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Pricing Section
export const PricingSection: React.FC<FormSectionProps> = ({ 
  form, 
  isReadOnly, 
  canViewPricing = false, 
  canEditPricing = false 
}) => {
  if (!canViewPricing) return null

  const { watch } = form
  const quantity = watch('quantity')
  const unitPrice = watch('unit_price')
  const markupPercentage = watch('markup_percentage')
  const totalPrice = quantity * unitPrice
  const finalPrice = totalPrice * (1 + (markupPercentage || 0) / 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="unit_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Price *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly || !canEditPricing}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="markup_percentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Markup %</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    max="100"
                    step="0.1"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly || !canEditPricing}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <Label>Final Price (with markup)</Label>
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="text-lg font-medium text-green-600">
                ${finalPrice.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                +{markupPercentage || 0}% markup
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Timeline Section
export const TimelineSection: React.FC<FormSectionProps> = ({ form, isReadOnly }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline & Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="timeline_start"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    disabled={isReadOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeline_end"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    disabled={isReadOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority (1-10)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1"
                    max="10"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    disabled={isReadOnly}
                  />
                </FormControl>
                <FormDescription>1 = Low priority, 10 = Critical</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="risk_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Risk Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select risk level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="specifications"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Specifications</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Technical specifications..." 
                    className="min-h-20"
                    {...field} 
                    disabled={isReadOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center space-x-6">
          <FormField
            control={form.control}
            name="requires_client_approval"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isReadOnly}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Requires Client Approval</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quality_check_required"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isReadOnly}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Quality Check Required</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// Cost Tracking Section (for restricted users)
export const CostTrackingSection: React.FC<FormSectionProps> = ({ 
  form, 
  isReadOnly, 
  canViewCosts = false, 
  canEditCosts = false 
}) => {
  if (!canViewCosts) return null

  const { getValues } = form

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Cost Tracking</span>
          <Badge variant="secondary">Restricted Access</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="initial_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Cost</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    step="0.01"
                    placeholder="Original estimate"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    disabled={isReadOnly || !canEditCosts}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="actual_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Actual Cost</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    step="0.01"
                    placeholder="Real incurred cost"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    disabled={isReadOnly || !canEditCosts}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <Label>Cost Variance</Label>
            <div className="p-3 bg-gray-50 rounded-md">
              {getValues('actual_cost') && getValues('initial_cost') ? (
                <div className={`text-lg font-medium ${
                  (getValues('actual_cost') || 0) > (getValues('initial_cost') || 0) 
                    ? 'text-red-600' 
                    : 'text-green-600'
                }`}>
                  ${((getValues('actual_cost') || 0) - (getValues('initial_cost') || 0)).toLocaleString()}
                </div>
              ) : (
                <div className="text-muted-foreground">Enter costs to calculate</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}