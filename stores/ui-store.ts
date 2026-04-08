import { create } from 'zustand'
import { produce } from 'immer'
import { liveTotals, LiveTotals } from '@/lib/calculator'

type ItemId = string
type ParticipantId = string

interface SplitItem {
  participantId: string
  amount: number
}

interface ItemWithSplits {
  id: string
  splits: SplitItem[]
}

interface UIState {
  isExporting: boolean
  setExporting: (value: boolean) => void
  
  editingItemId: string | null
  setEditingItem: (id: string | null) => void
  
  editingParticipantId: string | null
  setEditingParticipant: (id: string | null) => void
  
  isMobileMenuOpen: boolean
  setMobileMenuOpen: (value: boolean) => void
  
  toasts: { id: string; message: string; type: 'success' | 'error' }[]
  addToast: (message: string, type: 'success' | 'error') => void
  removeToast: (id: string) => void

  perItemSplits: Record<ItemId, Record<ParticipantId, number>>
  
  setItemSplit: (itemId: ItemId, participantId: ParticipantId, amount: number) => void
  resetItemSplits: (itemId: ItemId) => void
  equalSplit: (itemId: ItemId, itemTotal: number, participants: string[]) => void
  deriveLiveTotals: (itemId: ItemId, item: { price: number; quantity: number; taxRate: number; serviceRate: number }) => LiveTotals
  hydrateSplits: (items: ItemWithSplits[]) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  isExporting: false,
  setExporting: (value) => set({ isExporting: value }),
  
  editingItemId: null,
  setEditingItem: (id) => set({ editingItemId: id }),
  
  editingParticipantId: null,
  setEditingParticipant: (id) => set({ editingParticipantId: id }),
  
  isMobileMenuOpen: false,
  setMobileMenuOpen: (value) => set({ isMobileMenuOpen: value }),
  
  toasts: [],
  addToast: (message, type) => set((state) => ({
    toasts: [...state.toasts, { id: crypto.randomUUID(), message, type }]
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),

  perItemSplits: {},

  setItemSplit: (itemId, participantId, amount) => set(produce((state: UIState) => {
    if (!state.perItemSplits[itemId]) {
      state.perItemSplits[itemId] = {}
    }
    state.perItemSplits[itemId][participantId] = amount
  })),

  resetItemSplits: (itemId) => set(produce((state: UIState) => {
    delete state.perItemSplits[itemId]
  })),

  equalSplit: (itemId, itemTotal, participants) => set(produce((state: UIState) => {
    if (participants.length === 0) return
    const share = Math.floor(itemTotal / participants.length)
    state.perItemSplits[itemId] = {}
    participants.forEach(pId => {
      state.perItemSplits[itemId][pId] = share
    })
  })),

  deriveLiveTotals: (itemId, item) => {
    const state = get()
    const splits = Object.entries(state.perItemSplits[itemId] || {}).map(([pId, amount]) => ({
      amount,
      item,
      participantId: pId
    }))
    return liveTotals(splits)
  },

  hydrateSplits: (items) => set(produce((state: UIState) => {
    items.forEach((item) => {
      state.perItemSplits[item.id] = {}
      item.splits.forEach((split) => {
        state.perItemSplits[item.id][split.participantId] = split.amount
      })
    })
  }))
}))
