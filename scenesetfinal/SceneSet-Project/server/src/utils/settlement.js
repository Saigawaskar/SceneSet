/**
 * Split each expense equally between the supplied participants.
 * expenses: [{ amount, paidBy: userId }]
 * participants: [{ userId, name }]
 * Returns net balances; positive means the participant should receive money.
 */
function calculateSettlement(expenses, participants) {
  if (!Array.isArray(participants) || participants.length === 0) return [];
  const balances = new Map(participants.map((p) => [String(p.userId), 0]));
  const shareCount = participants.length;

  for (const expense of expenses) {
    const amount = Number(expense.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const payerId = String(expense.paidBy);
    if (!balances.has(payerId)) continue;
    balances.set(payerId, balances.get(payerId) + amount);
    const share = amount / shareCount;
    for (const participant of participants) {
      const id = String(participant.userId);
      balances.set(id, balances.get(id) - share);
    }
  }

  return participants.map((p) => ({
    userId: String(p.userId),
    name: p.name,
    net: Math.round((balances.get(String(p.userId)) + Number.EPSILON) * 100) / 100
  }));
}

/** Greedy settlement suggestions from net balances. */
function suggestTransfers(balances) {
  const debtors = balances.filter((b) => b.net < -0.009).map((b) => ({ ...b, remaining: -b.net }));
  const creditors = balances.filter((b) => b.net > 0.009).map((b) => ({ ...b, remaining: b.net }));
  const transfers = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].remaining, creditors[j].remaining);
    if (amount > 0.009) transfers.push({ from: debtors[i].name, to: creditors[j].name, amount: Math.round(amount * 100) / 100 });
    debtors[i].remaining -= amount;
    creditors[j].remaining -= amount;
    if (debtors[i].remaining < 0.01) i += 1;
    if (creditors[j].remaining < 0.01) j += 1;
  }
  return transfers;
}

module.exports = { calculateSettlement, suggestTransfers };
