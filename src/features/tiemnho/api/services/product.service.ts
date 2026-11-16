'use server';

import { prisma } from '@/lib/prisma';
import { ensureDatabaseSeeded } from '@/lib/seed';
import { ProductType, type Product } from '@/constants/mock-tiemnho';
import type { ProductFilterParams, CreateProductInput } from '../types';
import { formatProduct } from './formatters';
import { getProfile } from './profile.service';

export async function getProducts(filters?: ProductFilterParams): Promise<Product[]> {
  await ensureDatabaseSeeded();

  const whereClause: Record<string, unknown> = {};

  if (filters?.publishedOnly) {
    whereClause.isPublished = true;
  }

  if (filters?.type && filters.type !== 'ALL') {
    whereClause.type = filters.type as ProductType;
  }

  if (filters?.search && filters.search.trim()) {
    const s = filters.search.trim();
    whereClause.OR = [
      { title: { contains: s, mode: 'insensitive' } },
      { description: { contains: s, mode: 'insensitive' } }
    ];
  }

  const list = await prisma.product.findMany({
    where: whereClause,
    orderBy: { displayOrder: 'asc' }
  });

  return list.map(formatProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  await ensureDatabaseSeeded();
  const product = await prisma.product.findUnique({
    where: { id }
  });
  return product ? formatProduct(product) : null;
}

export async function createProduct(data: CreateProductInput): Promise<Product> {
  const profile = await getProfile();
  const maxOrder = await prisma.product.aggregate({
    _max: { displayOrder: true }
  });
  const nextOrder = (maxOrder._max.displayOrder ?? 0) + 1;

  const created = await prisma.product.create({
    data: {
      userId: profile.id,
      creatorId: profile.id,
      type: data.type,
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      price: data.price,
      originalPrice: data.originalPrice,
      coverImage: data.coverImage,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      externalUrl: data.externalUrl,
      buttonText:
        data.buttonText || (data.type === ProductType.LEAD_MAGNET ? 'Nhận ngay' : 'Mua ngay'),
      isPublished: data.isPublished,
      isFeatured: data.isFeatured,
      stock: data.stock ?? 999,
      displayOrder: nextOrder,
      soldCount: 0
    }
  });

  return formatProduct(created);
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...(updates.type !== undefined && { type: updates.type }),
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.subtitle !== undefined && { subtitle: updates.subtitle }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.price !== undefined && { price: updates.price }),
      ...(updates.originalPrice !== undefined && { originalPrice: updates.originalPrice }),
      ...(updates.coverImage !== undefined && { coverImage: updates.coverImage }),
      ...(updates.fileUrl !== undefined && { fileUrl: updates.fileUrl }),
      ...(updates.fileName !== undefined && { fileName: updates.fileName }),
      ...(updates.externalUrl !== undefined && { externalUrl: updates.externalUrl }),
      ...(updates.buttonText !== undefined && { buttonText: updates.buttonText }),
      ...(updates.isPublished !== undefined && { isPublished: updates.isPublished }),
      ...(updates.isFeatured !== undefined && { isFeatured: updates.isFeatured }),
      ...(updates.displayOrder !== undefined && { displayOrder: updates.displayOrder }),
      ...(updates.stock !== undefined && { stock: updates.stock })
    }
  });

  return formatProduct(updated);
}

export async function deleteProduct(id: string): Promise<boolean> {
  // Disconnect related orders first so historical orders remain valid
  await prisma.order.updateMany({
    where: { productId: id },
    data: { productId: null }
  });

  await prisma.product.delete({
    where: { id }
  });
  return true;
}

export async function reorderProducts(ids: string[]): Promise<Product[]> {
  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.product.update({
        where: { id },
        data: { displayOrder: index + 1 }
      })
    )
  );

  return getProducts();
}
