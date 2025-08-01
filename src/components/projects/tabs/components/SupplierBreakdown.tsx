/**
 * Supplier Breakdown Component - PERFORMANCE OPTIMIZATION
 * 
 * Extracted from RealtimeScopeListTab for better code splitting
 * and maintainability
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Building from 'lucide-react/dist/esm/icons/building';

interface SupplierTotals {
  id: string;
  name: string;
  totalEstimated: number;
  totalActual: number;
  itemCount: number;
}

interface SupplierBreakdownProps {
  supplierTotals: SupplierTotals[];
}

export function SupplierBreakdown({ supplierTotals }: SupplierBreakdownProps) {
  if (supplierTotals.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplier Breakdown</CardTitle>
        <CardDescription>Payment distribution across assigned suppliers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {supplierTotals.map((supplier) => (
            <div key={supplier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">{supplier.name}</div>
                  <div className="text-sm text-gray-600">{supplier.itemCount} scope items</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-600">${supplier.totalEstimated.toLocaleString()}</div>
                {supplier.totalActual > 0 && (
                  <div className="text-sm text-gray-600">${supplier.totalActual.toLocaleString()} actual</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}