import { useTranslations } from 'next-intl'
import { CreateBillForm } from '@/components/CreateBillForm'
import { LanguageToggle } from '@/components/LanguageToggle'

export default function HomePage() {
  const t = useTranslations('home')
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-sm">
        <header className="flex items-center justify-between px-5 py-4">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <LanguageToggle />
        </header>
        
        <main className="px-5 pb-8">
          <div className="py-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {t('subtitle')}
            </h2>
            <p className="text-sm text-gray-500">
              {t('description')}
            </p>
          </div>
          
          <CreateBillForm />
        </main>
      </div>
    </div>
  )
}
