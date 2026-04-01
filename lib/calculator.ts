export interface ItemCalculation {
  subtotal: number
  tax: number
  service: number
  total: number
}

export function calculateItemTotal(
  price: number,
  quantity: number,
  taxRate: number,
  serviceRate: number
): ItemCalculation {
  const subtotal = price * quantity
  const tax = Math.round(subtotal * (taxRate / 100))
  const service = Math.round(subtotal * (serviceRate / 100))
  const total = subtotal + tax + service
  
  return { subtotal, tax, service, total }
}

export interface ParticipantTotal {
  participantId: string
  name: string
  subtotal: number
  taxShare: number
  serviceShare: number
  total: number
}

export function calculateParticipantTotals(
  participants: { id: string; name: string }[],
  splits: { participantId: string; amount: number; item: { price: number; quantity: number; taxRate: number; serviceRate: number } }[]
): ParticipantTotal[] {
  const participantMap = new Map<string, ParticipantTotal>()
  
  // Initialize all participants with zero
  participants.forEach(p => {
    participantMap.set(p.id, {
      participantId: p.id,
      name: p.name,
      subtotal: 0,
      taxShare: 0,
      serviceShare: 0,
      total: 0,
    })
  })
  
  // Calculate totals per participant
  splits.forEach(split => {
    const participant = participantMap.get(split.participantId)
    if (!participant) return
    
    const itemCalc = calculateItemTotal(
      split.item.price,
      split.item.quantity,
      split.item.taxRate,
      split.item.serviceRate
    )
    
    // Calculate what percentage this split represents of the item
    const itemSubtotal = split.item.price * split.item.quantity
    const splitRatio = split.amount / itemSubtotal
    
    participant.subtotal += split.amount
    participant.taxShare += Math.round(itemCalc.tax * splitRatio)
    participant.serviceShare += Math.round(itemCalc.service * splitRatio)
  })
  
  // Calculate final totals
  participantMap.forEach(p => {
    p.total = p.subtotal + p.taxShare + p.serviceShare
  })
  
  return Array.from(participantMap.values())
}

export interface Debt {
  from: string
  to: string
  amount: number
}

export function calculateSimplifiedDebts(
  participantTotals: { id: string; name: string; total: number; paid: number }[]
): Debt[] {
  const debts: Debt[] = []
  
  // Calculate net balance for each participant
  const balances = participantTotals.map(p => ({
    ...p,
    balance: p.paid - p.total, // positive = should receive, negative = owes
  }))
  
  // Separate debtors (owe money) and creditors (should receive)
  const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance)
  const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance)
  
  // Match debtors to creditors
  let i = 0
  let j = 0
  
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    
    const amount = Math.min(Math.abs(debtor.balance), creditor.balance)
    
    if (amount > 0) {
      debts.push({
        from: debtor.name,
        to: creditor.name,
        amount,
      })
    }
    
    debtor.balance += amount
    creditor.balance -= amount
    
    if (debtor.balance === 0) i++
    if (creditor.balance === 0) j++
  }
  
  return debts
}

export interface SplitValidation {
  valid: boolean
  assigned: number
  expected: number
  remaining: number
}

export function validateSplitTotal(
  splits: { amount: number }[],
  itemPrice: number,
  quantity: number
): SplitValidation {
  const expected = itemPrice * quantity
  const assigned = splits.reduce((sum, split) => sum + split.amount, 0)
  const remaining = expected - assigned
  
  return {
    valid: assigned === expected,
    assigned,
    expected,
    remaining,
  }
}
