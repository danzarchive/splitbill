'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function addParticipant(billId: string, name: string) {
  if (!name || name.trim().length === 0) {
    return { success: false, error: 'Name is required' }
  }
  
  const participant = await prisma.participant.create({
    data: {
      name: name.trim(),
      billId,
    },
  })
  
  revalidatePath(`/${billId}`)
  return { success: true, participant }
}

export async function removeParticipant(id: string, billId: string) {
  await prisma.participant.delete({
    where: { id },
  })
  
  revalidatePath(`/${billId}`)
  return { success: true }
}
