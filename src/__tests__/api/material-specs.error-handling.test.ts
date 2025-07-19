/**
 * Formula PM 2.0 Material Specifications Error Handling Tests
 * P1.04 Material Approval System Implementation
 * 
 * Tests for comprehensive error handling in material approval operations
 */

import { 
  validateMaterialSpecFormData,
  validateMaterialSpecPermissions,
  validateMaterialStatusTransition,
  calculateMaterialAvailabilityStatus,
  calculateMaterialCostVariance,
  calculateDaysUntilDelivery
} from '@/lib/validation/material-specs'

describe('Material Specifications Error Handling', () => {
  
  describe('Input Validation Errors', () => {
    
    it('should handle invalid material spec data gracefully', () => {
      const invalidInputs = [
        // Missing required fields
        { category: 'Steel', unit_of_measure: 'pieces' },
        // Invalid data types
        { name: 123, category: 'Steel', unit_of_measure: 'pieces', quantity_required: 'invalid', project_id: 'test' },
        // Negative values
        { name: 'Test', category: 'Steel', unit_of_measure: 'pieces', quantity_required: -5, estimated_cost: -100, project_id: '123e4567-e89b-12d3-a456-426614174001' },
        // Invalid UUIDs
        { name: 'Test', category: 'Steel', unit_of_measure: 'pieces', quantity_required: 1, project_id: 'invalid-uuid' },
        // String length violations
        { name: 'x'.repeat(201), category: 'Steel', unit_of_measure: 'pieces', quantity_required: 1, project_id: '123e4567-e89b-12d3-a456-426614174001' }
      ]
      
      invalidInputs.forEach((input, index) => {
        const result = validateMaterialSpecFormData(input)
        expect(result.success).toBe(false)
        
        if (!result.success) {
          expect(result.error).toBeDefined()
          expect(result.error.issues).toBeDefined()
          expect(Array.isArray(result.error.issues)).toBe(true)
          expect(result.error.issues.length).toBeGreaterThan(0)
        }
      })
    })
    
    it('should handle edge cases in date validation', () => {
      const edgeCases = [
        // Invalid date format
        { name: 'Test', category: 'Steel', unit_of_measure: 'pieces', quantity_required: 1, project_id: '123e4567-e89b-12d3-a456-426614174001', delivery_date: '2025/01/01' },
        // Past date for new material
        { name: 'Test', category: 'Steel', unit_of_measure: 'pieces', quantity_required: 1, project_id: '123e4567-e89b-12d3-a456-426614174001', delivery_date: '2020-01-01', status: 'pending_approval' },
        // Very old date
        { name: 'Test', category: 'Steel', unit_of_measure: 'pieces', quantity_required: 1, project_id: '123e4567-e89b-12d3-a456-426614174001', delivery_date: '1999-01-01' }
      ]
      
      edgeCases.forEach(input => {
        const result = validateMaterialSpecFormData(input)
        expect(result.success).toBe(false)
        
        if (!result.success) {
          expect(result.error.issues.some(issue => 
            issue.path.includes('delivery_date')
          )).toBe(true)
        }
      })
    })
    
  })
  
  describe('Permission Validation Errors', () => {
    
    it('should properly validate user permissions for different roles', () => {
      const testCases = [
        { role: 'client', action: 'create', expected: false },
        { role: 'client', action: 'update', expected: false },
        { role: 'client', action: 'delete', expected: false },
        { role: 'client', action: 'approve', expected: false },
        { role: 'project_manager', action: 'read', expected: true },
        { role: 'project_manager', action: 'create', expected: true },
        { role: 'project_manager', action: 'approve', expected: true },
        { role: 'technical_lead', action: 'approve', expected: true },
        { role: 'admin', action: 'delete', expected: true },
        { role: 'management', action: 'approve', expected: true },
        { role: 'invalid_role', action: 'read', expected: false },
      ]
      
      testCases.forEach(({ role, action, expected }) => {
        const result = validateMaterialSpecPermissions(role, action)
        expect(result).toBe(expected)
      })
    })
    
  })
  
  describe('Status Transition Validation', () => {
    
    it('should validate legal status transitions', () => {
      const validTransitions = [
        { from: 'pending_approval', to: 'approved', expected: true },
        { from: 'pending_approval', to: 'rejected', expected: true },
        { from: 'pending_approval', to: 'revision_required', expected: true },
        { from: 'approved', to: 'discontinued', expected: true },
        { from: 'rejected', to: 'pending_approval', expected: true },
        { from: 'revision_required', to: 'pending_approval', expected: true },
      ]
      
      const invalidTransitions = [
        { from: 'approved', to: 'pending_approval', expected: false },
        { from: 'approved', to: 'rejected', expected: false },
        { from: 'rejected', to: 'approved', expected: false },
        { from: 'discontinued', to: 'pending_approval', expected: false },
        { from: 'pending_approval', to: 'discontinued', expected: false },
      ]
      
      const allTransitions = validTransitions.concat(invalidTransitions)
      allTransitions.forEach(({ from, to, expected }) => {
        const result = validateMaterialStatusTransition(from as any, to as any)
        expect(result).toBe(expected)
      })
    })
    
  })
  
  describe('Calculation Functions Error Handling', () => {
    
    it('should handle edge cases in availability calculation', () => {
      const testCases = [
        { required: 100, available: 0, minimum: 10, expected: 'out_of_stock' },
        { required: 100, available: 5, minimum: 10, expected: 'low' },
        { required: 100, available: 50, minimum: 10, expected: 'low' },
        { required: 100, available: 150, minimum: 10, expected: 'sufficient' },
        { required: 0, available: 0, minimum: 0, expected: 'out_of_stock' },
        { required: 1, available: 1, minimum: 0, expected: 'sufficient' }
      ]
      
      testCases.forEach(({ required, available, minimum, expected }) => {
        const result = calculateMaterialAvailabilityStatus(required, available, minimum)
        expect(result).toBe(expected)
      })
    })
    
    it('should handle edge cases in cost variance calculation', () => {
      const testCases = [
        { estimated: undefined, actual: 100, expected: 0 },
        { estimated: 100, actual: undefined, expected: 0 },
        { estimated: 0, actual: 100, expected: 0 }, // Function returns 0 for edge case
        { estimated: 100, actual: 120, expected: 20 },
        { estimated: 100, actual: 80, expected: -20 },
        { estimated: 100, actual: 100, expected: 0 }
      ]
      
      testCases.forEach(({ estimated, actual, expected }) => {
        const result = calculateMaterialCostVariance(estimated, actual)
        expect(result).toBeCloseTo(expected)
      })
    })
    
    it('should handle edge cases in delivery date calculation', () => {
      const today = new Date()
      const futureDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days in future
      const pastDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days in past
      
      const testCases = [
        { date: futureDate.toISOString().split('T')[0], expectedSign: 1 }, // Positive days
        { date: pastDate.toISOString().split('T')[0], expectedSign: -1 }, // Negative days
        { date: today.toISOString().split('T')[0], expected: 0 } // Same day
      ]
      
      testCases.forEach(({ date, expectedSign, expected }) => {
        const result = calculateDaysUntilDelivery(date)
        
        if (expected !== undefined) {
          expect(Math.abs(result)).toBeLessThanOrEqual(1) // Allow for timezone differences
        } else if (expectedSign) {
          expect(Math.sign(result)).toBe(expectedSign)
        }
      })
    })
    
  })
  
  describe('Data Consistency Validation', () => {
    
    it('should detect inconsistent quantity relationships', () => {
      const inconsistentData = {
        name: 'Test Material',
        category: 'Steel',
        unit_of_measure: 'pieces',
        quantity_required: 50,
        minimum_stock_level: 100, // Invalid: minimum > required
        project_id: '123e4567-e89b-12d3-a456-426614174001'
      }
      
      const result = validateMaterialSpecFormData(inconsistentData)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.message.includes('Minimum stock level cannot exceed quantity required')
        )).toBe(true)
      }
    })
    
    it('should prevent invalid status changes during creation', () => {
      const invalidStatusData = {
        name: 'Test Material',
        category: 'Steel',
        unit_of_measure: 'pieces',
        quantity_required: 100,
        status: 'approved', // Invalid: can't create pre-approved materials
        project_id: '123e4567-e89b-12d3-a456-426614174001'
      }
      
      const result = validateMaterialSpecFormData(invalidStatusData)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.message.includes('Use the approval/rejection endpoints to change status')
        )).toBe(true)
      }
    })
    
  })
  
})