'use client';

import * as React from 'react';
import * as z from 'zod';
import { Product } from '@/constants/mock-tiemnho';
import { ProductForm, productFormSchema, type ProductFormValues } from './ProductForm';

export const externalLinkSchema = productFormSchema;
export type ExternalLinkFormValues = ProductFormValues;

export interface ExternalLinkFormProps {
  initialProduct?: Product | null;
  onSuccess?: (product: Product) => void;
  onCancel?: () => void;
}

export function ExternalLinkForm({ initialProduct, onSuccess, onCancel }: ExternalLinkFormProps) {
  return (
    <ProductForm
      initialProduct={initialProduct}
      initialType='EXTERNAL_LINK'
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
}
