'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { addItem, deleteItem } from '@/actions/item-actions'
import { assignSplit, removeSplit } from '@/actions/split-actions'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Trash2, ChevronDown, ChevronUp, Package, Users, RotateCcw, Check, Square, SquareCheck, X } from 'lucide-react'

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
  'bg-[#F3E5F5]'
]

const itemExamples = [
  'Nasi Goreng',
  'Es Teh',
  'Mie Ayam',
  'Kopi',
  'Bakso',
  'Sate',
]

export function ItemList({ billId, items, participants }: Props) {
  const t = useTranslations('bill')
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', price: '', quantity: '1' })
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isBulkLoading, setIsBulkLoading] = useState(false)

  const placeholderItem = itemExamples[items.length % itemExamples.length]

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
    
    try {
      const priceInCents = Math.round(priceNum * 100)
      const result = await addItem(billId, {
        name: newItem.name,
        price: priceInCents,
        quantity: parseInt(newItem.quantity, 10) || 1,
      })
      
      if (!result.success) {
        setError(result.error || 'Gagal Menambahkan Item')
        setIsSubmitting(false)
      } else {
        setNewItem({ name: '', price: '', quantity: '1' })
        setIsAdding(false)
        setIsSubmitting(false)
      }
    } catch {
      setError('Terjadi Kesalahan. Coba Lagi.')
      setIsSubmitting(false)
    }
  }

  async function handleDelete(itemId: string) {
    await deleteItem(itemId, billId)
  }

  async function toggleParticipant(item: Item, participant: Participant) {
    if (participants.length === 0) return
    
    setLoadingItemId(item.id)
    
    try {
      const existingSplit = item.splits.find(s => s.participantId === participant.id)
      const totalAmount = item.price * item.quantity
      
      if (existingSplit) {
        await removeSplit(existingSplit.id, billId)
      } else {
        const currentCount = item.splits.length
        const newCount = currentCount + 1
        const sharePerPerson = Math.floor(totalAmount / newCount)
        
        await assignSplit(item.id, participant.id, sharePerPerson, billId)
        
        for (const split of item.splits) {
          if (split.participantId !== participant.id) {
            await assignSplit(item.id, split.participantId, sharePerPerson, billId)
          }
        }
      }
    } catch {
      console.error('Toggle failed:', new Error('Toggle operation failed'))
    } finally {
      setLoadingItemId(null)
    }
  }

  async function splitEqually(item: Item) {
    if (participants.length === 0) return
    
    setLoadingItemId(item.id)
    
    try {
      const totalAmount = item.price * item.quantity
      const count = participants.length
      const sharePerPerson = Math.floor(totalAmount / count)
      
      for (const participant of participants) {
        const existingSplit = item.splits.find(s => s.participantId === participant.id)
        if (existingSplit) {
          await assignSplit(item.id, participant.id, sharePerPerson, billId)
        } else {
          await assignSplit(item.id, participant.id, sharePerPerson, billId)
        }
      }
    } catch (err) {
      console.error('Split equally failed:', err)
    } finally {
      setLoadingItemId(null)
    }
  }

  async function clearAll(item: Item) {
    setLoadingItemId(item.id)
    
    try {
      for (const split of item.splits) {
        await removeSplit(split.id, billId)
      }
    } catch (err) {
      console.error('Clear all failed:', err)
    } finally {
      setLoadingItemId(null)
    }
  }

  async function assignToOne(item: Item, participant: Participant) {
    setLoadingItemId(item.id)
    
    try {
      for (const split of item.splits) {
        await removeSplit(split.id, billId)
      }
      
      const totalAmount = item.price * item.quantity
      await assignSplit(item.id, participant.id, totalAmount, billId)
    } catch (err) {
      console.error('Assign to one failed:', err)
    } finally {
      setLoadingItemId(null)
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
    
    try {
      const selectedItemsData = items.filter(item => selectedItems.includes(item.id))
      
      for (const item of selectedItemsData) {
        const totalAmount = item.price * item.quantity
        const count = participants.length
        const sharePerPerson = Math.floor(totalAmount / count)
        
        for (const participant of participants) {
          await assignSplit(item.id, participant.id, sharePerPerson, billId)
        }
      }
      
      setSelectedItems([])
    } catch (err) {
      console.error('Bulk split failed:', err)
    } finally {
      setIsBulkLoading(false)
    }
  }

  async function bulkClearAll() {
    if (selectedItems.length === 0) return
    
    setIsBulkLoading(true)
    
    try {
      const selectedItemsData = items.filter(item => selectedItems.includes(item.id))
      
      for (const item of selectedItemsData) {
        for (const split of item.splits) {
          await removeSplit(split.id, billId)
        }
      }
      
      setSelectedItems([])
    } catch (err) {
      console.error('Bulk clear failed:', err)
    } finally {
      setIsBulkLoading(false)
    }
  }

  async function bulkToggleParticipant(participant: Participant) {
    if (selectedItems.length === 0 || participants.length === 0) return
    
    setIsBulkLoading(true)
    
    try {
      const selectedItemsData = items.filter(item => selectedItems.includes(item.id))
      
      for (const item of selectedItemsData) {
        const existingSplit = item.splits.find(s => s.participantId === participant.id)
        const totalAmount = item.price * item.quantity
        
        if (existingSplit) {
          await removeSplit(existingSplit.id, billId)
        } else {
          const currentCount = item.splits.length
          const newCount = currentCount + 1
          const sharePerPerson = Math.floor(totalAmount / newCount)
          
          await assignSplit(item.id, participant.id, sharePerPerson, billId)
          
          for (const split of item.splits) {
            if (split.participantId !== participant.id) {
              await assignSplit(item.id, split.participantId, sharePerPerson, billId)
            }
          }
        }
      }
    } catch (err) {
      console.error('Bulk toggle failed:', err)
    } finally {
      setIsBulkLoading(false)
    }
  }

  const totalItemPrice = (item: Item) => item.price * item.quantity
  const assignedAmount = (item: Item) => item.splits.reduce((sum, s) => sum + s.amount, 0)

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
        {items.map((item, index) => {
          const isExpanded = expandedItem === item.id
          const total = totalItemPrice(item)
          const assigned = assignedAmount(item)
          const remaining = total - assigned
          const isFullyAssigned = remaining === 0 && assigned > 0
          const hasPartialAssignment = assigned > 0 && remaining > 0
          const assignedCount = item.splits.length
          const avatarColor = pastelColors[index % pastelColors.length]

          return (
            <div key={item.id} className={`bg-white rounded-xl overflow-hidden ${selectedItems.includes(item.id) ? 'ring-2 ring-black' : ''}`}>
              <div className="w-full flex items-center gap-2 p-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleItemSelection(item.id)
                  }}
                  className="shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {selectedItems.includes(item.id) ? (
                    <SquareCheck className="w-5 h-5 text-black" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
                
                <button
                  type="button"
                  className="flex-1 flex items-center gap-3 text-left min-w-0"
                  onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                >
                  <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-lg shrink-0`}>
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">{item.name}</span>
                      <span className="text-xs text-gray-400">×{item.quantity}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {item.splits.length > 0 ? (
                        <>
                          {item.splits.slice(0, 4).map((split, i) => (
                            <div 
                              key={split.id}
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-medium ${pastelColors[participants.findIndex(p => p.id === split.participantId) % pastelColors.length]}`}
                              style={{ marginLeft: i > 0 ? '-4px' : '0', color: '#374151' }}
                            >
                              {split.participant.name.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {item.splits.length > 4 && (
                            <span className="text-xs text-gray-400 ml-1">+{item.splits.length - 4}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">Belum Dibagi</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(total)}
                    </div>
                    {assignedCount > 0 && (
                      <div className={`text-xs ${isFullyAssigned ? 'text-green-600' : 'text-orange-500'}`}>
                        {assignedCount} orang × {formatCurrency(Math.floor(assigned / assignedCount))}
                      </div>
                    )}
                  </div>
                  
                  <div className="shrink-0 text-gray-400">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>
              </div>
              
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  {loadingItemId === item.id && (
                    <div className="py-2 text-sm text-gray-500 text-center">Memperbarui...</div>
                  )}
                  
                  <div className="pt-3 pb-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">Siapa Yang Ikut?</p>
                    
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                      <button
                        type="button"
                        onClick={() => splitEqually(item)}
                        disabled={loadingItemId === item.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-black text-white text-xs rounded-full hover:bg-gray-800 transition-colors whitespace-nowrap"
                      >
                        <Users className="w-3 h-3" />
                        Bagi Rata ({participants.length})
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => clearAll(item)}
                        disabled={loadingItemId === item.id || item.splits.length === 0}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200 transition-colors whitespace-nowrap disabled:opacity-50"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Kosongkan
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {participants.map((p, pIndex) => {
                        const isAssigned = item.splits.some(s => s.participantId === p.id)
                        const participantColor = pastelColors[pIndex % pastelColors.length]
                        
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => toggleParticipant(item, p)}
                            disabled={loadingItemId === item.id}
                            className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                              isAssigned 
                                ? `${participantColor} text-gray-800 ring-2 ring-offset-1 ring-gray-300` 
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-white/50 flex items-center justify-center text-xs font-bold">
                              {p.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="truncate max-w-[80px]">{p.name}</span>
                            {isAssigned && <Check className="w-3 h-3" />}
                          </button>
                        )
                      })}
                    </div>
                    
                    <div className="border-t border-gray-100 pt-2 mt-2">
                      <p className="text-xs text-gray-500 mb-2">Atau Bayar Sendiri:</p>
                      <div className="flex flex-wrap gap-2">
                        {participants.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => assignToOne(item, p)}
                            disabled={loadingItemId === item.id}
                            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {p.name} bayar semua
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      {isFullyAssigned ? (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          Sudah Dibagi Semua
                        </p>
                      ) : hasPartialAssignment ? (
                        <p className="text-sm text-orange-500">
                          Sisa {formatCurrency(remaining)} belum dibagi
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400">
                          Pilih orang yang makan item ini
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="w-full py-2 mt-2 text-red-500 text-sm hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Hapus "{item.name}"
                  </button>
                </div>
              )}
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
