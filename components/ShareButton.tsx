'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

interface ShareButtonProps {
  billId: string
}

export function ShareButton({ billId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = `${window.location.origin}/${billId}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SplitBill',
          text: 'Lihat Tagihan Ini',
          url,
        })
        return
      } catch {
      }
    }

    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex items-center justify-center font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 bg-white px-4 py-3 text-base gap-2"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-600" />
          <span className="text-green-600">Tersalin!</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          Bagikan
        </>
      )}
    </button>
  )
}
