'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { calculateExpiryDate } from '@/lib/utils'

export async function createBill(formData: FormData, locale: string) {
  const title = formData.get('title') as string
  const description = formData.get('description') as string

  if (!title || title.trim().length === 0) {
    return { success: false, error: 'Title is required' }
  }

  const bill = await prisma.bill.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      expiresAt: calculateExpiryDate(),
    },
  })

  redirect(`/${locale}/${bill.id}`)
}

export async function getBill(id: string) {
  const bill = await prisma.bill.findUnique({
    where: { id },
    include: {
      participants: {
        include: {
          splits: {
            include: {
              item: true,
            },
          },
        },
      },
      items: {
        include: {
          splits: {
            include: {
              participant: true,
            },
          },
        },
      },
    },
  })

  return bill
}

export async function updateTaxRates(billId: string, taxRate: number, serviceRate: number) {
  await prisma.bill.update({
    where: { id: billId },
    data: {
      taxRate: Math.max(0, Math.min(100, taxRate)),
      serviceRate: Math.max(0, Math.min(100, serviceRate)),
    },
  })
}

export async function deleteExpiredBills() {
  const result = await prisma.bill.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  })

  return { deleted: result.count }
}
