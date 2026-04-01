'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LanguageToggle() {
  const t = useTranslations('language')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const switchLocale = useCallback((newLocale: string) => {
    localStorage.setItem('preferred-locale', newLocale)
    const segments = pathname.split('/').filter(Boolean)
    if (segments[0] === locale) {
      segments[0] = newLocale
    } else {
      segments.unshift(newLocale)
    }
    const newPath = `/${segments.join('/')}`
    router.push(newPath)
    setIsOpen(false)
  }, [locale, pathname, router])
  
  useEffect(() => {
    const saved = localStorage.getItem('preferred-locale')
    if (saved && saved !== locale) {
      switchLocale(saved)
    }
  }, [locale, switchLocale])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])
  
  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Globe className="w-4 h-4" />
        {locale === 'id' ? 'Id' : 'En'}
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <button
            type="button"
            onClick={() => switchLocale('id')}
            className={`w-full text-left px-4 py-2 hover:bg-gray-100 first:rounded-t-lg ${locale === 'id' ? 'bg-blue-50 text-blue-600' : ''}`}
          >
            🇮🇩 {t('id')}
          </button>
          <button
            type="button"
            onClick={() => switchLocale('en')}
            className={`w-full text-left px-4 py-2 hover:bg-gray-100 last:rounded-b-lg ${locale === 'en' ? 'bg-blue-50 text-blue-600' : ''}`}
          >
            🇬🇧 {t('en')}
          </button>
        </div>
      )}
    </div>
  )
}
