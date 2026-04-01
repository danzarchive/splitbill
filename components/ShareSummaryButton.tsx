'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Check } from 'lucide-react'

interface ShareSummaryButtonProps {
  billId: string
}

export function ShareSummaryButton({ billId }: ShareSummaryButtonProps) {
  const [copied, setCopied] = useState(false)
  
  async function handleShare() {
    const url = `${window.location.origin}/${billId}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Splitbill',
          text: 'Lihat Tagihan Ini',
          url: url,
        })
      } catch {
        copyToClipboard(url)
      }
    } else {
      copyToClipboard(url)
    }
  }
  
  function copyToClipboard(url: string) {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <Button
      variant="outline"
      onClick={handleShare}
      className="w-full gap-2"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          Tersalin
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          Bagikan
        </>
      )}
    </Button>
  )
}
