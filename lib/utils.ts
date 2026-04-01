import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amountInCents: number, currency: string = 'IDR'): string {
  if (currency === 'IDR') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountInCents / 100)
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amountInCents / 100)
}

export function parseCurrencyInput(input: string): number | null {
  const cleaned = input.replace(/[^\d]/g, '')
  const value = parseInt(cleaned, 10)
  if (isNaN(value)) return null
  return value * 100 // Convert to cents
}

export function calculateExpiryDate(): Date {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date
}
