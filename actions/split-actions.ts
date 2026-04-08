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

export async function batchUpsertItemSplits(
  itemId: string,
  splits: Array<{ participantId: string; amount: number }>,
  billId: string
) {
  if (splits.some(s => s.amount <= 0)) {
    return { success: false, error: 'All amounts must be positive' }
  }
  
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { splits: true },
  })
  
  if (!item) {
    return { success: false, error: 'Item not found' }
  }
  
  const itemTotal = item.price * item.quantity
  const splitsTotal = splits.reduce((sum, s) => sum + s.amount, 0)
  
  if (splitsTotal !== itemTotal) {
    return { 
      success: false, 
      error: `Splits total (${splitsTotal}) must equal item total (${itemTotal})` 
    }
  }
  
  try {
    await prisma.$transaction([
      prisma.split.deleteMany({
        where: { itemId },
      }),
      prisma.split.createMany({
        data: splits.map(s => ({
          itemId,
          participantId: s.participantId,
          amount: s.amount,
        })),
      }),
    ])
    
    revalidatePath(`/${billId}`)
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update splits' 
    }
  }
}
