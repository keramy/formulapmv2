/**
 * Formula PM 2.0 Material Specification Form Component
 * V3 Phase 1 Implementation
 * 
 * Handles material specification creation and editing
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Plus, X, AlertTriangle } from 'lucide-react';
import { MaterialSpec, MaterialSpecFormData, MaterialStatus, MaterialPriority } from '@/types/material-specs';
import { useMaterialSpecs } from '@/hooks/useMaterialSpecs';
import { projectSchemas, validateData, FormValidator } from '@/lib/form-validation';

interface MaterialSpecFormProps {
  projectId: string;
  materialSpec?: MaterialSpec;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (materialSpec: MaterialSpec) => void;
}

export function MaterialSpecForm({ 
  projectId, 
  materialSpec, 
  isOpen, 
  onClose, 
  onSuccess 
}: MaterialSpecFormProps) {
  const { 
    permissions, 
    createMaterialSpec, 
    updateMaterialSpec 
  } = useMaterialSpecs(projectId);
  
  const [formData, setFormData] = useState<MaterialSpecFormData>({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    brand: '',
    model: '',
    specifications: {},
    unit_of_measure: '',
    estimated_cost: undefined,
    quantity_required: 1,
    minimum_stock_level: 0,
    status: 'pending_approval',
    priority: 'medium',
    supplier_id: '',
    lead_time_days: 0,
    delivery_date: '',
    project_id: projectId,
    scope_item_ids: []
  });
  
  const [specificationFields, setSpecificationFields] = useState<Array<{ key: string; value: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when materialSpec changes
  useEffect(() => {
    if (materialSpec) {
      setFormData({
        name: materialSpec.name,
        description: materialSpec.description || '',
        category: materialSpec.category,
        subcategory: materialSpec.subcategory || '',
        brand: materialSpec.brand || '',
        model: materialSpec.model || '',
        specifications: materialSpec.specifications || {},
        unit_of_measure: materialSpec.unit_of_measure,
        estimated_cost: materialSpec.estimated_cost,
        quantity_required: materialSpec.quantity_required,
        minimum_stock_level: materialSpec.minimum_stock_level,
        status: materialSpec.status,
        priority: materialSpec.priority,
        supplier_id: materialSpec.supplier_id || '',
        lead_time_days: materialSpec.lead_time_days,
        delivery_date: materialSpec.delivery_date || '',
        project_id: projectId,
        scope_item_ids: materialSpec.scope_items?.map(item => {
          const scopeItem = item.scope_item;
          return typeof scopeItem === 'string' ? scopeItem : (scopeItem as any)?.id || '';
        }) || []
      });
      
      // Initialize specification fields
      if (materialSpec.specifications) {
        setSpecificationFields(
          Object.entries(materialSpec.specifications).map(([key, value]) => ({
            key,
            value: String(value)
          }))
        );
      }
    } else {
      // Reset form for new material spec
      setFormData({
        name: '',
        description: '',
        category: '',
        subcategory: '',
        brand: '',
        model: '',
        specifications: {},
        unit_of_measure: '',
        estimated_cost: undefined,
        quantity_required: 1,
        minimum_stock_level: 0,
        status: 'pending_approval',
        priority: 'medium',
        supplier_id: '',
        lead_time_days: 0,
        delivery_date: '',
        project_id: projectId,
        scope_item_ids: []
      });
      setSpecificationFields([]);
    }
    setErrors({});
  }, [materialSpec, projectId]);

  const handleInputChange = (field: keyof MaterialSpecFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const addSpecificationField = () => {
    setSpecificationFields(prev => [...prev, { key: '', value: '' }]);
  };

  const removeSpecificationField = (index: number) => {
    setSpecificationFields(prev => prev.filter((_, i) => i !== index));
  };

  const updateSpecificationField = (index: number, field: 'key' | 'value', value: string) => {
    setSpecificationFields(prev => prev.map((spec, i) => 
      i === index ? { ...spec, [field]: value } : spec
    ));
  };

  // Use centralized validation
  const validateForm = (): boolean => {
    const validationResult = validateData(projectSchemas.materialSpec, formData);

    if (!validationResult.success) {
      setErrors(validationResult.fieldErrors || {});
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Build specifications object from specification fields
      const specifications: Record<string, any> = {};
      specificationFields.forEach(field => {
        if (field.key.trim() && field.value.trim()) {
          specifications[field.key.trim()] = field.value.trim();
        }
      });
      
      const submitData: MaterialSpecFormData = {
        ...formData,
        specifications,
        estimated_cost: formData.estimated_cost || undefined,
        supplier_id: formData.supplier_id || undefined,
        delivery_date: formData.delivery_date || undefined,
        description: formData.description || undefined,
        subcategory: formData.subcategory || undefined,
        brand: formData.brand || undefined,
        model: formData.model || undefined
      };
      
      let result: MaterialSpec | null = null;
      
      if (materialSpec) {
        // Update existing material spec
        result = await updateMaterialSpec(materialSpec.id, submitData);
      } else {
        // Create new material spec
        result = await createMaterialSpec(submitData);
      }
      
      if (result) {
        onSuccess?.(result);
        onClose();
      }
    } catch (error) {
      console.error('Error saving material specification:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!materialSpec;
  const canSubmit = permissions.canCreate || (permissions.canEdit && isEditing);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Material Specification' : 'Create Material Specification'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the material specification details.' 
              : 'Add a new material specification to the project.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter material name"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                </div>
                
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    placeholder="Enter category"
                    className={errors.category ? 'border-red-500' : ''}
                  />
                  {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category}</p>}
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter material description"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Input
                    id="subcategory"
                    value={formData.subcategory}
                    onChange={(e) => handleInputChange('subcategory', e.target.value)}
                    placeholder="Enter subcategory"
                  />
                </div>
                
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    placeholder="Enter brand"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="Enter model"
                />
              </div>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                Technical Specifications
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSpecificationField}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Spec
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {specificationFields.map((field, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={field.key}
                    onChange={(e) => updateSpecificationField(index, 'key', e.target.value)}
                    placeholder="Specification name"
                    className="flex-1"
                  />
                  <Input
                    value={field.value}
                    onChange={(e) => updateSpecificationField(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeSpecificationField(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              
              {specificationFields.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No specifications added yet. Click "Add Spec" to add technical specifications.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quantity and Cost */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quantity and Cost</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantity_required">Quantity Required *</Label>
                  <Input
                    id="quantity_required"
                    type="number"
                    value={formData.quantity_required}
                    onChange={(e) => handleInputChange('quantity_required', parseInt(e.target.value))}
                    min="1"
                    className={errors.quantity_required ? 'border-red-500' : ''}
                  />
                  {errors.quantity_required && <p className="text-sm text-red-500 mt-1">{errors.quantity_required}</p>}
                </div>
                
                <div>
                  <Label htmlFor="unit_of_measure">Unit of Measure *</Label>
                  <Input
                    id="unit_of_measure"
                    value={formData.unit_of_measure}
                    onChange={(e) => handleInputChange('unit_of_measure', e.target.value)}
                    placeholder="e.g., pieces, kg, m"
                    className={errors.unit_of_measure ? 'border-red-500' : ''}
                  />
                  {errors.unit_of_measure && <p className="text-sm text-red-500 mt-1">{errors.unit_of_measure}</p>}
                </div>
                
                <div>
                  <Label htmlFor="minimum_stock_level">Minimum Stock Level</Label>
                  <Input
                    id="minimum_stock_level"
                    type="number"
                    value={formData.minimum_stock_level}
                    onChange={(e) => handleInputChange('minimum_stock_level', parseInt(e.target.value))}
                    min="0"
                    className={errors.minimum_stock_level ? 'border-red-500' : ''}
                  />
                  {errors.minimum_stock_level && <p className="text-sm text-red-500 mt-1">{errors.minimum_stock_level}</p>}
                </div>
              </div>
              
              <div>
                <Label htmlFor="estimated_cost">Estimated Cost per Unit</Label>
                <Input
                  id="estimated_cost"
                  type="number"
                  step="0.01"
                  value={formData.estimated_cost || ''}
                  onChange={(e) => handleInputChange('estimated_cost', e.target.value ? parseFloat(e.target.value) : undefined)}
                  min="0"
                  placeholder="Enter estimated cost"
                  className={errors.estimated_cost ? 'border-red-500' : ''}
                />
                {errors.estimated_cost && <p className="text-sm text-red-500 mt-1">{errors.estimated_cost}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Priority and Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Priority and Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value as MaterialPriority)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="lead_time_days">Lead Time (Days)</Label>
                  <Input
                    id="lead_time_days"
                    type="number"
                    value={formData.lead_time_days}
                    onChange={(e) => handleInputChange('lead_time_days', parseInt(e.target.value))}
                    min="0"
                    className={errors.lead_time_days ? 'border-red-500' : ''}
                  />
                  {errors.lead_time_days && <p className="text-sm text-red-500 mt-1">{errors.lead_time_days}</p>}
                </div>
              </div>
              
              <div>
                <Label htmlFor="delivery_date">Expected Delivery Date</Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => handleInputChange('delivery_date', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Update Material Spec' : 'Create Material Spec'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Optimized MaterialSpecForm using centralized validation - EXAMPLE FOR AI AGENT
 * This shows how to use the centralized form validation patterns with FormValidator class
 */
export function MaterialSpecFormOptimized({
  projectId,
  materialSpec,
  isOpen,
  onClose,
  onSuccess
}: MaterialSpecFormProps) {
  const { permissions, createMaterialSpec, updateMaterialSpec } = useMaterialSpecs(projectId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use FormValidator class for advanced validation
  const validator = new FormValidator(projectSchemas.materialSpec);

  const [formData, setFormData] = useState<MaterialSpecFormData>({
    name: materialSpec?.name || '',
    description: materialSpec?.description || '',
    category: materialSpec?.category || '',
    unit: materialSpec?.unit_of_measure || '',
    unit_price: materialSpec?.estimated_cost || 0,
    minimum_quantity: materialSpec?.minimum_stock_level || 1,
    project_id: projectId,
    delivery_date: materialSpec?.delivery_date || undefined
  });

  const handleInputChange = (field: keyof MaterialSpecFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Validate field on change using centralized validation
    validator.validateField(field, value);
  };

  const handleSubmit = async () => {
    // Use centralized validation
    const validationResult = validator.validateAll(formData);

    if (!validationResult.success) {
      return; // Errors are already set in the validator
    }

    setIsSubmitting(true);

    try {
      const result = materialSpec
        ? await updateMaterialSpec(materialSpec.id, validationResult.data!)
        : await createMaterialSpec(validationResult.data!);

      if (result) {
        onSuccess?.(result);
        onClose();
      }
    } catch (error) {
      console.error('Error saving material specification:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {materialSpec ? 'Edit Material Specification' : 'Add Material Specification'}
          </DialogTitle>
          <DialogDescription>
            {materialSpec
              ? 'Update the material specification details below.'
              : 'Enter the details for the new material specification.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Material Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter material name"
                    className={validator.getFieldError('name') ? 'border-red-500' : ''}
                  />
                  {validator.getFieldError('name') && (
                    <p className="text-sm text-red-500 mt-1">{validator.getFieldError('name')}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    placeholder="Enter category"
                    className={validator.getFieldError('category') ? 'border-red-500' : ''}
                  />
                  {validator.getFieldError('category') && (
                    <p className="text-sm text-red-500 mt-1">{validator.getFieldError('category')}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter material description"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quantity and Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quantity & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="unit">Unit *</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    placeholder="e.g., pieces, kg, m"
                    className={validator.getFieldError('unit') ? 'border-red-500' : ''}
                  />
                  {validator.getFieldError('unit') && (
                    <p className="text-sm text-red-500 mt-1">{validator.getFieldError('unit')}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="unit_price">Unit Price *</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => handleInputChange('unit_price', parseFloat(e.target.value))}
                    min="0"
                    placeholder="Enter unit price"
                    className={validator.getFieldError('unit_price') ? 'border-red-500' : ''}
                  />
                  {validator.getFieldError('unit_price') && (
                    <p className="text-sm text-red-500 mt-1">{validator.getFieldError('unit_price')}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="minimum_quantity">Minimum Quantity *</Label>
                  <Input
                    id="minimum_quantity"
                    type="number"
                    value={formData.minimum_quantity}
                    onChange={(e) => handleInputChange('minimum_quantity', parseInt(e.target.value))}
                    min="1"
                    className={validator.getFieldError('minimum_quantity') ? 'border-red-500' : ''}
                  />
                  {validator.getFieldError('minimum_quantity') && (
                    <p className="text-sm text-red-500 mt-1">{validator.getFieldError('minimum_quantity')}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || validator.hasErrors()}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {materialSpec ? 'Update' : 'Create'} Material Specification
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}