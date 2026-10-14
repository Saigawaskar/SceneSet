import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, CheckCircle2, ChevronDown, CircleDollarSign, Clock3, Copy, Mail, MapPin, MessageCircle, MoreHorizontal, Plus, Send, Share2, Sparkles, Trash2, Users2, Wallet, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { dateLabel, dateTimeLabel, eventEmoji, initials, money } from '../lib/format.js';
import AvatarStack from '../components/AvatarStack.jsx';

const tabs = [
  { id: 'overview', label: 'Overview', icon: Sparkles },
  { id: 'votes', label: 'Date & place', icon: CheckCircle2 },
  { id: 'expenses', label: 'Expenses', icon: Wallet },
  { id: 'itinerary', label: 'Itinerary', icon: CalendarDays }
];

export default function PlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast, reloadNotifications } = useOutletContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');
  const [busy, setBusy] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', category: 'food' });
  const [itineraryForm, setItineraryForm] = useState({ title: '', location: '', startsAt: '', note: '' });
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showItineraryForm, setShowItineraryForm] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const loadPlan = useCallback(async () => {
    setError('');
    try {
      const result = await api(`/plans/${id}`);
      setData(result);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { setLoading(true); loadPlan(); }, [loadPlan]);

  const plan = data?.plan;
  const isOwner = plan && String(plan.owner?._id || plan.owner) === String(user?._id);
  const memberIds = useMemo(() => (plan?.members || []).map((member) => String(member.user?._id || member.user)), [plan]);
  const totalSpent = useMemo(() => (data?.expenses || []).reduce((sum, expense) => sum + Number(expense.amount || 0), 0), [data]);
  const budget = Number(plan?.budget || 0);
  const budgetPercent = budget > 0 ? Math.min(100, totalSpent / (budget * Math.max(1, plan?.members?.length || 1)) * 100) : 0;

  async function createInvite() {
    try {
      const result = await api(`/plans/${id}/invite`, { method: 'POST' });
      setInviteUrl(result.inviteUrl);
      await navigator.clipboard.writeText(result.inviteUrl);
      showToast({ message: 'Invite link copied. Send it to your people!' });
    } catch (err) {
      if (err.name === 'NotAllowedError') showToast({ type: 'error', message: 'Clipboard access blocked. Copy the invite link shown on screen.' });
      else showToast({ type: 'error', message: err.message });
    }
  }

  async function shareTrip() {
    try {
      await navigator.share({ title: plan.title, text: `Join me for ${plan.title} on SceneSet`, url: inviteUrl });
    } catch (err) {
      if (err.name !== 'AbortError') showToast({ type: 'error', message: 'Could not open the share menu. Use one of the share links instead.' });
    }
  }

  async function vote(category, optionId) {
    setBusy(true);
    try {
      const result = await api(`/plans/${id}/votes`, { method: 'POST', body: { category, optionId } });
      showToast({ message: result.message });
      await loadPlan();
      await reloadNotifications?.();
    } catch (err) { showToast({ type: 'error', message: err.message }); }
    finally { setBusy(false); }
  }

  async function addExpense(event) {
    event.preventDefault(); setBusy(true);
    try {
      await api(`/plans/${id}/expenses`, { method: 'POST', body: { ...expenseForm, amount: Number(expenseForm.amount) } });
      setExpenseForm({ description: '', amount: '', category: 'food' });
      setShowExpenseForm(false); showToast({ message: 'Expense added. The split has been updated.' }); await loadPlan();
    } catch (err) { showToast({ type: 'error', message: err.message }); }
    finally { setBusy(false); }
  }

  async function deleteExpense(expenseId) {
    if (!window.confirm('Remove this expense from the group total?')) return;
    try { await api(`/plans/${id}/expenses/${expenseId}`, { method: 'DELETE' }); showToast({ message: 'Expense removed.' }); await loadPlan(); }
    catch (err) { showToast({ type: 'error', message: err.message }); }
  }

  async function addItinerary(event) {
    event.preventDefault(); setBusy(true);
    try {
      await api(`/plans/${id}/itinerary`, { method: 'POST', body: { ...itineraryForm, startsAt: new Date(itineraryForm.startsAt).toISOString() } });
      setItineraryForm({ title: '', location: '', startsAt: '', note: '' }); setShowItineraryForm(false); showToast({ message: 'Added to the itinerary.' }); await loadPlan(); await reloadNotifications?.();
    } catch (err) { showToast({ type: 'error', message: err.message }); }
    finally { setBusy(false); }
  }

  async function deleteItinerary(itemId) {
    if (!window.confirm('Remove this stop from the itinerary?')) return;
    try { await api(`/plans/${id}/itinerary/${itemId}`, { method: 'DELETE' }); showToast({ message: 'Itinerary stop removed.' }); await loadPlan(); }
    catch (err) { showToast({ type: 'error', message: err.message }); }
  }

  async function updateStatus(status) {
    try { await api(`/plans/${id}`, { method: 'PATCH', body: { status } }); showToast({ message: `Scene marked ${status}.` }); setShowMore(false); await loadPlan(); }
    catch (err) { showToast({ type: 'error', message: err.message }); }
  }

  async function deletePlan() {
    if (!window.confirm('Delete this scene and all its expenses? This cannot be undone.')) return;
    try { await api(`/plans/${id}`, { method: 'DELETE' }); showToast({ message: 'Scene deleted.' }); navigate('/app'); }
    catch (err) { showToast({ type: 'error', message: err.message }); }
  }

  const myName = user?.name || 'You';
  if (loading) return <div className="detail-loading"><div className="detail-skeleton-cover"/><div className="detail-skeleton-line"/><div className="detail-skeleton-line short"/><div className="detail-skeleton-card"/></div>;
  if (error || !plan) return <div className="error-page"><div className="error-emoji">🫣</div><h2>We couldn’t find this scene.</h2><p>{error || 'It may have been deleted or you may not have access to it.'}</p><Link to="/app" className="button button-primary"><ArrowLeft size={16}/> Back to overview</Link></div>;

  const renderOptions = (category, options) => <div className="vote-options-list">{options.length === 0 ? <div className="mini-empty">No {category} options yet. The plan owner can add options by creating a new scene.</div> : options.map((option, index) => {
    const voters = option.voters || [];
    const myVote = voters.some((voter) => String(voter) === String(user?._id));
    const percent = plan.members?.length ? Math.round(voters.length / plan.members.length * 100) : 0;
    return <button key={option._id} className={`vote-option-card ${myVote ? 'my-vote' : ''}`} onClick={() => vote(category, option._id)} disabled={busy}>
      <span className={`vote-option-bullet vote-bullet-${index % 4}`}>{myVote ? <Check size={15}/> : category === 'date' ? <CalendarDays size={16}/> : <MapPin size={16}/>}</span>
      <span className="vote-option-copy"><strong>{option.value}</strong><span>{voters.length} {voters.length === 1 ? 'vote' : 'votes'} · {percent}% of group</span><i><b style={{ width: `${percent}%` }}/></i></span>
      <span className={`vote-option-action ${myVote ? 'voted' : ''}`}>{myVote ? 'Your vote' : 'Vote'} <ArrowUpRight size={15}/></span>
    </button>;
  })}</div>;

  return (
    <div className="plan-detail-page">
      <Link to="/app" className="back-link"><ArrowLeft size={16}/> All scenes</Link>
      <section className={`detail-hero detail-hero-${plan.eventType}`}>
        <div className="detail-hero-text"><div className="detail-breadcrumb"><span>YOUR SCENES</span><i>/</i><span>{plan.status === 'confirmed' ? 'LOCKED IN' : plan.status === 'completed' ? 'PAST SCENE' : 'IN THE WORKS'}</span></div><div className="detail-title-row"><span className="event-icon detail-event-icon">{eventEmoji(plan.eventType)}</span><div><h1>{plan.title}</h1><p>{plan.description || 'A little something to look forward to.'}</p></div></div><div className="detail-meta-row"><span className={`status-pill status-${plan.status}`}>{plan.status === 'planning' ? 'Planning' : plan.status === 'confirmed' ? 'Confirmed' : 'Completed'}</span><span><Users2 size={15}/>{plan.members.length} people</span><span><CalendarDays size={15}/>{dateLabel(plan.dateOptions?.find((option) => option.voters?.length)?.value || plan.dateOptions?.[0]?.value)}</span></div></div>
        <div className="detail-hero-actions"><button className="button button-white invite-button" onClick={createInvite}><Users2 size={16}/> Invite friends <ArrowUpRight size={15}/></button><div className="more-menu-wrap"><button className="button button-outline-light" onClick={() => setShowMore((open) => !open)} aria-label="More plan actions"><MoreHorizontal size={18}/></button>{showMore && <div className="more-menu">{isOwner && <>{plan.status !== 'confirmed' && <button onClick={() => updateStatus('confirmed')}><CheckCircle2 size={15}/> Mark confirmed</button>}{plan.status !== 'completed' && <button onClick={() => updateStatus('completed')}><Check size={15}/> Mark completed</button>}{plan.status !== 'planning' && <button onClick={() => updateStatus('planning')}><Clock3 size={15}/> Move to planning</button>}<div className="menu-divider"/><button className="danger-action" onClick={deletePlan}><Trash2 size={15}/> Delete scene</button></>}{!isOwner && <span className="menu-note">Only the plan owner can change scene status.</span>}</div>}</div></div>
        {inviteUrl && <div className="invite-link-box"><span className="invite-url">{inviteUrl}</span><div className="invite-share-actions"><button type="button" onClick={() => navigator.clipboard.writeText(inviteUrl)}><Copy size={14}/> Copy</button><a className="share-whatsapp" href={`https://wa.me/?text=${encodeURIComponent(`Join me for ${plan.title} on SceneSet: ${inviteUrl}`)}`} target="_blank" rel="noreferrer"><MessageCircle size={14}/> WhatsApp</a><a href={`sms:?body=${encodeURIComponent(`Join me for ${plan.title} on SceneSet: ${inviteUrl}`)}`}><Send size={14}/> SMS</a><a href={`mailto:?subject=${encodeURIComponent(`Join my SceneSet plan: ${plan.title}`)}&body=${encodeURIComponent(`Join me for ${plan.title} on SceneSet: ${inviteUrl}`)}`}><Mail size={14}/> Email</a>{typeof navigator.share === 'function' && <button type="button" onClick={shareTrip}><Share2 size={14}/> More</button>}</div><button className="icon-button invite-close" onClick={() => setInviteUrl('')} aria-label="Hide share options"><X size={15}/></button></div>}
        <div className="detail-hero-pattern"><span>✳</span><i>✦</i><b>✧</b><div/></div>
      </section>

      <section className="detail-member-strip"><div className="detail-members"><AvatarStack members={plan.members} limit={6} size="md"/><div><strong>Your people</strong><span>{plan.members.length} {plan.members.length === 1 ? 'person is' : 'people are'} in this scene</span></div></div><div className="member-avatars-full">{plan.members.slice(0, 5).map((member, index) => <div key={member.user?._id || index} className="member-chip"><span className="avatar" style={{ background: member.user?.avatarColor || '#7567f8' }}>{initials(member.user?.name)}</span><span>{String(member.user?._id) === String(user?._id) ? 'You' : member.user?.name?.split(' ')[0]}</span></div>)}{plan.members.length > 5 && <span className="more-members">+{plan.members.length - 5}</span>}</div></section>

      <div className="detail-tabs" role="tablist">{tabs.map(({ id: tabId, label, icon: Icon }) => <button role="tab" aria-selected={tab === tabId} key={tabId} className={tab === tabId ? 'active' : ''} onClick={() => setTab(tabId)}><Icon size={16}/>{label}{tabId === 'expenses' && data.expenses.length > 0 && <span className="tab-count">{data.expenses.length}</span>}</button>)}</div>

      {tab === 'overview' && <div className="detail-overview-grid">
        <div className="detail-main-column">
          <section className="detail-content-card"><div className="card-heading-row"><div><span className="section-overline">THE GROUP DECISION</span><h2>Where & when?</h2><p>Tap an option to cast your vote. Change your mind anytime.</p></div><button className="plain-tab-action" onClick={() => setTab('votes')}>See all <ArrowUpRight size={15}/></button></div><div className="overview-vote-columns"><div><div className="mini-section-heading"><span className="mini-icon mini-date"><CalendarDays size={15}/></span><strong>Choose a date</strong><span>{plan.dateOptions.length}</span></div>{renderOptions('date', plan.dateOptions.slice(0, 2))}</div><div><div className="mini-section-heading"><span className="mini-icon mini-place"><MapPin size={15}/></span><strong>Pick a place</strong><span>{plan.placeOptions.length}</span></div>{renderOptions('place', plan.placeOptions.slice(0, 2))}</div></div></section>
          <section className="detail-content-card itinerary-preview-card"><div className="card-heading-row"><div><span className="section-overline">THE PLAN, PIECE BY PIECE</span><h2>Itinerary <span className="heading-count">{plan.itinerary.length}</span></h2><p>Little stops make a great day.</p></div><button className="plain-tab-action" onClick={() => { setTab('itinerary'); setShowItineraryForm(true); }}>Add a stop <Plus size={15}/></button></div>{plan.itinerary.length ? <div className="itinerary-preview-list">{[...plan.itinerary].sort((a,b) => new Date(a.startsAt)-new Date(b.startsAt)).slice(0,3).map((item, index) => <div className="itinerary-preview-item" key={item._id}><span className={`timeline-number tl-${index % 4}`}>{String(index+1).padStart(2,'0')}</span><div><strong>{item.title}</strong><span>{dateTimeLabel(item.startsAt)}{item.location ? ` · ${item.location}` : ''}</span></div><ArrowUpRight size={16}/></div>)}</div> : <div className="empty-inline"><span>🗺️</span><div><strong>Your day, your way.</strong><p>Start adding stops, places and little details to your itinerary.</p></div><button className="button button-secondary button-small" onClick={() => { setTab('itinerary'); setShowItineraryForm(true); }}>Build itinerary</button></div>}</section>
        </div>
        <div className="detail-side-column">
          <section className="budget-summary-card"><div className="budget-card-top"><span><Wallet size={17}/></span><span>GROUP BUDGET</span><button onClick={() => setTab('expenses')} aria-label="Open expenses"><ArrowUpRight size={16}/></button></div><div className="budget-total">{money(budget * Math.max(1, plan.members.length), plan.currency)}</div><p className="budget-subtext">Suggested total · {money(budget, plan.currency)} per person</p><div className="budget-progress-label"><span>Tracked expenses</span><strong>{budget > 0 ? `${Math.round(budgetPercent)}%` : 'No limit set'}</strong></div><div className="budget-progress"><i style={{ width: `${budgetPercent}%` }}/></div><div className="budget-mini-stats"><div><small>Spent so far</small><strong>{money(totalSpent, plan.currency)}</strong></div><div><small>Left to budget</small><strong>{budget > 0 ? money(Math.max(0, budget * Math.max(1, plan.members.length) - totalSpent), plan.currency) : '—'}</strong></div></div><button className="button button-dark-soft" onClick={() => { setTab('expenses'); setShowExpenseForm(true); }}><Plus size={15}/> Add an expense</button></section>
          <section className="quick-invite-card"><div className="quick-invite-art"><span>✳</span><i>✦</i><b>✧</b></div><h3>More friends,<br/>more memories.</h3><p>Good times get better when everyone’s in.</p><button className="button button-primary button-full" onClick={createInvite}><Send size={15}/> Invite your people</button></section>
          <section className="scene-host-card"><span className="host-avatar" style={{ background: plan.owner?.avatarColor || '#7567f8' }}>{initials(plan.owner?.name)}</span><div><small>SCENE STARTED BY</small><strong>{isOwner ? 'You' : plan.owner?.name}</strong><span>Making good things happen.</span></div><span className="host-spark">✳</span></section>
        </div>
      </div>}

      {tab === 'votes' && <div className="detail-content-card full-tab-card"><div className="card-heading-row"><div><span className="section-overline">MAKE IT A GROUP DECISION</span><h2>Where & when?</h2><p>Everyone gets one vote per category. Vote again to change it.</p></div></div><div className="votes-tab-grid"><div><div className="tab-group-heading"><span className="mini-icon mini-date"><CalendarDays size={16}/></span><div><h3>Possible dates</h3><p>{plan.dateOptions.reduce((sum, option) => sum + option.voters.length, 0)} votes cast</p></div></div>{renderOptions('date', plan.dateOptions)}</div><div><div className="tab-group-heading"><span className="mini-icon mini-place"><MapPin size={16}/></span><div><h3>Place ideas</h3><p>{plan.placeOptions.reduce((sum, option) => sum + option.voters.length, 0)} votes cast</p></div></div>{renderOptions('place', plan.placeOptions)}</div></div><div className="vote-privacy-note"><Sparkles size={17}/><span>Your vote is visible to your group. Votes can change until the plan is locked in.</span></div></div>}

      {tab === 'expenses' && <div className="expenses-layout"><div className="detail-content-card expense-main-card"><div className="card-heading-row"><div><span className="section-overline">KEEP IT FAIR</span><h2>Expense tracker</h2><p>Every contribution, accounted for. No awkward maths.</p></div><button className="button button-primary button-small" onClick={() => setShowExpenseForm((open) => !open)}><Plus size={15}/> Add expense</button></div>
        {showExpenseForm && <form className="inline-create-form" onSubmit={addExpense}><div className="form-section-title"><strong>New group expense</strong><button type="button" className="icon-button" onClick={() => setShowExpenseForm(false)} aria-label="Close"><X size={16}/></button></div><label className="field-label">What was it for?<input className="text-input" value={expenseForm.description} onChange={(e) => setExpenseForm((prev) => ({...prev, description: e.target.value}))} placeholder="e.g. Dinner at Noodle House" maxLength={120} required/></label><div className="two-field-row"><label className="field-label">Amount ({plan.currency})<input className="text-input" type="number" min="0.01" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm((prev) => ({...prev, amount: e.target.value}))} placeholder="850" required/></label><label className="field-label">Category<select className="text-input select-input" value={expenseForm.category} onChange={(e) => setExpenseForm((prev) => ({...prev, category: e.target.value}))}><option value="food">Food & drink</option><option value="travel">Travel</option><option value="tickets">Tickets</option><option value="stay">Stay</option><option value="shopping">Shopping</option><option value="other">Other</option></select></label></div><div className="form-inline-footer"><span><CheckCircle2 size={14}/> Split equally across {plan.members.length} people</span><button type="submit" className="button button-primary button-small" disabled={busy}>Save expense <ArrowUpRight size={14}/></button></div></form>}
        {data.expenses.length ? <div className="expense-list">{data.expenses.map((expense) => <div className="expense-row" key={expense._id}><span className={`expense-category-icon cat-${expense.category}`}>{({food:'🍜',travel:'🚕',tickets:'🎟️',stay:'🛏️',shopping:'🛍️',other:'✦'})[expense.category]}</span><div className="expense-row-copy"><strong>{expense.description}</strong><span>Paid by {String(expense.paidBy?._id) === String(user?._id) ? 'you' : expense.paidBy?.name} · {dateLabel(expense.createdAt)}</span></div><strong className="expense-amount">{money(expense.amount, plan.currency)}</strong>{(String(expense.createdBy?._id) === String(user?._id) || isOwner) && <button className="icon-button row-delete" onClick={() => deleteExpense(expense._id)} aria-label={`Delete ${expense.description}`}><Trash2 size={15}/></button>}</div>)}</div> : <div className="empty-state empty-state-small"><div className="empty-art"><span>₹</span><i>✦</i></div><h3>No expenses yet</h3><p>Add the first cost and SceneSet will calculate everyone's share.</p><button className="button button-primary" onClick={() => setShowExpenseForm(true)}><Plus size={16}/> Add the first expense</button></div>}
        </div><div className="settlement-side"><section className="budget-summary-card"><div className="budget-card-top"><span><CircleDollarSign size={17}/></span><span>THE BIG PICTURE</span></div><div className="budget-total">{money(totalSpent, plan.currency)}</div><p className="budget-subtext">Total recorded across {data.expenses.length} {data.expenses.length === 1 ? 'expense' : 'expenses'}</p><div className="settlement-divider"/><div className="settlement-each"><span>Equal share per person</span><strong>{money(totalSpent / Math.max(1, plan.members.length), plan.currency)}</strong></div><div className="settlement-people">{(data.settlement || []).map((entry) => <div className="settlement-person" key={entry.userId}><span className="avatar" style={{ background: plan.members.find((m) => String(m.user?._id || m.user) === entry.userId)?.user?.avatarColor || '#7567f8' }}>{initials(entry.name)}</span><span className="settlement-name">{entry.userId === String(user?._id) ? 'You' : entry.name}</span><strong className={entry.net > 0.009 ? 'positive-balance' : entry.net < -0.009 ? 'negative-balance' : ''}>{Math.abs(entry.net) < 0.01 ? 'Settled' : `${entry.net > 0 ? '+' : '−'}${money(Math.abs(entry.net), plan.currency)}`}</strong></div>)}</div>{data.suggestedTransfers?.length > 0 && <div className="transfer-suggestions"><strong>Suggested settle-up</strong>{data.suggestedTransfers.map((transfer, index) => <p key={`${transfer.from}-${transfer.to}-${index}`}><span>{transfer.from}</span> pays <span>{transfer.to}</span> <b>{money(transfer.amount, plan.currency)}</b></p>)}</div>}<p className="settlement-disclaimer">Balances are estimates based on an equal split. SceneSet never moves money.</p></section></div></div>}

      {tab === 'itinerary' && <div className="detail-content-card itinerary-full-card"><div className="card-heading-row"><div><span className="section-overline">THE GOOD STUFF</span><h2>Your day, mapped out.</h2><p>A shared timeline, so everyone knows the plan.</p></div><button className="button button-primary button-small" onClick={() => setShowItineraryForm((open) => !open)}><Plus size={15}/> Add a stop</button></div>
        {showItineraryForm && <form className="inline-create-form" onSubmit={addItinerary}><div className="form-section-title"><strong>Add to the itinerary</strong><button type="button" className="icon-button" onClick={() => setShowItineraryForm(false)} aria-label="Close"><X size={16}/></button></div><div className="two-field-row"><label className="field-label">Stop / activity<input className="text-input" value={itineraryForm.title} onChange={(e) => setItineraryForm((prev) => ({...prev, title: e.target.value}))} placeholder="e.g. Meet for brunch" maxLength={100} required/></label><label className="field-label">Date and time<input className="text-input" type="datetime-local" value={itineraryForm.startsAt} onChange={(e) => setItineraryForm((prev) => ({...prev, startsAt: e.target.value}))} required/></label></div><label className="field-label">Location <span className="optional-label">OPTIONAL</span><input className="text-input" value={itineraryForm.location} onChange={(e) => setItineraryForm((prev) => ({...prev, location: e.target.value}))} placeholder="Address, venue or meeting point" maxLength={180}/></label><label className="field-label">Notes <span className="optional-label">OPTIONAL</span><textarea className="text-input text-area" rows={2} value={itineraryForm.note} onChange={(e) => setItineraryForm((prev) => ({...prev, note: e.target.value}))} placeholder="Anything the group should know?" maxLength={500}/></label><div className="form-inline-footer"><span><Users2 size={14}/> Shared with all plan members</span><button type="submit" className="button button-primary button-small" disabled={busy}>Add to itinerary <ArrowUpRight size={14}/></button></div></form>}
        {plan.itinerary.length ? <div className="itinerary-timeline">{[...plan.itinerary].sort((a,b) => new Date(a.startsAt)-new Date(b.startsAt)).map((item, index) => <div className="timeline-item" key={item._id}><div className="timeline-rail"><span className={`timeline-number tl-${index % 4}`}>{String(index + 1).padStart(2, '0')}</span><i/></div><div className="timeline-content"><div className="timeline-time"><Clock3 size={14}/>{dateTimeLabel(item.startsAt)}</div><h3>{item.title}</h3>{item.location && <p className="timeline-location"><MapPin size={14}/>{item.location}</p>}{item.note && <p className="timeline-note">{item.note}</p>}<small>Added by {String(item.createdBy?._id) === String(user?._id) ? 'you' : item.createdBy?.name || 'a group member'}</small></div>{(String(item.createdBy?._id || item.createdBy) === String(user?._id) || isOwner) && <button className="icon-button row-delete" onClick={() => deleteItinerary(item._id)} aria-label={`Remove ${item.title}`}><Trash2 size={15}/></button>}</div>)}</div> : <div className="empty-state empty-state-small"><div className="empty-art"><span>🗓️</span><i>✦</i></div><h3>The best bits are yet to come</h3><p>Add the first stop and build a shared plan your group can follow.</p><button className="button button-primary" onClick={() => setShowItineraryForm(true)}><Plus size={16}/> Add the first stop</button></div>}
      </div>}
      <footer className="page-footer"><span className="maker-credit"><span className="maker-credit-spark">✦</span> Made by Sai Sunil Gawaskar</span><span>SCENESET <i>✳</i> GOOD PLANS · 2026</span></footer>
    </div>
  );
}
