'use client'

import { formatCurrency, cn } from '@/lib/utils'
import { Minus, Plus } from '@/lib/icons'

interface QuantityStepperProps {
  participant: { id: string; name: string }
  currentQty: number
  remainingQty: number
  pricePerUnit: number
  currency?: string
  color?: string
  onQuantityChange: (newQty: number) => void
}

export function QuantityStepper({
  participant,
  currentQty,
  remainingQty,
  pricePerUnit,
  currency = 'IDR',
  color = 'bg-gray-100',
  onQuantityChange,
}: QuantityStepperProps) {
  const canIncrease = currentQty < remainingQty + currentQty
  const canDecrease = currentQty > 0
  const personTotal = currentQty * pricePerUnit

  function handleDecrease() {
    if (canDecrease) {
      if (navigator.vibrate) navigator.vibrate(10)
      onQuantityChange(currentQty - 1)
    }
  }

  function handleIncrease() {
    if (canIncrease) {
      if (navigator.vibrate) navigator.vibrate(10)
      onQuantityChange(currentQty + 1)
    }
  }

  return (
    <div className={cn(
      "flex items-center justify-between py-3 px-1 rounded-xl transition-colors",
      currentQty > 0 ? "bg-gray-50/80" : ""
    )}>
      <div className="flex items-center gap-3">
        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0", color)}>
          {participant.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <span className="text-sm font-medium text-gray-900">{participant.name}</span>
          {currentQty > 0 && (
            <div className="text-xs text-gray-500 mt-0.5">
              {formatCurrency(pricePerUnit)} × {currentQty}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {currentQty > 0 && (
          <span className="text-sm font-semibold text-gray-900 tabular-nums">
            {formatCurrency(personTotal, currency)}
          </span>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleDecrease}
            disabled={!canDecrease}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90",
              canDecrease
                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            )}
            aria-label={`Kurangi ${participant.name}`}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <span className={cn(
            "w-8 text-center text-sm font-bold tabular-nums",
            currentQty > 0 ? "text-gray-900" : "text-gray-300"
          )}>
            {currentQty}
          </span>

          <button
            type="button"
            onClick={handleIncrease}
            disabled={!canIncrease}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90",
              canIncrease
                ? "bg-black text-white hover:bg-gray-800"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            )}
            aria-label={`Tambah ${participant.name}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
