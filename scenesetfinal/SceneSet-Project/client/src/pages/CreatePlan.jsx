import { useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Check, CircleDollarSign, MapPin, Sparkles, Users2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { eventEmoji } from '../lib/format.js';

const eventTypes = [
  { value: 'hangout', label: 'Hangout', emoji: '✨', hint: 'Just because' },
  { value: 'food', label: 'Food crawl', emoji: '🍜', hint: 'Good eats' },
  { value: 'movie', label: 'Movie night', emoji: '🎬', hint: 'Screen time' },
  { value: 'birthday', label: 'Birthday', emoji: '🎂', hint: 'Big energy' },
  { value: 'trip', label: 'Little trip', emoji: '🧳', hint: 'Getaway mode' },
  { value: 'game', label: 'Game night', emoji: '🎮', hint: 'Friendly rivals' },
  { value: 'study', label: 'Study sesh', emoji: '📚', hint: 'Lock in' },
  { value: 'other', label: 'Something else', emoji: '🌈', hint: 'Your call' }
];

export default function CreatePlan() {
  const navigate = useNavigate();
  const { showToast } = useOutletContext();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', description: '', eventType: 'hangout', budget: '1500', currency: 'INR', dateOptions: '', placeOptions: '' });
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const dates = form.dateOptions.split('\n').map((v) => v.trim()).filter(Boolean);
  const places = form.placeOptions.split('\n').map((v) => v.trim()).filter(Boolean);

  async function submit() {
    setError(''); setBusy(true);
    try {
      const result = await api('/plans', { method: 'POST', body: { ...form, budget: Number(form.budget || 0), dateOptions: dates, placeOptions: places } });
      showToast({ message: 'Your scene is ready. Invite the gang!' });
      navigate(`/plans/${result.plan._id}`);
    } catch (err) { setError(err.message); setBusy(false); }
  }

  function nextStep() {
    setError('');
    if (step === 1 && form.title.trim().length < 3) { setError('Give your scene a name with at least 3 characters.'); return; }
    if (step === 2 && (!dates.length || !places.length)) { setError('Add at least one date option and one place option. You can always edit them later.'); return; }
    setStep((current) => Math.min(3, current + 1));
  }

  return (
    <div className="create-page">
      <Link to="/app" className="back-link"><ArrowLeft size={16}/> Back to overview</Link>
      <div className="create-layout">
        <section className="create-main">
          <div className="create-title-row"><div><div className="welcome-eyebrow"><span className="eyebrow-spark">✳</span> LET’S MAKE IT HAPPEN</div><h1>Create a scene<span> ✦</span></h1><p>One plan, your people, zero group-chat chaos.</p></div><div className="create-step-count">0{step} <span>/ 03</span></div></div>
          <div className="stepper"><div className={`stepper-step ${step >= 1 ? 'complete' : ''}`}><span>{step > 1 ? <Check size={14}/> : '01'}</span><div><strong>The basics</strong><small>What’s the occasion?</small></div></div><i className={step > 1 ? 'filled' : ''}/><div className={`stepper-step ${step >= 2 ? 'complete' : ''}`}><span>{step > 2 ? <Check size={14}/> : '02'}</span><div><strong>Options</strong><small>Let everyone vote</small></div></div><i className={step > 2 ? 'filled' : ''}/><div className={`stepper-step ${step >= 3 ? 'complete' : ''}`}><span>03</span><div><strong>The details</strong><small>Make it yours</small></div></div></div>

          <div className="form-panel">
            {step === 1 && <div className="form-step-content"><div className="form-step-heading"><span className="step-icon"><Sparkles size={19}/></span><div><h2>What are we celebrating?</h2><p>Big occasion or a random Tuesday — we’re here for it.</p></div></div>
              <label className="field-label">Give your scene a name <span className="required-star">*</span><input className="text-input" value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. The long-overdue gang reunion" maxLength={100} autoFocus/><span className="field-hint">Keep it fun. You can always change it later.</span></label>
              <label className="field-label">Add a little context <span className="optional-label">OPTIONAL</span><textarea className="text-input text-area" rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="What's the vibe? Any ideas already floating around?" maxLength={700}/></label>
              <div className="field-label">Pick your vibe <span className="required-star">*</span><div className="event-type-grid">{eventTypes.map((type) => <button type="button" key={type.value} className={`event-choice ${form.eventType === type.value ? 'selected' : ''}`} onClick={() => update('eventType', type.value)}><span>{type.emoji}</span><strong>{type.label}</strong><small>{type.hint}</small>{form.eventType === type.value && <i><Check size={11}/></i>}</button>)}</div></div>
            </div>}
            {step === 2 && <div className="form-step-content"><div className="form-step-heading"><span className="step-icon"><Users2 size={19}/></span><div><h2>Give everyone a say.</h2><p>Add a few options, then let the group pick their favourite.</p></div></div>
              <label className="field-label">Possible dates <span className="required-star">*</span><textarea className="text-input text-area options-area" rows={4} value={form.dateOptions} onChange={(e) => update('dateOptions', e.target.value)} placeholder={'Saturday, 24 Oct\nSunday, 25 Oct\nNext Friday evening'}/><span className="field-hint">One option per line. Use dates or plain-language suggestions.</span></label>
              <label className="field-label">Places or activities <span className="required-star">*</span><textarea className="text-input text-area options-area" rows={4} value={form.placeOptions} onChange={(e) => update('placeOptions', e.target.value)} placeholder={'Noodle House, Vashi\nSeaside café\nMovie + dinner'}/><span className="field-hint">Add up to 8 options in each category.</span></label>
              <div className="helper-note"><Sparkles size={17}/><span><strong>Pro tip:</strong> Two or three options are usually enough to get a quick group decision.</span></div>
            </div>}
            {step === 3 && <div className="form-step-content"><div className="form-step-heading"><span className="step-icon"><CircleDollarSign size={19}/></span><div><h2>Set the scene.</h2><p>Give your plan a budget and make it easy for everyone to join.</p></div></div>
              <label className="field-label">What's the budget per person? <span className="optional-label">OPTIONAL</span><div className="budget-input-wrap"><span>₹</span><input className="text-input" type="number" min="0" max="100000000" value={form.budget} onChange={(e) => update('budget', e.target.value)} placeholder="1500"/><span className="budget-per-person">PER PERSON</span></div><span className="field-hint">This is a guide for the group, not a payment request.</span></label>
              <label className="field-label">Currency<select className="text-input select-input" value={form.currency} onChange={(e) => update('currency', e.target.value)}><option value="INR">Indian Rupee (₹ INR)</option><option value="USD">US Dollar ($ USD)</option><option value="GBP">British Pound (£ GBP)</option><option value="EUR">Euro (€ EUR)</option></select></label>
              <div className="preview-summary"><div className="preview-summary-top"><span className={`event-icon event-${form.eventType}`}>{eventEmoji(form.eventType)}</span><div><small>YOUR SCENE PREVIEW</small><h3>{form.title || 'Your very own scene'}</h3><p>{form.description || 'A little something to look forward to.'}</p></div></div><div className="preview-summary-bottom"><span><CalendarDays size={15}/>{dates.length} date options</span><span><MapPin size={15}/>{places.length} place options</span><span><CircleDollarSign size={15}/>{form.currency} {Number(form.budget || 0).toLocaleString('en-IN')}</span></div></div>
            </div>}
            {error && <div className="form-error form-error-spaced" role="alert">{error}</div>}
            <div className="form-panel-footer">{step > 1 ? <button className="button button-quiet" type="button" onClick={() => { setError(''); setStep((current) => current - 1); }}><ArrowLeft size={16}/> Back</button> : <span className="form-footnote"><span>✳</span> Free to use. Always.</span>}{step < 3 ? <button className="button button-primary" type="button" onClick={nextStep}>Continue <ArrowRight size={16}/></button> : <button className="button button-primary" type="button" disabled={busy} onClick={submit}>{busy ? 'Creating your scene…' : 'Create my scene'} <Sparkles size={16}/></button>}</div>
          </div>
        </section>
        <aside className="create-aside"><div className="aside-card aside-purple"><div className="aside-card-top"><span>✳ THE SCENESET WAY</span><span>01 / 03</span></div><div className="aside-art"><span className="aside-art-spark">✳</span><div className="aside-bubble bubble-a">🍜</div><div className="aside-bubble bubble-b">📍</div><div className="aside-bubble bubble-c">🗓️</div><div className="aside-orbit"/><div className="aside-orbit aside-orbit-two"/></div><h3>Plans should feel like the fun part.</h3><p>Get the details sorted early, so when the day comes, all you have to do is show up.</p></div><div className="aside-checklist"><div><span><Check size={13}/></span><div><strong>One link for everyone</strong><p>Friends can join without getting lost.</p></div></div><div><span><Check size={13}/></span><div><strong>Democracy, but make it fun</strong><p>Let votes settle the “where” and “when”.</p></div></div><div><span><Check size={13}/></span><div><strong>No one does the math</strong><p>Keep budgets and expenses in one place.</p></div></div></div></aside>
      </div>
    </div>
  );
}
