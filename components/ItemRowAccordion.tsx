'use client'

import React, { useState } from 'react'
import { ChevronDown, Check, Percent, Receipt } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { SplitSlider } from './SplitSlider'

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
  const [includeTax, setIncludeTax] = useState(true)
  const [includeService, setIncludeService] = useState(true)
  
  const total = item.price * item.quantity
  const assigned = item.splits.reduce((sum, s) => sum + s.amount, 0)
  const remaining = total - assigned
  const isFullyAssigned = remaining === 0 && assigned > 0
  const assignedCount = item.splits.length
  
  const colorIndex = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % pastelColors.length
  const avatarColor = pastelColors[colorIndex]

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
              {item.splits.length > 0 ? (
                <div className="flex -space-x-1">
                  {item.splits.slice(0, 4).map((split) => {
                    const pIndex = participants.findIndex(p => p.id === split.participantId)
                    const pColor = pastelColors[pIndex >= 0 ? pIndex % pastelColors.length : 0]
                    return (
                      <div 
                        key={split.id}
                        className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-white", pColor)}
                        title={`${split.participant?.name || 'Unknown'}: ${formatCurrency(split.amount)}`}
                      >
                        {(split.participant?.name || '?').charAt(0).toUpperCase()}
                      </div>
                    )
                  })}
                  {item.splits.length > 4 && (
                    <div className="w-5 h-5 rounded-full bg-gray-100 ring-2 ring-white flex items-center justify-center text-[9px] font-medium text-gray-600">
                      +{item.splits.length - 4}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-xs text-orange-500 font-medium bg-orange-50 px-2 py-0.5 rounded-full">Unassigned</span>
              )}
            </div>
          </div>
          
          <div className="text-right shrink-0">
            <div className="font-semibold text-gray-900">
              {formatCurrency(total)}
            </div>
            {assignedCount > 0 && (
              <div className={cn("text-[11px] font-medium mt-0.5", 
                isFullyAssigned ? "text-green-600" : "text-orange-500"
              )}>
                {isFullyAssigned ? 'Split complete' : `${formatCurrency(remaining)} left`}
              </div>
            )}
          </div>
          
          <div className={cn("shrink-0 transition-transform duration-200 text-gray-400", isExpanded && "rotate-180")}>
            <ChevronDown className="w-5 h-5" />
          </div>
        </button>
      </div>
      
      {isExpanded && (
        <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-4 py-3 mb-2 border-b border-gray-50">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer group">
              <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-colors", 
                includeTax ? "bg-black border-black text-white" : "border-gray-300 text-transparent group-hover:border-gray-400")}>
                <Check className="w-3 h-3" />
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={includeTax} 
                onChange={() => setIncludeTax(!includeTax)} 
              />
              <Receipt className="w-3.5 h-3.5 text-gray-400" />
              <span>Apply Tax</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer group">
              <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-colors", 
                includeService ? "bg-black border-black text-white" : "border-gray-300 text-transparent group-hover:border-gray-400")}>
                <Check className="w-3 h-3" />
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={includeService} 
                onChange={() => setIncludeService(!includeService)} 
              />
              <Percent className="w-3.5 h-3.5 text-gray-400" />
              <span>Apply Svc</span>
            </label>
          </div>

          <SplitSlider 
            participants={participants}
            itemTotal={total}
            pastelColors={pastelColors}
            onSave={onSaveSplits}
            onCancel={onToggleExpand}
          />
          
          <div className="mt-4 pt-4 border-t border-red-50 flex justify-end">
            <button
              type="button"
              onClick={onDelete}
              className="text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors"
            >
              Remove Item
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
