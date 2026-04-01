import { create } from 'zustand'

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
}

export const useUIStore = create<UIState>((set) => ({
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
}))
