'use client';

import * as React from 'react';
import * as z from 'zod';
import { Product } from '@/constants/mock-tiemnho';
import { ProductForm, productFormSchema, type ProductFormValues } from './ProductForm';

export const physicalProductSchema = productFormSchema;
export type PhysicalProductFormValues = ProductFormValues;

export interface PhysicalProductFormProps {
  initialProduct?: Product | null;
  onSuccess?: (product: Product) => void;
  onCancel?: () => void;
}

export function PhysicalProductForm({
  initialProduct,
  onSuccess,
  onCancel
}: PhysicalProductFormProps) {
  return (
    <ProductForm
      initialProduct={initialProduct}
      initialType='PHYSICAL'
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
}
