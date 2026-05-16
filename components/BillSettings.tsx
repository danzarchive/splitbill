'use client'

import { useState } from 'react'
import { updateTaxRates } from '@/actions/bill-actions'
import { Button } from '@/components/ui/button'
import { Settings2, Percent, Receipt, ChevronRight } from '@/lib/icons'

interface Props {
  billId: string
  taxRate: number
  serviceRate: number
}

export function BillSettings({ billId, taxRate, serviceRate }: Props) {
  const [tax, setTax] = useState(taxRate)
  const [service, setService] = useState(serviceRate)
  const [includeService, setIncludeService] = useState(serviceRate > 0)
  const [isSaving, setIsSaving] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [customService, setCustomService] = useState('')
  
  async function handleSave() {
    setIsSaving(true)
    const finalServiceRate = includeService ? service : 0
    await updateTaxRates(billId, tax, finalServiceRate)
    setIsSaving(false)
    setIsExpanded(false)
  }

  function handleServiceToggle(checked: boolean) {
    setIncludeService(checked)
    if (checked && service === 0) {
      setService(5)
    }
  }
  
  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="w-full flex items-center justify-between p-4 bg-white rounded-xl text-left"
      >
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">Pajak & Service</span>
        </div>
        <span className="text-sm text-gray-400 flex items-center gap-1">
          PPN {tax}%{serviceRate > 0 ? ` • Service ${serviceRate}%` : ''}
          <ChevronRight className="w-4 h-4" />
        </span>
      </button>
    )
  }
  
  return (
    <div className="bg-white rounded-xl p-4 space-y-5">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
        <Settings2 className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-900">Pajak & Service</span>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Pajak (PPN)</span>
        </div>
        
        <div className="flex gap-2">
          {[10, 11, 0].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => setTax(rate)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                tax === rate
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {rate === 0 ? 'Tanpa' : `${rate}%`}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Service Charge</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={includeService}
              onChange={(e) => handleServiceToggle(e.target.checked)}
              className="sr-only peer"
              aria-label="Toggle service charge"
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
          </label>
        </div>
        
        {includeService && (
          <div className="space-y-2">
            <div className="flex gap-2">
              {[5, 10].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setService(rate)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    service === rate && !customService
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {rate}%
                </button>
              ))}
              <div className="flex-1 relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Lainnya"
                  value={customService}
                  onChange={(e) => {
                    setCustomService(e.target.value)
                    const val = parseInt(e.target.value, 10)
                    if (!Number.isNaN(val)) {
                      setService(Math.max(0, Math.min(100, val)))
                    }
                  }}
                  className={`w-full py-2 px-3 rounded-lg text-sm font-medium text-center transition-colors ${
                    customService && service === parseInt(customService, 10)
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600 focus:bg-gray-200'
                  }`}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="pt-2 border-t border-gray-100">
        <div className="text-xs text-gray-500 mb-3">
          Total akan dihitung: Subtotal + PPN {tax}%{includeService ? ` + Service ${service}%` : ''}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsExpanded(false)
              setTax(taxRate)
              setService(serviceRate)
              setIncludeService(serviceRate > 0)
              setCustomService('')
            }}
          >
            Batal
          </Button>
          <Button 
            onClick={handleSave} 
            isLoading={isSaving}
          >
            Simpan
          </Button>
        </div>
      </div>
    </div>
  )
}
