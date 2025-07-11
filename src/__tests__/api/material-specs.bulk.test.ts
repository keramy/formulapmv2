/**
 * Formula PM 2.0 Material Specifications Bulk Operations API Tests
 * P1.04 Material Approval System Implementation
 * 
 * Tests for bulk material specification operations
 */

import { 
  validateMaterialSpecBulkUpdate,
  validateMaterialSpecBulkApproval,
  validateMaterialSpecBulkRejection
} from '@/lib/validation/material-specs'

describe('Material Specifications Bulk Operations', () => {
  
  describe('Bulk Update Validation', () => {
    
    it('should validate bulk update data correctly', () => {
      const validBulkUpdate = {
        material_spec_ids: [
          '123e4567-e89b-12d3-a456-426614174001',
          '123e4567-e89b-12d3-a456-426614174002'
        ],
        updates: {
          status: 'approved',
          priority: 'high',
          supplier_id: '123e4567-e89b-12d3-a456-426614174003'
        },
        notify_stakeholders: true
      }
      
      const result = validateMaterialSpecBulkUpdate(validBulkUpdate)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.material_spec_ids).toHaveLength(2)
        expect(result.data.updates.status).toBe('approved')
        expect(result.data.updates.priority).toBe('high')
        expect(result.data.notify_stakeholders).toBe(true)
      }
    })
    
    it('should reject bulk update with no IDs', () => {
      const invalidBulkUpdate = {
        material_spec_ids: [], // Empty array
        updates: {
          status: 'approved'
        }
      }
      
      const result = validateMaterialSpecBulkUpdate(invalidBulkUpdate)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('material_spec_ids')
        )).toBe(true)
      }
    })
    
    it('should reject bulk update with no update fields', () => {
      const invalidBulkUpdate = {
        material_spec_ids: ['123e4567-e89b-12d3-a456-426614174001'],
        updates: {} // No update fields
      }
      
      const result = validateMaterialSpecBulkUpdate(invalidBulkUpdate)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('updates')
        )).toBe(true)
      }
    })
    
    it('should reject bulk update with invalid UUIDs', () => {
      const invalidBulkUpdate = {
        material_spec_ids: ['invalid-uuid', 'another-invalid-uuid'],
        updates: {
          status: 'approved'
        }
      }
      
      const result = validateMaterialSpecBulkUpdate(invalidBulkUpdate)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('material_spec_ids')
        )).toBe(true)
      }
    })
    
  })
  
  describe('Bulk Approval Validation', () => {
    
    it('should validate bulk approval data correctly', () => {
      const validBulkApproval = {
        material_spec_ids: [
          '123e4567-e89b-12d3-a456-426614174001',
          '123e4567-e89b-12d3-a456-426614174002'
        ],
        approval_notes: 'All materials meet specifications',
        notify_stakeholders: true
      }
      
      const result = validateMaterialSpecBulkApproval(validBulkApproval)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.material_spec_ids).toHaveLength(2)
        expect(result.data.approval_notes).toBe('All materials meet specifications')
        expect(result.data.notify_stakeholders).toBe(true)
      }
    })
    
    it('should reject bulk approval with empty ID list', () => {
      const invalidBulkApproval = {
        material_spec_ids: [],
        approval_notes: 'All materials approved'
      }
      
      const result = validateMaterialSpecBulkApproval(invalidBulkApproval)
      expect(result.success).toBe(false)
    })
    
  })
  
  describe('Bulk Rejection Validation', () => {
    
    it('should validate bulk rejection data correctly', () => {
      const validBulkRejection = {
        material_spec_ids: [
          '123e4567-e89b-12d3-a456-426614174001',
          '123e4567-e89b-12d3-a456-426614174002'
        ],
        rejection_reason: 'Materials do not meet safety standards',
        notify_stakeholders: true
      }
      
      const result = validateMaterialSpecBulkRejection(validBulkRejection)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.material_spec_ids).toHaveLength(2)
        expect(result.data.rejection_reason).toBe('Materials do not meet safety standards')
        expect(result.data.notify_stakeholders).toBe(true)
      }
    })
    
    it('should reject bulk rejection without reason', () => {
      const invalidBulkRejection = {
        material_spec_ids: ['123e4567-e89b-12d3-a456-426614174001'],
        rejection_reason: '' // Empty reason
      }
      
      const result = validateMaterialSpecBulkRejection(invalidBulkRejection)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('rejection_reason')
        )).toBe(true)
      }
    })
    
    it('should reject bulk rejection with empty ID list', () => {
      const invalidBulkRejection = {
        material_spec_ids: [],
        rejection_reason: 'Safety concerns'
      }
      
      const result = validateMaterialSpecBulkRejection(invalidBulkRejection)
      expect(result.success).toBe(false)
    })
    
  })
  
})