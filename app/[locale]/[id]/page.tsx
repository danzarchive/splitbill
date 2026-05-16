import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getBill } from '@/actions/bill-actions'
import { ParticipantManager } from '@/components/ParticipantManager'
import { ItemList } from '@/components/ItemList'
import { BillSettings } from '@/components/BillSettings'
import { LanguageToggle } from '@/components/LanguageToggle'
import { ShareButton } from '@/components/ShareButton'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function SectionSkeleton() {
  return <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
}

export default async function BillPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params

  if (!id) {
    notFound()
  }

  const bill = await getBill(id)

  if (!bill) {
    notFound()
  }

  const subtotal = bill.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const taxAmount = Math.round(subtotal * (bill.taxRate / 100))
  const serviceAmount = Math.round(subtotal * (bill.serviceRate / 100))
  const totalAmount = subtotal + taxAmount + serviceAmount

  const assignedItemCount = bill.items.filter(item => item.splits.length > 0).length
  const totalItemCount = bill.items.length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-sm flex flex-col">
        <header className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <Link href={`/${locale}`}>
            <button type="button" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">{bill.title}</h1>
            {bill.description && (
              <p className="text-sm text-gray-500 truncate">{bill.description}</p>
            )}
          </div>
          <LanguageToggle />
        </header>

        <main className="px-5 py-4 space-y-4 flex-1">
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-xl font-bold text-gray-900">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            {totalItemCount > 0 && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  {bill.taxRate > 0 ? `Termasuk PPN ${bill.taxRate}%` : 'Tanpa PPN'}
                  {bill.serviceRate > 0 ? ` + Service ${bill.serviceRate}%` : ''}
                </span>
                <span className={`text-xs font-medium ${assignedItemCount === totalItemCount ? 'text-green-600' : 'text-orange-500'}`}>
                  {assignedItemCount}/{totalItemCount} item dibagi
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <ShareButton billId={bill.id} />
            <Link
              href={`/${locale}/${bill.id}/summary`}
              className="flex items-center justify-center font-medium rounded-lg bg-black text-white hover:bg-gray-800 px-4 py-3 text-base"
            >
              Lihat Detail
            </Link>
          </div>

          <Suspense fallback={<SectionSkeleton />}>
            <BillSettings
              billId={bill.id}
              taxRate={bill.taxRate}
              serviceRate={bill.serviceRate}
            />
          </Suspense>

          <Suspense fallback={<SectionSkeleton />}>
            <ParticipantManager
              billId={bill.id}
              participants={bill.participants}
            />
          </Suspense>

          <Suspense fallback={<SectionSkeleton />}>
            <ItemList
              billId={bill.id}
              items={bill.items}
              participants={bill.participants}
            />
          </Suspense>
        </main>

        <footer className="py-4 text-center border-t border-gray-100">
          <p className="text-xs text-gray-400">Dibuat dengan SplitBill</p>
          <p className="text-xs text-gray-400 mt-1">bayarbill.vercel.app</p>
        </footer>
      </div>
    </div>
  )
}
