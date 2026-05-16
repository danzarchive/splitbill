'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { addParticipant, removeParticipant } from '@/actions/participant-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, UserPlus } from 'lucide-react'

interface Participant {
  id: string
  name: string
}

interface Props {
  billId: string
  participants: Participant[]
}

const pastelColors = [
  'bg-[#FFE4E1]',
  'bg-[#FFDAB9]',
  'bg-[#FFF8DC]',
  'bg-[#E8F5E9]',
  'bg-[#E3F2FD]',
  'bg-[#F3E5F5]',
]

const placeholderExamples = [
  'Contoh: Budi',
  'Contoh: Ani',
  'Contoh: Citra',
  'Contoh: Dodi',
  'Contoh: Elsa',
  'Contoh: Fajar',
]

export function ParticipantManager({ billId, participants: serverParticipants }: Props) {
  const t = useTranslations('bill')
  const router = useRouter()
  const [name, setName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [optimistic, setOptimistic] = useState<Participant[] | null>(null)

  const participants = optimistic ?? serverParticipants

  // Sync with server data when it changes (after router.refresh)
  useEffect(() => {
    setOptimistic(null)
  }, [serverParticipants])

  const placeholderText = placeholderExamples[participants.length % placeholderExamples.length]

  async function handleAdd() {
    if (!name.trim()) {
      setError('Nama Peserta Wajib Diisi')
      return
    }

    const trimmedName = name.trim()
    setIsSubmitting(true)
    setError('')

    // Optimistic: add immediately with temp id
    const tempParticipant: Participant = { id: 'temp-' + Date.now(), name: trimmedName }
    setOptimistic(prev => [...(prev ?? serverParticipants), tempParticipant])

    try {
      const result = await addParticipant(billId, trimmedName)
      if (result.success) {
        setName('')
        setIsAdding(false)
        router.refresh()
      } else {
        setOptimistic(null) // Rollback
        setError(result.error || 'Gagal Menambahkan Peserta')
      }
    } catch {
      setOptimistic(null) // Rollback
      setError('Terjadi Kesalahan. Coba Lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRemove(id: string) {
    // Optimistic: remove immediately
    setOptimistic(prev => (prev ?? serverParticipants).filter(p => p.id !== id))

    try {
      const result = await removeParticipant(id, billId)
      if (!result.success) {
        setOptimistic(null) // Rollback
      }
      router.refresh()
    } catch {
      setOptimistic(null) // Rollback
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-gray-400 tracking-wider">
        {t('participants')}
      </h2>

      {isAdding ? (
        <div className="space-y-3">
          <div>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError('')
              }}
              placeholder={placeholderText}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500 mt-1.5">{error}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAdding(false)
                setName('')
                setError('')
                setOptimistic(null)
              }}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleAdd}
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? 'Menyimpan...' : 'Tambah'}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors bg-white"
        >
          <UserPlus className="w-4 h-4" />
          <span className="text-sm font-medium">{t('addParticipant')}</span>
        </button>
      )}

      <div className="space-y-2">
        {participants.length === 0 && !isAdding && (
          <div className="text-center py-6 text-gray-400">
            <p className="text-sm">Belum ada peserta</p>
            <p className="text-xs mt-1">Tambahkan orang yang ikut patungan</p>
          </div>
        )}
        {participants.map((p, index) => {
          const avatarColor = pastelColors[index % pastelColors.length]
          const isOptimistic = p.id.startsWith('temp-')
          return (
            <div
              key={p.id}
              className={`flex items-center justify-between p-3 bg-white rounded-xl transition-opacity ${isOptimistic ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-lg font-medium text-gray-700`}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-gray-900">{p.name}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(p.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Hapus Peserta"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
