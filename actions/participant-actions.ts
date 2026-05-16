'use server'

import { prisma } from '@/lib/prisma'

export async function addParticipant(billId: string, name: string) {
  if (!name || name.trim().length === 0) {
    return { success: false, error: 'Name is required' }
  }

  const bill = await prisma.bill.findUnique({ where: { id: billId } })
  if (!bill) {
    return { success: false, error: 'Bill not found' }
  }

  const participant = await prisma.participant.create({
    data: {
      name: name.trim(),
      billId,
    },
  })

  return { success: true, participant }
}

export async function removeParticipant(id: string, billId: string) {
  const existing = await prisma.participant.findFirst({ where: { id, billId } })
  if (!existing) {
    return { success: false, error: 'Participant not found' }
  }

  await prisma.participant.delete({
    where: { id },
  })

  return { success: true }
}
