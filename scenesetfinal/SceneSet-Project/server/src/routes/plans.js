const express = require('express');
const { z } = require('zod');
const Plan = require('../models/Plan');
const Expense = require('../models/Expense');
const Notification = require('../models/Notification');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const { calculateSettlement, suggestTransfers } = require('../utils/settlement');

const router = express.Router();
router.use(requireAuth);

const optionList = z.array(z.string().trim().min(1).max(160)).max(8).default([]);
const createPlanSchema = z.object({
  title: z.string().trim().min(3, 'Plan name must be at least 3 characters.').max(100),
  description: z.string().trim().max(700).optional().default(''),
  eventType: z.enum(['hangout', 'birthday', 'food', 'movie', 'trip', 'game', 'study', 'other']).default('hangout'),
  budget: z.coerce.number().min(0).max(100000000).default(0),
  currency: z.enum(['INR', 'USD', 'GBP', 'EUR']).default('INR'),
  dateOptions: optionList,
  placeOptions: optionList
});
const updatePlanSchema = z.object({
  title: z.string().trim().min(3).max(100).optional(),
  description: z.string().trim().max(700).optional(),
  budget: z.coerce.number().min(0).max(100000000).optional(),
  status: z.enum(['planning', 'confirmed', 'completed']).optional()
}).refine((data) => Object.keys(data).length > 0, 'Provide at least one field to update.');

function isMember(plan, userId) {
  return plan.members.some((member) => String(member.user?._id || member.user) === String(userId));
}
function isOwner(plan, userId) { return String(plan.owner?._id || plan.owner) === String(userId); }
async function getMemberPlan(planId, userId) {
  const plan = await Plan.findById(planId);
  if (!plan) throw new AppError('Plan not found.', 404, 'PLAN_NOT_FOUND');
  if (!isMember(plan, userId)) throw new AppError('You do not have access to this plan.', 403, 'PLAN_FORBIDDEN');
  return plan;
}
function uniqueOptions(items = []) {
  return [...new Set(items.map((value) => value.trim()).filter(Boolean))];
}

// Keep the join route ahead of /:id so "join" cannot be mistaken for a plan ID.
router.post('/join/:code', asyncHandler(async (req, res) => {
  const plan = await Plan.findOne({ inviteCode: req.params.code, inviteExpiresAt: { $gt: new Date() } });
  if (!plan) throw new AppError('This invite link is invalid or has expired.', 404, 'INVITE_EXPIRED');
  if (!isMember(plan, req.user._id)) {
    plan.members.push({ user: req.user._id, role: 'member' });
    await plan.save();
    await Notification.create({
      user: plan.owner, type: 'invite_joined', title: 'Someone joined your plan',
      message: `${req.user.name} joined “${plan.title}”.`, plan: plan._id
    });
  }
  res.json({ planId: plan._id, title: plan.title, message: 'You joined the plan.' });
}));

router.get('/', asyncHandler(async (req, res) => {
  const plans = await Plan.find({ 'members.user': req.user._id })
    .sort({ updatedAt: -1 })
    .populate('owner', 'name email avatarColor')
    .populate('members.user', 'name email avatarColor');
  res.json({ plans });
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = createPlanSchema.parse(req.body);
  const plan = await Plan.create({
    ...data,
    dateOptions: uniqueOptions(data.dateOptions).map((value) => ({ value })),
    placeOptions: uniqueOptions(data.placeOptions).map((value) => ({ value })),
    owner: req.user._id,
    members: [{ user: req.user._id, role: 'owner' }]
  });
  await plan.populate('owner', 'name email avatarColor');
  await plan.populate('members.user', 'name email avatarColor');
  res.status(201).json({ plan });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id)
    .populate('owner', 'name email avatarColor')
    .populate('members.user', 'name email avatarColor')
    .populate('itinerary.createdBy', 'name');
  if (!plan) throw new AppError('Plan not found.', 404, 'PLAN_NOT_FOUND');
  if (!isMember(plan, req.user._id)) throw new AppError('You do not have access to this plan.', 403, 'PLAN_FORBIDDEN');
  const expenses = await Expense.find({ plan: plan._id }).sort({ createdAt: -1 }).populate('paidBy', 'name avatarColor').populate('createdBy', 'name');
  const participants = plan.members.map((member) => ({ userId: member.user._id, name: member.user.name }));
  const settlement = calculateSettlement(expenses.map((expense) => ({ amount: expense.amount, paidBy: expense.paidBy._id })), participants);
  res.json({ plan, expenses, settlement, suggestedTransfers: suggestTransfers(settlement) });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const plan = await getMemberPlan(req.params.id, req.user._id);
  if (!isOwner(plan, req.user._id)) throw new AppError('Only the plan owner can edit plan details.', 403, 'OWNER_ONLY');
  const updates = updatePlanSchema.parse(req.body);
  Object.assign(plan, updates);
  await plan.save();
  const otherMembers = plan.members.filter((m) => String(m.user) !== String(req.user._id));
  if (otherMembers.length) {
    await Notification.insertMany(otherMembers.map((member) => ({
      user: member.user, type: 'plan_updated', title: 'Plan details updated',
      message: `“${plan.title}” has been updated.`, plan: plan._id
    })));
  }
  await plan.populate('owner', 'name email avatarColor');
  await plan.populate('members.user', 'name email avatarColor');
  res.json({ plan });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const plan = await getMemberPlan(req.params.id, req.user._id);
  if (!isOwner(plan, req.user._id)) throw new AppError('Only the plan owner can delete this plan.', 403, 'OWNER_ONLY');
  await Promise.all([
    Expense.deleteMany({ plan: plan._id }),
    Notification.deleteMany({ plan: plan._id }),
    Plan.deleteOne({ _id: plan._id })
  ]);
  res.json({ message: 'Plan and its expenses were deleted.' });
}));

router.post('/:id/invite', asyncHandler(async (req, res) => {
  const plan = await getMemberPlan(req.params.id, req.user._id);
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  res.json({ code: plan.inviteCode, expiresAt: plan.inviteExpiresAt, inviteUrl: `${clientUrl}/join/${plan.inviteCode}` });
}));

router.post('/:id/votes', asyncHandler(async (req, res) => {
  const schema = z.object({ category: z.enum(['date', 'place']), optionId: z.string().min(1) });
  const { category, optionId } = schema.parse(req.body);
  const plan = await getMemberPlan(req.params.id, req.user._id);
  const options = category === 'date' ? plan.dateOptions : plan.placeOptions;
  const selected = options.id(optionId);
  if (!selected) throw new AppError('That option is no longer available.', 404, 'OPTION_NOT_FOUND');
  const alreadySelected = selected.voters.some((voter) => String(voter) === String(req.user._id));
  for (const option of options) option.voters = option.voters.filter((voter) => String(voter) !== String(req.user._id));
  if (!alreadySelected) selected.voters.push(req.user._id);
  await plan.save();
  if (String(plan.owner) !== String(req.user._id)) {
    await Notification.create({ user: plan.owner, type: 'vote_cast', title: 'A vote just came in', message: `${req.user.name} voted on ${category} options for “${plan.title}”.`, plan: plan._id });
  }
  res.json({ options, selectedOptionId: alreadySelected ? null : optionId, message: alreadySelected ? 'Vote removed.' : 'Your vote was counted.' });
}));

router.post('/:id/itinerary', asyncHandler(async (req, res) => {
  const schema = z.object({
    title: z.string().trim().min(2).max(100),
    location: z.string().trim().max(180).optional().default(''),
    startsAt: z.coerce.date(),
    note: z.string().trim().max(500).optional().default('')
  });
  const data = schema.parse(req.body);
  const plan = await getMemberPlan(req.params.id, req.user._id);
  plan.itinerary.push({ ...data, createdBy: req.user._id });
  await plan.save();
  const newItem = plan.itinerary[plan.itinerary.length - 1];
  await Promise.all(plan.members.filter((m) => String(m.user) !== String(req.user._id)).map((member) => Notification.create({
    user: member.user, type: 'itinerary_added', title: 'Itinerary updated', message: `${req.user.name} added “${newItem.title}” to “${plan.title}”.`, plan: plan._id
  })));
  res.status(201).json({ item: newItem });
}));

router.patch('/:id/itinerary/:itemId', asyncHandler(async (req, res) => {
  const schema = z.object({
    title: z.string().trim().min(2).max(100).optional(),
    location: z.string().trim().max(180).optional(),
    startsAt: z.coerce.date().optional(),
    note: z.string().trim().max(500).optional()
  }).refine((data) => Object.keys(data).length > 0, 'Provide an itinerary field to update.');
  const data = schema.parse(req.body);
  const plan = await getMemberPlan(req.params.id, req.user._id);
  const item = plan.itinerary.id(req.params.itemId);
  if (!item) throw new AppError('Itinerary item not found.', 404, 'ITINERARY_ITEM_NOT_FOUND');
  Object.assign(item, data);
  await plan.save();
  res.json({ item });
}));

router.delete('/:id/itinerary/:itemId', asyncHandler(async (req, res) => {
  const plan = await getMemberPlan(req.params.id, req.user._id);
  const item = plan.itinerary.id(req.params.itemId);
  if (!item) throw new AppError('Itinerary item not found.', 404, 'ITINERARY_ITEM_NOT_FOUND');
  if (String(item.createdBy) !== String(req.user._id) && !isOwner(plan, req.user._id)) {
    throw new AppError('Only the creator or plan owner can remove this item.', 403, 'ITEM_FORBIDDEN');
  }
  item.deleteOne();
  await plan.save();
  res.json({ message: 'Itinerary item removed.' });
}));

router.post('/:id/expenses', asyncHandler(async (req, res) => {
  const schema = z.object({
    description: z.string().trim().min(2).max(120),
    category: z.enum(['food', 'travel', 'tickets', 'stay', 'shopping', 'other']).default('other'),
    amount: z.coerce.number().positive().max(10000000),
    paidBy: z.string().optional()
  });
  const data = schema.parse(req.body);
  const plan = await getMemberPlan(req.params.id, req.user._id);
  const paidBy = data.paidBy || String(req.user._id);
  if (!isMember(plan, paidBy)) throw new AppError('The payer must be a member of this plan.', 400, 'INVALID_PAYER');
  const expense = await Expense.create({ ...data, plan: plan._id, paidBy, createdBy: req.user._id });
  await expense.populate('paidBy', 'name avatarColor');
  await expense.populate('createdBy', 'name');
  res.status(201).json({ expense });
}));

router.delete('/:id/expenses/:expenseId', asyncHandler(async (req, res) => {
  const plan = await getMemberPlan(req.params.id, req.user._id);
  const expense = await Expense.findOne({ _id: req.params.expenseId, plan: plan._id });
  if (!expense) throw new AppError('Expense not found.', 404, 'EXPENSE_NOT_FOUND');
  if (String(expense.createdBy) !== String(req.user._id) && !isOwner(plan, req.user._id)) {
    throw new AppError('Only the person who added this expense or the plan owner can remove it.', 403, 'EXPENSE_FORBIDDEN');
  }
  await expense.deleteOne();
  res.json({ message: 'Expense removed.' });
}));

module.exports = router;
