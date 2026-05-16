'use client'

import { useState, useCallback, useRef } from 'react'
import { ChevronDown, Check } from '@/lib/icons'
import { formatCurrency, cn } from '@/lib/utils'
import { QuantityStepper } from './QuantityStepper'

interface Participant {
  id: string
  name: string
}

interface Split {
  id: string
  amount: number
  participantId: string
  participant: Participant
}

interface Item {
  id: string
  name: string
  price: number
  quantity: number
  splits: Split[]
}

interface ItemRowAccordionProps {
  item: Item
  participants: Participant[]
  pastelColors: string[]
  isSelected?: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onToggleSelection?: () => void
  onDelete: () => void
  onSaveSplits: (splits: { participantId: string; amount: number }[]) => Promise<void>
}

export function ItemRowAccordion({
  item,
  participants,
  pastelColors,
  isSelected,
  isExpanded,
  onToggleExpand,
  onToggleSelection,
  onDelete,
  onSaveSplits
}: ItemRowAccordionProps) {
  const total = item.price * item.quantity
  const pricePerUnit = item.price

  // Calculate current quantities from splits
  const currentQuantities = useState<Record<string, number>>(() => {
    const qty: Record<string, number> = {}
    participants.forEach(p => { qty[p.id] = 0 })
    item.splits.forEach(s => {
      if (pricePerUnit > 0) {
        qty[s.participantId] = Math.round(s.amount / pricePerUnit)
      }
    })
    return qty
  })[0]

  const [localQty, setLocalQty] = useState<Record<string, number>>(currentQuantities)
  const [isSaving, setIsSaving] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const totalAssignedQty = Object.values(localQty).reduce((sum, q) => sum + q, 0)
  const isFullyAssigned = totalAssignedQty === item.quantity && item.quantity > 0
  const isDirty = JSON.stringify(localQty) !== JSON.stringify(currentQuantities)

  const colorIndex = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % pastelColors.length
  const avatarColor = pastelColors[colorIndex]

  const handleQuantityChange = useCallback((participantId: string, newQty: number) => {
    setLocalQty(prev => ({ ...prev, [participantId]: newQty }))
  }, [])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const splits = participants
        .filter(p => localQty[p.id] > 0)
        .map(p => ({
          participantId: p.id,
          amount: localQty[p.id] * pricePerUnit,
        }))
      await onSaveSplits(splits)
    } finally {
      setIsSaving(false)
    }
  }, [localQty, participants, pricePerUnit, onSaveSplits])

  const handleCancel = useCallback(() => {
    setLocalQty(currentQuantities)
    onToggleExpand()
  }, [currentQuantities, onToggleExpand])

  return (
    <div className={cn("bg-white rounded-xl overflow-hidden shadow-sm border transition-all duration-200",
      isSelected ? "ring-2 ring-black border-transparent" : "border-gray-100 hover:border-gray-200",
      isExpanded ? "shadow-md" : ""
    )}>
      <div
        className={cn("w-full flex items-center gap-3 p-4 select-none transition-colors",
          isExpanded ? "bg-gray-50/50" : "hover:bg-gray-50/30"
        )}
      >
        {onToggleSelection && (
          <button
            type="button"
            onClick={() => onToggleSelection()}
            className={cn("shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors",
              isSelected ? "bg-black border-black text-white" : "border-gray-300 text-transparent hover:border-gray-400"
            )}
            aria-label={`Select ${item.name}`}
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={onToggleExpand}
          className="flex-1 flex items-center gap-3 min-w-0 text-left"
        >
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 font-medium shadow-sm", avatarColor)}>
            {item.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 truncate">{item.name}</span>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">×{item.quantity}</span>
            </div>

            <div className="flex items-center gap-1 mt-1.5">
              {totalAssignedQty > 0 ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1">
                    {participants.filter(p => localQty[p.id] > 0).slice(0, 4).map((p) => {
                      const pIndex = participants.findIndex(pp => pp.id === p.id)
                      const pColor = pastelColors[pIndex >= 0 ? pIndex % pastelColors.length : 0]
                      return (
                        <div
                          key={p.id}
                          className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-white", pColor)}
                          title={`${p.name}: ${localQty[p.id]} porsi`}
                        >
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      )
                    })}
                    {participants.filter(p => localQty[p.id] > 0).length > 4 && (
                      <div className="w-5 h-5 rounded-full bg-gray-100 ring-2 ring-white flex items-center justify-center text-[9px] font-medium text-gray-600">
                        +{participants.filter(p => localQty[p.id] > 0).length - 4}
                      </div>
                    )}
                  </div>
                  <span className={cn("text-[11px] font-medium",
                    isFullyAssigned ? "text-green-600" : "text-orange-500"
                  )}>
                    {totalAssignedQty}/{item.quantity} porsi
                  </span>
                </div>
              ) : (
                <span className="text-xs text-orange-500 font-medium bg-orange-50 px-2 py-0.5 rounded-full">Belum dibagi</span>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="font-semibold text-gray-900">
              {formatCurrency(total)}
            </div>
          </div>

          <div className={cn("shrink-0 transition-transform duration-200 text-gray-400", isExpanded && "rotate-180")}>
            <ChevronDown className="w-5 h-5" />
          </div>
        </button>
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-white">
          <div className="space-y-1">
            {participants.map((p, index) => (
              <QuantityStepper
                key={p.id}
                participant={p}
                currentQty={localQty[p.id] || 0}
                remainingQty={item.quantity - totalAssignedQty + (localQty[p.id] || 0)}
                pricePerUnit={pricePerUnit}
                color={pastelColors[index % pastelColors.length]}
                onQuantityChange={(newQty) => handleQuantityChange(p.id, newQty)}
              />
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className={cn("text-sm font-medium",
                isFullyAssigned ? "text-green-600" : totalAssignedQty > 0 ? "text-orange-500" : "text-gray-400"
              )}>
                {isFullyAssigned
                  ? `✅ ${item.quantity}/${item.quantity} porsi terbagi`
                  : totalAssignedQty > 0
                    ? `⚠️ ${totalAssignedQty}/${item.quantity} porsi terbagi`
                    : `Belum ada porsi dibagi`
                }
              </span>
              {totalAssignedQty > 0 && !isFullyAssigned && (
                <span className="text-xs text-orange-500">
                  {item.quantity - totalAssignedQty} porsi tersisa
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !isFullyAssigned || !isDirty}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors disabled:opacity-50",
                  isFullyAssigned && isDirty
                    ? "bg-black text-white hover:bg-gray-800"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                )}
              >
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-red-50 flex justify-end">
            <button
              type="button"
              onClick={onDelete}
              className="text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors"
            >
              Hapus Item
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
