import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays, CheckCircle2, Clock3, Compass, Plus, Sparkles, Users2, Wallet, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { dateLabel, eventEmoji, money } from '../lib/format.js';
import AvatarStack from '../components/AvatarStack.jsx';

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
};

function getPlanPulse(plan) {
  if (plan.status === 'completed') return { score: 100, action: 'Memory made' };
  if (plan.status === 'confirmed') return { score: 100, action: 'All set for the plan' };

  const memberCount = Math.max(plan.members?.length || 1, 1);
  const dateVoters = new Set((plan.dateOptions || []).flatMap((option) => option.voters || []).map((voter) => String(voter?._id || voter)));
  const placeVoters = new Set((plan.placeOptions || []).flatMap((option) => option.voters || []).map((voter) => String(voter?._id || voter)));
  const dateCoverage = dateVoters.size / memberCount;
  const placeCoverage = placeVoters.size / memberCount;

  if (!plan.dateOptions?.length) return { score: 0, action: 'Add a date option' };
  if (!plan.placeOptions?.length) return { score: 0, action: 'Add a place idea' };
  if (dateCoverage >= 1 && placeCoverage >= 1) return { score: 100, action: 'Confirm the favourites' };

  return {
    score: Math.round(((dateCoverage + placeCoverage) / 2) * 100),
    action: dateCoverage < 1 ? 'Get date votes in' : 'Get place votes in'
  };
}

function PlanCard({ plan, index }) {
  const votedDates = plan.dateOptions?.reduce((sum, option) => sum + (option.voters?.length || 0), 0) || 0;
  const votedPlaces = plan.placeOptions?.reduce((sum, option) => sum + (option.voters?.length || 0), 0) || 0;
  const voteTotal = votedDates + votedPlaces;
  const voteOptions = (plan.dateOptions?.length || 0) + (plan.placeOptions?.length || 0);
  const displayDate = plan.dateOptions?.find((option) => option.voters?.length)?.value || plan.dateOptions?.[0]?.value;
  const pulse = getPlanPulse(plan);
  return (
    <Link to={`/plans/${plan._id}`} className={`plan-card plan-card-${index % 4}`}>
      <div className="plan-card-top"><span className={`event-icon event-${plan.eventType}`}>{eventEmoji(plan.eventType)}</span><span className={`status-pill status-${plan.status}`}>{plan.status === 'planning' ? 'Planning' : plan.status === 'confirmed' ? 'Confirmed' : 'Completed'}</span><button className="plan-more" aria-label="Open plan"><ArrowUpRight size={17}/></button></div>
      <h3>{plan.title}</h3><p className="plan-description">{plan.description || 'A little something to look forward to.'}</p>
      <div className="plan-card-meta"><span><CalendarDays size={15}/>{dateLabel(displayDate)}</span><span><Users2 size={15}/>{plan.members?.length || 1} people</span></div>
      <div className="plan-pulse" aria-label={`Plan readiness ${pulse.score} percent. Next step: ${pulse.action}`}><div className="plan-pulse-track"><span style={{ width: `${pulse.score}%` }}/></div><span className="plan-pulse-action"><Zap size={13}/>{pulse.action}</span><strong>{pulse.score}%</strong></div>
      <div className="plan-card-foot"><AvatarStack members={plan.members || []} limit={4}/><span className="vote-activity"><span className="activity-dot"/>{voteTotal ? `${voteTotal} votes in` : `${voteOptions} options to vote`}</span></div>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  async function loadPlans() {
    setLoading(true); setError('');
    try {
      const result = await api('/plans');
      setPlans(result.plans || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadPlans(); }, []);

  const activePlans = useMemo(() => plans.filter((plan) => plan.status !== 'completed'), [plans]);
  const confirmedPlans = useMemo(() => plans.filter((plan) => plan.status === 'confirmed').length, [plans]);
  const totalFriends = useMemo(() => new Set(plans.flatMap((plan) => (plan.members || []).map((member) => member.user?._id || member.user))).size, [plans]);
  const visiblePlans = useMemo(() => {
    const list = filter === 'all' ? plans : plans.filter((plan) => plan.status === filter);
    return list.slice(0, 6);
  }, [plans, filter]);

  return (
    <div className="dashboard-page">
      <section className="welcome-row">
        <div><div className="welcome-eyebrow"><span className="eyebrow-spark">✳</span> YOUR LITTLE CORNER OF THE INTERNET</div><h1>{greeting()}, {user?.name?.split(' ')[0] || 'friend'}<span className="wave">✌️</span></h1><p>Big plans, tiny details. Let’s get your people together.</p></div>
        <button className="button button-primary" onClick={() => navigate('/plans/new')}><Plus size={18}/> Create a scene</button>
      </section>

      <section className="hero-banner">
        <div className="hero-banner-copy"><div className="hero-badge"><Sparkles size={13}/> THE GROUP CHAT, BUT BETTER</div><h2>Make plans that<br/><em>actually happen.</em></h2><p>Pick a date. Find your place. Split the bill.<br/>Finally get everyone on the same page.</p><button className="button button-white" onClick={() => navigate('/plans/new')}>Plan something fun <ArrowRight size={16}/></button></div>
        <div className="hero-decor"><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/><div className="hero-orbit orbit-three"/><div className="hero-center-spark">✳</div><div className="hero-float hero-float-one"><span>🥳</span><small>Birthday dinner</small></div><div className="hero-float hero-float-two"><span>🍿</span><small>Movie night</small></div><div className="hero-float hero-float-three"><span>🌴</span><small>Weekend trip</small></div><div className="hero-person person-one">S</div><div className="hero-person person-two">A</div><div className="hero-person person-three">R</div><span className="hero-sunburst">✦</span></div>
        <span className="banner-label">SCENE NO. 001</span>
      </section>

      <section className="stats-grid" aria-label="Your planning stats">
        <div className="stat-card"><span className="stat-icon stat-lilac"><CalendarDays size={18}/></span><div><p>Scenes in motion</p><strong>{loading ? '—' : activePlans.length}</strong><span className="stat-foot"><ArrowUpRight size={13}/> Ready to happen</span></div><div className="stat-sparkline sparkline-one"><i/><i/><i/><i/><i/><i/><i/></div></div>
        <div className="stat-card"><span className="stat-icon stat-orange"><CheckCircle2 size={18}/></span><div><p>Plans locked in</p><strong>{loading ? '—' : confirmedPlans}</strong><span className="stat-foot">Decisions made, stress gone</span></div><div className="stat-sparkline sparkline-two"><i/><i/><i/><i/><i/><i/><i/></div></div>
        <div className="stat-card"><span className="stat-icon stat-mint"><Users2 size={18}/></span><div><p>People in your orbit</p><strong>{loading ? '—' : totalFriends}</strong><span className="stat-foot">Across all your scenes</span></div><div className="stat-sparkline sparkline-three"><i/><i/><i/><i/><i/><i/><i/></div></div>
      </section>

      <section className="plans-section" id="plans">
        <div className="section-heading"><div><div className="section-overline">YOUR SOCIAL CALENDAR</div><h2>Scenes you’re making <span>✳</span></h2><p>Every little plan is something to look forward to.</p></div><Link to="/plans/new" className="text-link">Start a new one <ArrowRight size={16}/></Link></div>
        <div className="filter-row"><div className="filter-tabs" role="group" aria-label="Filter plans">{[['all', 'All scenes'], ['planning', 'In the works'], ['confirmed', 'Locked in'], ['completed', 'Past scenes']].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={filter === value ? 'selected' : ''}>{label}</button>)}</div><span className="result-count">{visiblePlans.length} {visiblePlans.length === 1 ? 'scene' : 'scenes'}</span></div>
        {error && <div className="inline-error"><span>{error}</span><button onClick={loadPlans}>Try again</button></div>}
        {loading ? <div className="plan-grid">{[1, 2, 3].map((item) => <div className="plan-skeleton" key={item}><div/><i/><i/><span/></div>)}</div> : visiblePlans.length ? <div className="plan-grid">{visiblePlans.map((plan, index) => <PlanCard key={plan._id} plan={plan} index={index}/>)}</div> : <div className="empty-state"><div className="empty-art"><span>✳</span><i>✦</i><b>✧</b></div><h3>{filter === 'all' ? 'It’s a little too quiet here.' : 'No scenes in this category yet.'}</h3><p>{filter === 'all' ? 'Your next favourite memory starts with one tiny plan.' : 'Try another filter or make a new plan.'}</p><button className="button button-primary" onClick={() => navigate('/plans/new')}><Plus size={17}/> Create your first scene</button></div>}
      </section>
      <footer className="page-footer"><span className="maker-credit"><span className="maker-credit-spark">✦</span> Made by Sai Sunil Gawaskar</span><span>SCENESET <i>✳</i> GOOD PLANS · 2026</span></footer>
    </div>
  );
}
