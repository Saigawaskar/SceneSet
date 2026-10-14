import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, LoaderCircle, Sparkles, Users2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

export default function JoinPlan() {
  const { code } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState('loading');
  const [message, setMessage] = useState('Checking your invite…');
  useEffect(() => {
    if (loading) return;
    if (!user) { setState('signed-out'); return; }
    let active = true;
    api(`/plans/join/${code}`, { method: 'POST' }).then((result) => {
      if (!active) return;
      setState('success'); setMessage(result.title || 'You joined the scene.');
      setTimeout(() => navigate(`/plans/${result.planId}`, { replace: true }), 1000);
    }).catch((error) => {
      if (!active) return;
      setState('error'); setMessage(error.message);
    });
    return () => { active = false; };
  }, [code, loading, user, navigate]);

  if (loading) return <div className="join-page"><LoaderCircle className="spin"/><p>Checking your session…</p></div>;
  if (state === 'signed-out') return <div className="join-page"><div className="join-card"><div className="auth-icon"><Users2 size={22}/></div><div className="welcome-eyebrow">YOU’VE BEEN INVITED</div><h1>There’s a scene<br/>with your name on it.</h1><p>Sign in or make an account to join your people and help make the plan.</p><Link className="button button-primary button-full" to={`/login?next=${encodeURIComponent(`/join/${code}`)}`}>Sign in to join <ArrowRight size={17}/></Link><Link className="join-secondary-link" to={`/register?next=${encodeURIComponent(`/join/${code}`)}`}>New to SceneSet? Create an account</Link></div></div>;
  return <div className="join-page"><div className={`join-card ${state === 'error' ? 'join-error' : ''}`}><div className="auth-icon">{state === 'success' ? <CheckCircle2 size={22}/> : state === 'error' ? <span>!</span> : <Sparkles size={22}/>}</div><div className="welcome-eyebrow">{state === 'success' ? 'YOU’RE IN' : state === 'error' ? 'INVITE ISSUE' : 'ONE MOMENT'}</div><h1>{state === 'success' ? 'You’re part of the plan.' : state === 'error' ? 'This link needs a look.' : 'Getting the crew together…'}</h1><p>{message}</p>{state === 'loading' && <LoaderCircle className="spin join-spinner"/>}{state === 'success' && <span className="join-success-note">Taking you to the scene now…</span>}{state === 'error' && <Link className="button button-primary button-full" to="/app">Go to my scenes <ArrowRight size={17}/></Link>}<Link className="join-brand" to="/app"><span className="brand-mark"><Sparkles size={16}/></span> sceneset.</Link></div></div>;
}
