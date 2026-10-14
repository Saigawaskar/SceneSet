import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CalendarDays, Check, CircleDollarSign, MapPin, Sparkles, Users2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Toast from '../components/Toast.jsx';

const highlights = [
  { icon: Users2, text: 'Everyone gets a say' },
  { icon: CalendarDays, text: 'Dates that work for all' },
  { icon: CircleDollarSign, text: 'No awkward money math' }
];

export default function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const { login, register, user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => { if (!loading && user) navigate(params.get('next') || '/app', { replace: true }); }, [loading, user, navigate, params]);

  function update(key, value) { setForm((prev) => ({ ...prev, [key]: value })); }
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      if (isRegister) await register(form); else await login({ email: form.email, password: form.password });
      navigate(params.get('next') || '/app', { replace: true });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="auth-page">
      <section className="auth-showcase">
        <Link to="/" className="brand-lockup auth-brand"><span className="brand-mark"><Sparkles size={21} strokeWidth={2.5}/></span><span className="brand-name">scene<span>set</span><i>.</i></span></Link>
        <div className="showcase-content">
          <div className="eyebrow eyebrow-light"><span className="eyebrow-spark">✳</span> GOOD PLANS, BETTER MEMORIES</div>
          <h1>Less “where<br/>should we go?”<br/><em>More let’s go.</em></h1>
          <p className="showcase-description">The happy place for group plans. Get everyone on the same page, without 87 messages in the group chat.</p>
          <div className="showcase-highlights">{highlights.map(({ icon: Icon, text }) => <div key={text}><span><Icon size={17}/></span>{text}</div>)}</div>
          <div className="showcase-art">
            <div className="art-glow" />
            <div className="floating-card card-poll"><div className="floating-card-heading"><span className="mini-emoji">🍜</span><div><strong>Saturday plans?</strong><small>6 friends voting</small></div><span className="live-pill">LIVE</span></div><div className="poll-option poll-selected"><span>🥢 Noodle House</span><strong>67%</strong><i style={{ width: '67%' }}/></div><div className="poll-option"><span>🍕 Pizza Social</span><strong>33%</strong><i style={{ width: '33%' }}/></div><div className="poll-foot"><span className="mini-avatar a1">S</span><span className="mini-avatar a2">A</span><span className="mini-avatar a3">R</span><span className="poll-foot-text">+3 friends joined</span></div></div>
            <div className="floating-card card-date"><span className="date-icon"><CalendarDays size={19}/></span><div><small>THE GROUP AGREED</small><strong>Sat, Oct 24</strong><span><Check size={12}/> Everyone’s free</span></div></div>
            <div className="floating-card card-bill"><span className="bill-icon"><CircleDollarSign size={18}/></span><div><small>YOUR SHARE</small><strong>₹420.00</strong><span>All squared up ✨</span></div></div>
            <span className="art-star star-one">✳</span><span className="art-star star-two">✦</span><span className="art-star star-three">✧</span>
          </div>
        </div>
        <div className="showcase-footer"><span className="maker-credit"><span className="maker-credit-spark">✦</span> Made by Sai Sunil Gawaskar</span><span>GOOD PLANS · BETTER MEMORIES · 2026</span></div>
      </section>

      <section className="auth-form-side">
        <div className="auth-top-note">{isRegister ? 'Already part of the plan?' : 'New to SceneSet?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create account'} <ArrowRight size={14}/></Link></div>
        <div className="auth-form-wrap">
          <div className="auth-icon"><Sparkles size={21}/></div>
          <div className="auth-title-eyebrow">YOUR PEOPLE. YOUR PLANS.</div>
          <h2>{isRegister ? 'Let’s get you in.' : 'Welcome back.'}</h2>
          <p className="auth-subtitle">{isRegister ? 'Your next favourite memory starts here.' : 'Your crew and your next plan are waiting.'}</p>
          <form className="auth-form" onSubmit={submit}>
            {isRegister && <label className="field-label">Your name<div className="input-wrap"><input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="What do your friends call you?" autoComplete="name" minLength={2} maxLength={60} required/><span className="field-trailing">✳</span></div></label>}
            <label className="field-label">Email address<div className="input-wrap"><input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" autoComplete="email" required/><span className="field-trailing">✉</span></div></label>
            <label className="field-label">Password<div className="input-wrap"><input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder={isRegister ? 'At least 8 characters' : 'Enter your password'} minLength={isRegister ? 8 : 1} autoComplete={isRegister ? 'new-password' : 'current-password'} required/><button type="button" className="show-password" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Hide' : 'Show'}</button></div></label>
            {error && <div className="form-error" role="alert">{error}</div>}
            {isRegister && <label className="terms-check"><input type="checkbox" required/><span>I agree to use SceneSet respectfully and keep my group invites private.</span></label>}
            <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? 'One moment…' : isRegister ? 'Create my account' : 'Sign in to SceneSet'} <ArrowRight size={17}/></button>
          </form>
          <div className="auth-divider"><span>BUILT FOR REAL LIFE</span></div>
          <div className="auth-safe-note"><span><Check size={14}/></span><p>Private by default. Your plans are only visible to people you invite.</p></div>
        </div>
        <div className="auth-bottom-note"><MapPin size={14}/> Made for spontaneous plans, wherever you are.</div>
      </section>
      <Toast toast={error ? { type: 'error', message: error } : null} onClose={() => setError('')}/>
    </div>
  );
}
