'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createBill } from '@/actions/bill-actions'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function CreateBillForm() {
  const t = useTranslations('home')
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    
    const result = await createBill(formData)
    
    if (result && 'error' in result && result.error) {
      setError(result.error as string)
      setIsLoading(false)
    }
  }
  
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 p-4 mt-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">{t('createButton')}</span>
      </button>
    )
  }
  
  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">
          {error}
        </div>
      )}
      
      <input
        name="title"
        placeholder={t('formTitlePlaceholder')}
        required
        disabled={isLoading}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 text-base"
      />
      
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(false)}
          disabled={isLoading}
        >
          Batal
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
        >
          {isLoading ? t('creating') : 'Buat'}
        </Button>
      </div>
    </form>
  )
}
