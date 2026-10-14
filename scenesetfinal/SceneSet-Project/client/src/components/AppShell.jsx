import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, CalendarDays, ChevronDown, CircleHelp, Compass, Headphones, LogOut, Moon, Plus, Send, Settings2, Sparkles, Sun, Users2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { dateTimeLabel, initials } from '../lib/format.js';
import Toast from './Toast.jsx';

function getHelpAnswer(question) {
  const topic = question.toLowerCase();
  if (/invite|share|whatsapp|message/.test(topic)) return 'Open a scene and choose “Invite friends”. Copy the link, or send it through WhatsApp, SMS, email, or your device share menu.';
  if (/vote|date|place|poll/.test(topic)) return 'Open a scene, choose “Date & place”, then tap an option to vote. You can change your vote any time before the plan is confirmed.';
  if (/expense|bill|budget|money|split/.test(topic)) return 'Open the scene’s “Expenses” tab and add each payment. SceneSet calculates an equal split and suggested settle-up amounts; it never moves money.';
  if (/itinerary|trip|schedule|stop/.test(topic)) return 'Open the scene’s “Itinerary” tab and choose “Add a stop”. Add a time, place, and any notes your group needs.';
  if (/dark|night|theme|mode/.test(topic)) return 'Use the moon or sun button in the top bar to switch themes. Your choice is saved on this device.';
  return 'I can help with creating scenes, inviting friends, voting, expenses, itineraries, and the display theme. Try one of the quick topics below.';
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('sceneset-theme') === 'dark'; }
    catch (_error) { return false; }
  });
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpInput, setHelpInput] = useState('');
  const [helpMessages, setHelpMessages] = useState([
    { role: 'assistant', text: 'Hi! I’m SceneSet’s automated helper, available 24/7. What can I help you with?' }
  ]);
  const noticeRef = useRef(null);
  const profileRef = useRef(null);
  const topProfileRef = useRef(null);
  const helpEndRef = useRef(null);
  const [topProfileOpen, setTopProfileOpen] = useState(false);

  async function loadNotifications() {
    try {
      const result = await api('/notifications');
      setNotifications(result.notifications || []);
      setUnreadCount(result.unreadCount || 0);
    } catch (_error) { /* notifications are non-blocking */ }
  }

  useEffect(() => { loadNotifications(); }, [location.pathname]);
  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    try { localStorage.setItem('sceneset-theme', darkMode ? 'dark' : 'light'); }
    catch (_error) { /* theme still works for this session */ }
  }, [darkMode]);
  useEffect(() => {
    if (helpOpen) helpEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [helpMessages, helpOpen]);
  useEffect(() => {
    const onPointerDown = (event) => {
      if (noticeRef.current && !noticeRef.current.contains(event.target)) setNoticeOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
      if (topProfileRef.current && !topProfileRef.current.contains(event.target)) setTopProfileOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  async function markRead(notification) {
    try {
      await api(`/notifications/${notification._id}/read`, { method: 'PATCH' });
      setNotifications((items) => items.map((item) => item._id === notification._id ? { ...item, readAt: new Date().toISOString() } : item));
      setUnreadCount((count) => Math.max(0, count - (notification.readAt ? 0 : 1)));
      if (notification.plan?._id) navigate(`/plans/${notification.plan._id}`);
    } catch (error) { setToast({ type: 'error', message: error.message }); }
  }

  async function markAllRead() {
    try {
      await api('/notifications/read-all', { method: 'POST' });
      setNotifications((items) => items.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) { setToast({ type: 'error', message: error.message }); }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  function sendHelpMessage(question) {
    const text = question.trim();
    if (!text) return;
    setHelpMessages((messages) => [
      ...messages,
      { role: 'user', text },
      { role: 'assistant', text: getHelpAnswer(text) }
    ]);
    setHelpInput('');
  }

  function handleHelpSubmit(event) {
    event.preventDefault();
    sendHelpMessage(helpInput);
  }

  const isPlanDetail = location.pathname.startsWith('/plans/') && !location.pathname.endsWith('/new');
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/app" className="brand-lockup">
          <span className="brand-mark"><Sparkles size={21} strokeWidth={2.5} /></span>
          <span className="brand-name">scene<span>set</span><i>.</i></span>
        </NavLink>
        <div className="workspace-pill"><span className="workspace-dot" /> Personal workspace <ChevronDown size={14} /></div>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <NavLink to="/app" end className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}><Compass size={18} /> Overview</NavLink>
          <NavLink to="/plans/new" className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}><Plus size={18} /> Create a scene <span className="nav-kbd">N</span></NavLink>
          <button className={`side-link ${isPlanDetail ? 'active-soft' : ''}`} onClick={() => navigate('/app#plans')}><CalendarDays size={18} /> My plans</button>
        </nav>
        <div className="side-label side-label-spaced">YOUR SPACE</div>
        <div className="sidebar-tip">
          <div className="tip-illustration"><span>✳</span><span>✦</span><span>✧</span></div>
          <p>Good plans happen when everyone gets a say.</p>
          <button onClick={() => navigate('/plans/new')}>Make a plan <span>↗</span></button>
        </div>
        <div className="sidebar-bottom">
          <button className="side-link muted-link" onClick={() => setHelpOpen(true)}><CircleHelp size={18} /> Help & tips <span className="help-availability">24/7</span></button>
          <div className="profile-row" ref={profileRef}>
            <span className="avatar profile-avatar" style={{ background: user?.avatarColor || '#7567f8' }}>{initials(user?.name)}</span>
            <button className="profile-name" onClick={() => setProfileOpen((open) => !open)}><strong>{user?.name || 'Your profile'}</strong><span>{user?.email}</span></button>
            <button className="icon-button profile-menu-button" aria-label="Profile menu" onClick={() => setProfileOpen((open) => !open)}><Settings2 size={17} /></button>
            {profileOpen && <div className="profile-popover"><div className="popover-user"><strong>{user?.name}</strong><span>{user?.email}</span></div><button onClick={handleLogout}><LogOut size={16} /> Sign out</button></div>}
          </div>
        </div>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{location.pathname === '/app' ? 'Overview' : location.pathname === '/plans/new' ? 'Create a scene' : isPlanDetail ? 'Plan details' : 'Workspace'}</strong></div>
          <div className="topbar-actions">
            <span className="today-chip"><span className="live-dot" /> Your plans, in sync</span>
            <span className="maker-chip"><Sparkles size={13}/><span>Made by <strong>Sai Sunil Gawaskar</strong></span></span>
            <button className="icon-button theme-toggle" type="button" aria-label={`Switch to ${darkMode ? 'day' : 'night'} mode`} title={`Switch to ${darkMode ? 'day' : 'night'} mode`} aria-pressed={darkMode} onClick={() => setDarkMode((value) => !value)}>{darkMode ? <Sun size={18}/> : <Moon size={18}/>}</button>
            <div className="notification-wrap" ref={noticeRef}>
              <button className={`icon-button notification-button ${noticeOpen ? 'is-open' : ''}`} aria-label="Notifications" onClick={() => setNoticeOpen((open) => !open)}><Bell size={19} />{unreadCount > 0 && <span className="notification-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}</button>
              {noticeOpen && <div className="notification-popover">
                <div className="notification-head"><div><strong>Notifications</strong><span>{unreadCount ? `${unreadCount} unread` : 'You’re all caught up'}</span></div><button className="text-action" onClick={markAllRead} disabled={!unreadCount}>Mark all read</button></div>
                <div className="notification-list">
                  {notifications.length === 0 ? <div className="notification-empty"><span>✦</span><strong>All quiet here</strong><p>Updates from your plans will show up here.</p></div> : notifications.map((notification) => <button key={notification._id} className={`notification-item ${notification.readAt ? '' : 'unread'}`} onClick={() => markRead(notification)}><span className="notification-icon"><Sparkles size={16} /></span><span className="notification-copy"><strong>{notification.title}</strong><span>{notification.message}</span><small>{dateTimeLabel(notification.createdAt)}</small></span>{!notification.readAt && <i className="unread-dot" />}</button>)}
                </div>
              </div>}
            </div>
            <div className="top-profile-wrap" ref={topProfileRef}>
              <button className="avatar topbar-avatar" style={{ background: user?.avatarColor || '#7567f8' }} onClick={() => setTopProfileOpen((open) => !open)} aria-label="Open profile">{initials(user?.name)}</button>
              {topProfileOpen && <div className="top-profile-popover"><div className="popover-user"><strong>{user?.name}</strong><span>{user?.email}</span></div><button onClick={handleLogout}><LogOut size={16}/> Sign out</button></div>}
            </div>
          </div>
        </header>
        <div className="page-content"><Outlet context={{ showToast: setToast, reloadNotifications: loadNotifications }} /></div>
      </main>
      <button className="help-launcher" type="button" aria-label="Open 24/7 help chat" onClick={() => setHelpOpen(true)}><Headphones size={19}/><span>Help</span></button>
      {helpOpen && <section className="support-chat" aria-label="24/7 SceneSet support chat">
        <header className="support-chat-header"><span className="support-chat-icon"><Headphones size={17}/></span><div><strong>SceneSet help</strong><small><i/> Automated support · 24/7</small></div><button className="icon-button" type="button" aria-label="Close help chat" onClick={() => setHelpOpen(false)}><X size={17}/></button></header>
        <div className="support-chat-messages" aria-live="polite">{helpMessages.map((message, index) => <p key={`${message.role}-${index}`} className={`support-message support-message-${message.role}`}>{message.text}</p>)}<span ref={helpEndRef}/></div>
        <div className="support-chat-topics"><span>Quick help</span>{[['Invite friends', 'How do I invite friends?'], ['Voting', 'How does voting work?'], ['Expenses', 'How do I split expenses?']].map(([label, prompt]) => <button key={label} type="button" onClick={() => sendHelpMessage(prompt)}>{label}</button>)}</div>
        <form className="support-chat-form" onSubmit={handleHelpSubmit}><input value={helpInput} onChange={(event) => setHelpInput(event.target.value)} aria-label="Message 24/7 help" placeholder="Ask about your plans…"/><button className="icon-button" type="submit" aria-label="Send message" disabled={!helpInput.trim()}><Send size={16}/></button></form>
        <p className="support-chat-note">Instant automated answers, available anytime.</p>
      </section>}
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <NavLink to="/app" end><Compass size={19}/><span>Home</span></NavLink>
        <NavLink to="/plans/new"><Plus size={19}/><span>New</span></NavLink>
        <button onClick={() => { setNoticeOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Bell size={19}/><span>Updates</span>{unreadCount > 0 && <i />}</button>
      </nav>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
