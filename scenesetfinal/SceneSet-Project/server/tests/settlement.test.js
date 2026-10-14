const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateSettlement, suggestTransfers } = require('../src/utils/settlement');
const { createInviteCode } = require('../src/utils/inviteCode');

test('expense split returns zero-sum net balances for equal shares', () => {
  const participants = [
    { userId: 'a', name: 'Asha' },
    { userId: 'b', name: 'Ben' },
    { userId: 'c', name: 'Chris' }
  ];
  const balances = calculateSettlement([{ amount: 900, paidBy: 'a' }, { amount: 300, paidBy: 'b' }], participants);
  assert.deepEqual(balances.map((entry) => entry.net), [500, -100, -400]);
  assert.equal(balances.reduce((sum, entry) => sum + entry.net, 0), 0);
});

test('transfer suggestions settle debtors against creditors', () => {
  const transfers = suggestTransfers([
    { userId: 'a', name: 'Asha', net: 500 },
    { userId: 'b', name: 'Ben', net: -100 },
    { userId: 'c', name: 'Chris', net: -400 }
  ]);
  assert.deepEqual(transfers, [
    { from: 'Ben', to: 'Asha', amount: 100 },
    { from: 'Chris', to: 'Asha', amount: 400 }
  ]);
});

test('invite codes are URL-safe and unpredictable-looking', () => {
  const first = createInviteCode();
  const second = createInviteCode();
  assert.equal(first.length, 12);
  assert.match(first, /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/);
  assert.notEqual(first, second);
});
