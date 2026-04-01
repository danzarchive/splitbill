'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function assignSplit(
  itemId: string,
  participantId: string,
  amount: number,
  billId: string
) {
  if (amount < 0) {
    return { success: false, error: 'Amount must be positive' }
  }
  
  const split = await prisma.split.upsert({
    where: {
      itemId_participantId: {
        itemId,
        participantId,
      },
    },
    update: {
      amount,
    },
    create: {
      itemId,
      participantId,
      amount,
    },
  })
  
  revalidatePath(`/${billId}`)
  return { success: true, split }
}

export async function removeSplit(id: string, billId: string) {
  await prisma.split.delete({
    where: { id },
  })
  
  revalidatePath(`/${billId}`)
  return { success: true }
}

export async function validateSplits(itemId: string) {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { splits: true },
  })
  
  if (!item) {
    return { valid: false, error: 'Item not found' }
  }
  
  const totalAssigned = item.splits.reduce((sum, split) => sum + split.amount, 0)
  const expected = item.price * item.quantity
  const remaining = expected - totalAssigned
  
  return {
    valid: totalAssigned === expected,
    assigned: totalAssigned,
    expected,
    remaining,
  }
}
