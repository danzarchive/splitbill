'use client'

import React from 'react'
import { formatCurrency, cn } from '@/lib/utils'

export interface Participant {
  id: string
  name: string
  amount?: number
}

export interface SplitSliderProps {
  participants: Participant[]
  itemTotal: number
  pastelColors: string[]
  onSave: (splits: { participantId: string; amount: number }[]) => Promise<void>
  onCancel: () => void
  onAmountChange?: (participantId: string, amount: number) => void
  currency?: string
}

const pastelColors = [
  'bg-[#FFE4E1]',
  'bg-[#FFDAB9]', 
  'bg-[#FFF8DC]',
  'bg-[#E8F5E9]',
  'bg-[#E3F2FD]',
  'bg-[#F3E5F5]'
]

export function SplitSlider({ 
  participants, 
  itemTotal, 
  pastelColors,
  onSave,
  onCancel,
  onAmountChange,
  currency = 'IDR' 
}: SplitSliderProps) {
  const [localParticipants, setLocalParticipants] = React.useState(participants.map(p => ({...p, amount: p.amount || 0})))

  const handleChange = (id: string, amount: number) => {
    setLocalParticipants(prev => prev.map(p => p.id === id ? {...p, amount} : p))
    if (onAmountChange) onAmountChange(id, amount)
  }

  const handleSave = async () => {
    const splits = localParticipants.map(p => ({participantId: p.id, amount: p.amount}))
    await onSave(splits)
  }

  const handleCancel = () => {
    onCancel()
  }
  const assigned = participants.reduce((sum, p) => sum + (p.amount || 0), 0)
  const remaining = itemTotal - assigned

  return (
    <div className="space-y-6 pt-2 pb-4">
      <div className="space-y-5">
        {participants.map((p, index) => {
          const amount = p.amount || 0
          const colorClass = pastelColors[index % pastelColors.length]
          const colorHex = colorClass.replace('bg-[', '').replace(']', '')
          
          return (
            <div key={p.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", colorClass)}>
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-gray-700">{p.name}</span>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {formatCurrency(amount, currency)}
                </div>
              </div>
              
              <div className="relative w-full h-8 flex items-center">
                <input
                  type="range"
                  min={0}
                  max={itemTotal}
                  step={100}
                  value={amount}
                  onChange={(e) => onAmountChange(p.id, Number(e.target.value))}
                  className="absolute w-full h-3 appearance-none bg-gray-100 rounded-full outline-none z-10 custom-slider cursor-pointer [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-moz-range-thumb]:w-8 [&::-moz-range-thumb]:h-8"
                  style={{
                    '--slider-color': colorHex || '#e5e7eb',
                  } as React.CSSProperties}
                  aria-label={`Amount for ${p.name}`}
                  aria-valuenow={amount}
                  aria-valuemin={0}
                  aria-valuemax={itemTotal}
                />
                <div 
                  className={cn("absolute h-3 rounded-full pointer-events-none", colorClass)}
                  style={{ width: `${itemTotal > 0 ? (amount / itemTotal) * 100 : 0}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="flex justify-between text-sm font-medium mb-2">
          <span className="text-gray-500">Total</span>
          <span className={cn(remaining === 0 ? "text-green-600" : remaining < 0 ? "text-red-500" : "text-orange-500")}>
            {formatCurrency(Math.abs(remaining), currency)} {remaining < 0 ? 'lebih' : 'tersisa'}
          </span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
          {participants.map((p, index) => {
            const amount = p.amount || 0
            if (amount <= 0) return null
            const colorClass = pastelColors[index % pastelColors.length]
            const percent = itemTotal > 0 ? (amount / itemTotal) * 100 : 0
            return (
              <div 
                key={p.id}
                className={cn("h-full", colorClass)}
                style={{ width: `${percent}%` }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
