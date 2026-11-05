'use client';

import * as React from 'react';
import * as z from 'zod';
import { Product } from '@/constants/mock-tiemnho';
import { ProductForm, productFormSchema, type ProductFormValues } from './ProductForm';

// Schema tương thích ngược
export const digitalProductSchema = productFormSchema;
export type DigitalProductFormValues = ProductFormValues;

export interface DigitalProductFormProps {
  initialProduct?: Product | null;
  onSuccess?: (product: Product) => void;
  onCancel?: () => void;
}

export function DigitalProductForm({
  initialProduct,
  onSuccess,
  onCancel
}: DigitalProductFormProps) {
  return (
    <ProductForm
      initialProduct={initialProduct}
      initialType='DIGITAL'
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
}
