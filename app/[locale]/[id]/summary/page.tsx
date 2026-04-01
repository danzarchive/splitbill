import { notFound } from 'next/navigation'
import { getBill } from '@/actions/bill-actions'
import { SummaryView } from '@/components/SummaryView'

export default async function SummaryPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id } = await params
  
  if (!id) {
    notFound()
  }
  
  const bill = await getBill(id)
  
  if (!bill) {
    notFound()
  }
  
  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-md mx-auto pb-8">
        <SummaryView bill={bill} />
      </div>
    </main>
  )
}
