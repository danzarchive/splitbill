'use server'

import { prisma } from '@/lib/prisma'

export async function assignSplit(
  itemId: string,
  participantId: string,
  amount: number,
  billId: string
) {
  if (amount < 0) {
    return { success: false, error: 'Amount must be positive' }
  }

  const item = await prisma.item.findFirst({ where: { id: itemId, billId } })
  if (!item) {
    return { success: false, error: 'Item not found' }
  }

  const participant = await prisma.participant.findFirst({ where: { id: participantId, billId } })
  if (!participant) {
    return { success: false, error: 'Participant not found' }
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

  return { success: true, split }
}

export async function removeSplit(id: string, billId: string) {
  const existing = await prisma.split.findFirst({
    where: { id, item: { billId } },
  })
  if (!existing) {
    return { success: false, error: 'Split not found' }
  }

  await prisma.split.delete({
    where: { id },
  })

  return { success: true }
}

export async function batchAssignSplits(
  itemId: string,
  splits: Array<{ participantId: string; amount: number }>,
  billId: string
) {
  const item = await prisma.item.findFirst({ where: { id: itemId, billId } })
  if (!item) {
    return { success: false, error: 'Item not found' }
  }

  try {
    await prisma.$transaction([
      prisma.split.deleteMany({ where: { itemId } }),
      prisma.split.createMany({
        data: splits
          .filter(s => s.amount > 0)
          .map(s => ({
            itemId,
            participantId: s.participantId,
            amount: s.amount,
          })),
      }),
    ])

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update splits',
    }
  }
}

export async function batchRemoveSplits(splitIds: string[], billId: string) {
  await prisma.split.deleteMany({
    where: {
      id: { in: splitIds },
      item: { billId },
    },
  })

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
