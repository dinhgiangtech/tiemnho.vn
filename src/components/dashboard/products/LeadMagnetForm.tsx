'use client';

import * as React from 'react';
import * as z from 'zod';
import { Product } from '@/constants/mock-tiemnho';
import { ProductForm, productFormSchema, type ProductFormValues } from './ProductForm';

export const leadMagnetSchema = productFormSchema;
export type LeadMagnetFormValues = ProductFormValues;

export interface LeadMagnetFormProps {
  initialProduct?: Product | null;
  onSuccess?: (product: Product) => void;
  onCancel?: () => void;
}

export function LeadMagnetForm({ initialProduct, onSuccess, onCancel }: LeadMagnetFormProps) {
  return (
    <ProductForm
      initialProduct={initialProduct}
      initialType='LEAD_MAGNET'
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
}
