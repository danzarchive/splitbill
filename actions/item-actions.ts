'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

interface ItemData {
  name: string
  price: number
  quantity: number
}

export async function addItem(billId: string, data: ItemData) {
  if (!data.name || data.name.trim().length === 0) {
    return { success: false, error: 'Name is required' }
  }
  
  if (data.price < 0) {
    return { success: false, error: 'Price must be positive' }
  }
  
  if (data.quantity < 1) {
    return { success: false, error: 'Quantity must be at least 1' }
  }
  
  const item = await prisma.item.create({
    data: {
      name: data.name.trim(),
      price: data.price,
      quantity: data.quantity,
      billId,
    },
  })
  
  revalidatePath(`/${billId}`)
  return { success: true, item }
}

export async function updateItem(id: string, billId: string, data: Partial<ItemData>) {
  const updateData: Partial<ItemData> = {}
  
  if (data.name !== undefined) {
    updateData.name = data.name.trim()
  }
  if (data.price !== undefined) {
    updateData.price = data.price
  }
  if (data.quantity !== undefined) {
    updateData.quantity = data.quantity
  }
  
  const item = await prisma.item.update({
    where: { id },
    data: updateData,
  })
  
  revalidatePath(`/${billId}`)
  return { success: true, item }
}

export async function deleteItem(id: string, billId: string) {
  await prisma.item.delete({
    where: { id },
  })
  
  revalidatePath(`/${billId}`)
  return { success: true }
}
