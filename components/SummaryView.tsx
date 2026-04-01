'use client'

import { useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { calculateParticipantTotals, calculateSimplifiedDebts } from '@/lib/calculator'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'

interface SummaryViewProps {
  bill: {
    id: string
    title: string
    description: string | null
    taxRate: number
    serviceRate: number
    currency: string
    createdAt: Date
    participants: Array<{
      id: string
      name: string
    }>
    items: Array<{
      id: string
      name: string
      price: number
      quantity: number
      splits: Array<{
        id: string
        amount: number
        participantId: string
      }>
    }>
  }
}

const pastelColors = [
  'bg-[#FFE4E1]',
  'bg-[#FFDAB9]', 
  'bg-[#FFF8DC]',
  'bg-[#E8F5E9]',
  'bg-[#E3F2FD]',
  'bg-[#F3E5F5]'
]

export function SummaryView({ bill }: SummaryViewProps) {
  const t = useTranslations('summary')
  const locale = useLocale()
  const summaryRef = useRef<HTMLDivElement>(null)

  const participantSplits = bill.participants.map(p => {
    const splits = bill.items.flatMap(item => 
      item.splits
        .filter(s => s.participantId === p.id)
        .map(s => ({
          amount: s.amount,
          item: {
            price: item.price,
            quantity: item.quantity,
            taxRate: bill.taxRate,
            serviceRate: bill.serviceRate,
          }
        }))
    )
    return { participant: p, splits }
  })

  const participantTotals = calculateParticipantTotals(
    bill.participants,
    participantSplits.flatMap(ps => 
      ps.splits.map(s => ({ ...s, participantId: ps.participant.id }))
    )
  )

  const debts = calculateSimplifiedDebts(
    participantTotals.map(pt => ({
      id: pt.participantId,
      name: pt.name,
      total: pt.total,
      paid: 0,
    }))
  )

  const grandTotal = participantTotals.reduce((sum, pt) => sum + pt.total, 0)
  const subtotal = bill.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const taxAmount = Math.round(subtotal * (bill.taxRate / 100))
  const serviceAmount = Math.round(subtotal * (bill.serviceRate / 100))
  const hasTaxOrService = bill.taxRate > 0 || bill.serviceRate > 0

  async function handleExport() {
    if (!summaryRef.current) return
    
    try {
      const { toPng } = await import('html-to-image')
      
      const dataUrl = await toPng(summaryRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: 300,
        height: summaryRef.current.scrollHeight,
        style: {
          margin: '0',
          width: '300px',
        },
      })
      
      const link = document.createElement('a')
      link.download = `splitbill-${bill.title}-${new Date().toISOString().split('T')[0]}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed. Please try again.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href={`/${locale}/${bill.id}`}>
          <Button variant="ghost" size="sm" className="gap-1 text-gray-500 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Button>
        </Link>
      </div>

      <div className="text-center py-4">
        <h1 className="text-xl font-bold text-gray-900">{bill.title}</h1>
        {bill.description && <p className="text-sm text-gray-500 mt-1">{bill.description}</p>}
      </div>

      <div 
        ref={summaryRef} 
        className="bg-white mx-auto"
        style={{ width: '300px', maxWidth: '100%' }}
      >
        <div className="text-center py-6 border-b-2 border-black">
          <div className="flex items-center justify-center mb-2">
            <span className="font-bold text-2xl text-black">SplitBill</span>
          </div>
          <h2 className="font-bold text-base text-gray-900 uppercase tracking-wide">{bill.title}</h2>
          {bill.description && (
            <p className="text-sm text-gray-500 mt-1">{bill.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            {new Date(bill.createdAt).toLocaleDateString('id-ID', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>

        <div className="py-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">
            Daftar Item
          </div>
          {bill.items.map((item) => (
            <div key={item.id} className="flex justify-between items-start px-4 py-2">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{item.name}</div>
                <div className="text-sm text-gray-500">
                  {item.quantity} × {formatCurrency(item.price)}
                </div>
              </div>
              <div className="font-semibold text-gray-900">
                {formatCurrency(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-gray-300 py-4 px-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
          </div>
          {bill.taxRate > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">PPN ({bill.taxRate}%)</span>
              <span className="font-medium text-gray-900">{formatCurrency(taxAmount)}</span>
            </div>
          )}
          {bill.serviceRate > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Service ({bill.serviceRate}%)</span>
              <span className="font-medium text-gray-900">{formatCurrency(serviceAmount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-lg text-gray-900">{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        <div className="border-t-2 border-black py-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">
            Per Orang
          </div>
          {participantTotals.map((pt, index) => {
            const avatarColor = pastelColors[index % pastelColors.length]
            const extraCharges = pt.taxShare + pt.serviceShare
            return (
              <div key={pt.participantId} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-sm font-medium text-gray-700`}>
                    {pt.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-900">{pt.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{formatCurrency(pt.total)}</div>
                  {hasTaxOrService && extraCharges > 0 && (
                    <div className="text-xs text-gray-500">
                      {formatCurrency(pt.subtotal)} + {formatCurrency(extraCharges)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {debts.length > 0 && (
          <div className="border-t border-dashed border-gray-300 py-4 px-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Detail Transfer
            </div>
            {debts.map((debt) => (
              <div key={`${debt.from}-${debt.to}`} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-900">{debt.from}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium text-gray-900">{debt.to}</span>
                </div>
                <span className="font-semibold text-gray-900">{formatCurrency(debt.amount)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="border-t-2 border-black py-4 text-center bg-gray-50">
          <p className="text-xs text-gray-400">Dibuat dengan SplitBill</p>
          <p className="text-xs text-gray-400 mt-1">bayarbill.vercel.app</p>
        </div>
      </div>

      <Button 
        onClick={handleExport} 
        className="w-64 mx-auto flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium bg-black text-white hover:bg-gray-800 transition-colors"
      >
        <Download className="w-5 h-5" />
        {t('exportImage')}
      </Button>
    </div>
  )
}
