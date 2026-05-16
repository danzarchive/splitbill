'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { addItem, deleteItem } from '@/actions/item-actions'
import { batchAssignSplits, batchRemoveSplits } from '@/actions/split-actions'
import { distributeEvenly } from '@/lib/calculator'
import { Button } from '@/components/ui/button'
import { ItemRowAccordion } from './ItemRowAccordion'
import { Package, Users, RotateCcw, Square, SquareCheck, X } from 'lucide-react'

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

interface Props {
  billId: string
  items: Item[]
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

const itemExamples = [
  'Nasi Goreng',
  'Es Teh',
  'Mie Ayam',
  'Kopi',
  'Bakso',
  'Sate',
]

export function ItemList({ billId, items: serverItems, participants }: Props) {
  const t = useTranslations('bill')
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', price: '', quantity: '1' })
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isBulkLoading, setIsBulkLoading] = useState(false)
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null)
  const [optimistic, setOptimistic] = useState<Item[] | null>(null)

  const items = optimistic ?? serverItems

  // Sync with server data when it changes (after router.refresh)
  useEffect(() => {
    setOptimistic(null)
  }, [serverItems])

  const placeholderItem = itemExamples[items.length % itemExamples.length]

  function updateOptimistic(fn: (prev: Item[]) => Item[]) {
    setOptimistic(prev => fn(prev ?? serverItems))
  }

  async function handleAdd() {
    if (!newItem.name || !newItem.price) {
      setError('Nama Dan Harga Item Wajib Diisi')
      return
    }

    const priceNum = parseFloat(newItem.price)
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      setError('Harga Harus Lebih Dari 0')
      return
    }

    setIsSubmitting(true)
    setError('')

    const priceInCents = Math.round(priceNum * 100)
    const qty = parseInt(newItem.quantity, 10) || 1

    // Optimistic: add immediately with temp id
    const tempItem: Item = {
      id: 'temp-' + Date.now(),
      name: newItem.name,
      price: priceInCents,
      quantity: qty,
      splits: [],
    }
    updateOptimistic(prev => [...prev, tempItem])

    try {
      const result = await addItem(billId, {
        name: newItem.name,
        price: priceInCents,
        quantity: qty,
      })

      if (result.success) {
        setNewItem({ name: '', price: '', quantity: '1' })
        setIsAdding(false)
        router.refresh()
      } else {
        setOptimistic(null) // Rollback
        setError(result.error || 'Gagal Menambahkan Item')
      }
    } catch {
      setOptimistic(null) // Rollback
      setError('Terjadi Kesalahan. Coba Lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(itemId: string) {
    // Optimistic: remove immediately
    updateOptimistic(prev => prev.filter(item => item.id !== itemId))
    setSelectedItems(prev => prev.filter(id => id !== itemId))

    try {
      const result = await deleteItem(itemId, billId)
      if (!result.success) {
        setOptimistic(null) // Rollback
      }
      router.refresh()
    } catch {
      setOptimistic(null) // Rollback
    }
  }

  function toggleItemSelection(itemId: string) {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  function selectAllItems() {
    setSelectedItems(items.map(item => item.id))
  }

  function deselectAllItems() {
    setSelectedItems([])
  }

  async function bulkSplitEqually() {
    if (selectedItems.length === 0 || participants.length === 0) return

    setIsBulkLoading(true)

    // Optimistic: apply equal quantity splits to selected items
    updateOptimistic(prev =>
      prev.map(item => {
        if (!selectedItems.includes(item.id)) return item
        const pricePerUnit = item.quantity > 0 ? Math.round(item.price / item.quantity) : 0
        const qtyShares = distributeEvenly(item.quantity, participants.length)
        return {
          ...item,
          splits: participants.map((p, i) => ({
            id: 'temp-' + p.id + '-' + item.id,
            amount: qtyShares[i] * pricePerUnit,
            participantId: p.id,
            participant: p,
          })),
        }
      })
    )

    try {
      const selectedItemsData = items.filter(item => selectedItems.includes(item.id))

      await Promise.all(
        selectedItemsData.map(item => {
          const pricePerUnit = item.quantity > 0 ? Math.round(item.price / item.quantity) : 0
          const qtyShares = distributeEvenly(item.quantity, participants.length)
          const splits = participants.map((p, i) => ({ participantId: p.id, amount: qtyShares[i] * pricePerUnit }))
          return batchAssignSplits(item.id, splits, billId)
        })
      )

      setSelectedItems([])
      router.refresh()
    } catch (err) {
      setOptimistic(null) // Rollback
      console.error('Bulk split failed:', err)
    } finally {
      setIsBulkLoading(false)
    }
  }

  async function bulkClearAll() {
    if (selectedItems.length === 0) return

    setIsBulkLoading(true)

    // Optimistic: clear splits from selected items
    updateOptimistic(prev =>
      prev.map(item => {
        if (!selectedItems.includes(item.id)) return item
        return { ...item, splits: [] }
      })
    )

    try {
      const selectedItemsData = items.filter(item => selectedItems.includes(item.id))
      const allSplitIds = selectedItemsData.flatMap(item => item.splits.map(s => s.id))

      if (allSplitIds.length > 0) {
        await batchRemoveSplits(allSplitIds, billId)
      }

      setSelectedItems([])
      router.refresh()
    } catch (err) {
      setOptimistic(null) // Rollback
      console.error('Bulk clear failed:', err)
    } finally {
      setIsBulkLoading(false)
    }
  }

  async function bulkToggleParticipant(participant: Participant) {
    if (selectedItems.length === 0 || participants.length === 0) return

    setIsBulkLoading(true)

    // Optimistic: toggle participant in all selected items
    // Optimistic: toggle participant in all selected items
    updateOptimistic(prev =>
      prev.map(item => {
        if (!selectedItems.includes(item.id)) return item
        const hasParticipant = item.splits.some(s => s.participantId === participant.id)
        const pricePerUnit = item.quantity > 0 ? Math.round(item.price / item.quantity) : 0

        if (hasParticipant) {
          const remaining = participants.filter(p => p.id !== participant.id)
          if (remaining.length === 0) return { ...item, splits: [] }
          const qtyShares = distributeEvenly(item.quantity, remaining.length)
          return {
            ...item,
            splits: remaining.map((p, i) => ({
              id: 'temp-' + p.id + '-' + item.id,
              amount: qtyShares[i] * pricePerUnit,
              participantId: p.id,
              participant: p,
            })),
          }
        } else {
          const qtyShares = distributeEvenly(item.quantity, participants.length)
          return {
            ...item,
            splits: participants.map((p, i) => ({
              id: 'temp-' + p.id + '-' + item.id,
              amount: qtyShares[i] * pricePerUnit,
              participantId: p.id,
              participant: p,
            })),
          }
        }
      })
    )

    try {
      const selectedItemsData = items.filter(item => selectedItems.includes(item.id))

      await Promise.all(
        selectedItemsData.map(async (item) => {
          const hasParticipant = item.splits.some(s => s.participantId === participant.id)
          const pricePerUnit = item.quantity > 0 ? Math.round(item.price / item.quantity) : 0

          if (hasParticipant) {
            const remainingParticipants = participants.filter(p => p.id !== participant.id)
            if (remainingParticipants.length === 0) {
              await batchRemoveSplits(item.splits.map(s => s.id), billId)
            } else {
              const qtyShares = distributeEvenly(item.quantity, remainingParticipants.length)
              const splits = remainingParticipants.map((p, i) => ({ participantId: p.id, amount: qtyShares[i] * pricePerUnit }))
              await batchAssignSplits(item.id, splits, billId)
            }
          } else {
            const qtyShares = distributeEvenly(item.quantity, participants.length)
            const splits = participants.map((p, i) => ({ participantId: p.id, amount: qtyShares[i] * pricePerUnit }))
            await batchAssignSplits(item.id, splits, billId)
          }
        })
      )

      router.refresh()
    } catch (err) {
      setOptimistic(null) // Rollback
      console.error('Bulk toggle failed:', err)
    } finally {
      setIsBulkLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-gray-400 tracking-wider">
        {t('items')}
      </h2>

      {isAdding ? (
        <div className="bg-white rounded-xl p-4 space-y-3">
          <input
            placeholder={placeholderItem}
            value={newItem.name}
            onChange={(e) => {
              setNewItem({ ...newItem, name: e.target.value })
              if (error) setError('')
            }}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400"
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Harga (Rp)"
              value={newItem.price}
              onChange={(e) => {
                setNewItem({ ...newItem, price: e.target.value })
                if (error) setError('')
              }}
              min="0"
              step="100"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400"
            />
            <input
              type="number"
              min="1"
              placeholder="Qty"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
              className="w-20 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400"
            />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAdding(false)
                setNewItem({ name: '', price: '', quantity: '1' })
                setError('')
              }}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleAdd}
              disabled={isSubmitting || !newItem.name || !newItem.price}
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
          <Package className="w-4 h-4" />
          <span className="text-sm font-medium">{t('addItem')}</span>
        </button>
      )}

      {items.length === 0 && !isAdding && (
        <div className="text-center py-6 text-gray-400">
          <p className="text-sm">Belum ada item</p>
          <p className="text-xs mt-1">Tambahkan menu atau barang yang dipesan</p>
        </div>
      )}

      {items.length > 1 && (
        <div className="flex items-center justify-between px-1 py-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectedItems.length === items.length ? deselectAllItems : selectAllItems}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              {selectedItems.length === items.length ? (
                <>
                  <SquareCheck className="w-4 h-4" />
                  Batalkan Semua
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" />
                  Pilih Semua ({items.length})
                </>
              )}
            </button>
          </div>
          {selectedItems.length > 0 && (
            <span className="text-xs text-gray-500">
              {selectedItems.length} item dipilih
            </span>
          )}
        </div>
      )}

      <div className={`space-y-2 ${selectedItems.length > 0 ? 'pb-48' : ''}`}>
        {items.map((item) => {
          const isExpanded = expandedItem === item.id
          const isOptimisticItem = item.id.startsWith('temp-')

          return (
            <div key={item.id} className={isOptimisticItem ? 'opacity-60' : ''}>
              <ItemRowAccordion
                item={item}
                participants={participants}
                pastelColors={pastelColors}
                isSelected={selectedItems.includes(item.id)}
                isExpanded={isExpanded}
                onToggleExpand={() => setExpandedItem(isExpanded ? null : item.id)}
                onToggleSelection={() => toggleItemSelection(item.id)}
                onDelete={() => handleDelete(item.id)}
                onSaveSplits={async (newSplits) => {
                  setLoadingItemId(item.id)

                  // Optimistic: update this item's splits immediately
                  updateOptimistic(prev =>
                    prev.map(it =>
                      it.id === item.id
                        ? {
                            ...it,
                            splits: newSplits
                              .filter(s => s.amount > 0)
                              .map(s => ({
                                id: 'temp-' + s.participantId + '-' + item.id,
                                amount: s.amount,
                                participantId: s.participantId,
                                participant: participants.find(p => p.id === s.participantId)!,
                              })),
                          }
                        : it
                    )
                  )

                  try {
                    const result = await batchAssignSplits(item.id, newSplits, billId)
                    if (result.success) {
                      router.refresh()
                    } else {
                      setOptimistic(null) // Rollback
                    }
                  } finally {
                    setLoadingItemId(null)
                    setExpandedItem(null)
                  }
                }}
              />
            </div>
          )
        })}
      </div>

      {selectedItems.length > 0 && participants.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-black text-white rounded-2xl p-4 shadow-2xl z-50">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-sm">{selectedItems.length} Item Dipilih</span>
            <button
              type="button"
              onClick={deselectAllItems}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={bulkSplitEqually}
              disabled={isBulkLoading}
              className="flex items-center gap-1 px-3 py-1.5 bg-white text-black text-xs rounded-full hover:bg-gray-100 transition-colors whitespace-nowrap disabled:opacity-50"
            >
              <Users className="w-3 h-3" />
              Bagi Rata Semua
            </button>
            <button
              type="button"
              onClick={bulkClearAll}
              disabled={isBulkLoading}
              className="flex items-center gap-1 px-3 py-1.5 bg-white/20 text-white text-xs rounded-full hover:bg-white/30 transition-colors whitespace-nowrap disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
              Kosongkan Semua
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-white/60 w-full mb-1">Tambah/ Hapus Orang:</span>
            {participants.map((p, pIndex) => {
              const participantColor = pastelColors[pIndex % pastelColors.length]
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => bulkToggleParticipant(p)}
                  disabled={isBulkLoading}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${participantColor} text-gray-800 disabled:opacity-50`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/60 flex items-center justify-center text-[10px] font-bold">
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                  {p.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
