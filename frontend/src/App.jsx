import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Bell, Check, ChevronDown, Clock3,
  Gavel, Heart, Menu, Plus, Search, ShieldCheck, Sparkles, Timer, UserRound, X, Zap,
} from 'lucide-react';

const demoLots = [
  { id: 'demo-1', title: 'A chair with a story', subtitle: 'Mid-century teak lounge chair', category: 'home', category_label: 'Home & Living', image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=85', seller_name: 'Studio Form', leading_bid: '₹18,500', next_bid: '₹19,000', bid_count: 12, ends_at: new Date(Date.now() + 1000 * 60 * 43 + 24000).toISOString(), state: 'live', description: 'A beautifully preserved teak lounge chair with sculpted arms and a newly refreshed linen seat. A thoughtful piece for a slow Sunday.' },
  { id: 'demo-2', title: 'The quiet geometry', subtitle: 'Original ink study, 1986', category: 'art', category_label: 'Art & Design', image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1000&q=85', seller_name: 'Paper & Form', leading_bid: '₹7,200', next_bid: '₹7,400', bid_count: 8, ends_at: new Date(Date.now() + 1000 * 60 * 16 + 78000).toISOString(), state: 'live', description: 'An original minimal ink study on archival cotton paper, signed and dated 1986. Framed in a slim, solid oak frame.' },
  { id: 'demo-3', title: 'A little silver, a lot of time', subtitle: 'Seiko automatic, circa 1974', category: 'watches', category_label: 'Watches', image_url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1000&q=85', seller_name: 'Second Hand', leading_bid: '₹22,800', next_bid: '₹23,300', bid_count: 21, ends_at: new Date(Date.now() + 1000 * 60 * 4 + 42000).toISOString(), state: 'live', description: 'A serviced Seiko automatic with a brushed steel case, original dial and a fresh leather strap. Keeps excellent time.' },
  { id: 'demo-4', title: 'A camera for the long way', subtitle: 'Olympus OM-1 film camera', category: 'electronics', category_label: 'Electronics', image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=85', seller_name: 'Frame by Frame', leading_bid: '₹12,000', next_bid: '₹12,300', bid_count: 6, ends_at: new Date(Date.now() + 1000 * 60 * 90).toISOString(), state: 'live', description: 'A compact classic in working condition. The viewfinder is clear, shutter speeds are accurate and the light meter has been checked.' },
  { id: 'demo-5', title: 'A vessel in blue', subtitle: 'Hand-thrown stoneware vase', category: 'home', category_label: 'Home & Living', image_url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=85', seller_name: 'Clay House', leading_bid: '₹3,400', next_bid: '₹3,500', bid_count: 9, ends_at: new Date(Date.now() + 1000 * 60 * 27).toISOString(), state: 'live', description: 'Thrown by hand in a small studio in Auroville. The glazed surface shifts between deep blue and soft grey in natural light.' },
  { id: 'demo-6', title: 'A record of the everyday', subtitle: '35mm street photography print', category: 'art', category_label: 'Art & Design', image_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1000&q=85', seller_name: 'The Darkroom', leading_bid: '₹5,600', next_bid: '₹5,800', bid_count: 4, ends_at: new Date(Date.now() + 1000 * 60 * 64).toISOString(), state: 'live', description: 'A museum-quality silver gelatin print from an original 35mm negative. Printed by hand in a small darkroom in Kochi.' },
];

const categoryOptions = [
  { key: 'all', label: 'All lots' }, { key: 'art', label: 'Art & design' },
  { key: 'home', label: 'Home & living' }, { key: 'watches', label: 'Watches' },
  { key: 'collectibles', label: 'Collectibles' }, { key: 'electronics', label: 'Electronics' },
];

const money = (value) => {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
};

async function api(path, { token, ...options } = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const detail = data?.detail || Object.values(data || {}).flat().find((item) => typeof item === 'string') || 'Something went wrong. Please try again.';
    throw new Error(detail);
  }
  return data;
}

function useCountdown(end) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const ms = Math.max(0, new Date(end).getTime() - now);
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (d) return `${d}d ${h}h left`;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timeout = setTimeout(onClose, 3400);
    return () => clearTimeout(timeout);
  }, [message, onClose]);
  if (!message) return null;
  return <div className="toast"><span className="toast-check"><Check size={15} /></span>{message}<button onClick={onClose} aria-label="Dismiss"><X size={15} /></button></div>;
}

function LotCard({ lot, watched, onSelect, onWatch }) {
  const countdown = useCountdown(lot.ends_at);
  return (
    <article className="lot-card">
      <button className="lot-image-button" onClick={() => onSelect(lot)} aria-label={`View ${lot.title}`}>
        <img className="lot-image" src={lot.image_url} alt={lot.title} loading="lazy" />
        {lot.id === 'demo-1' && <span className="lot-ribbon"><Sparkles size={12} /> staff pick</span>}
        <span className="live-dot"><span /> live auction</span>
      </button>
      <button className={`watch-button ${watched ? 'is-watched' : ''}`} onClick={() => onWatch(lot)} aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}>
        <Heart size={17} fill={watched ? 'currentColor' : 'none'} />
      </button>
      <div className="lot-details">
        <div className="lot-category">{lot.category_label || lot.category}</div>
        <button className="lot-title" onClick={() => onSelect(lot)}>{lot.title}</button>
        <div className="lot-subtitle">{lot.subtitle || lot.seller_name}</div>
        <div className="lot-card-footer">
          <div><span className="muted-label">Current bid</span><strong>{money(lot.leading_bid)}</strong></div>
          <div className="lot-bids"><span className="bid-count"><Gavel size={14} /> {lot.bid_count ?? 0}</span><span className="countdown"><Clock3 size={13} /> {countdown}</span></div>
        </div>
      </div>
    </article>
  );
}

function AuthModal({ mode, setMode, onClose, onSuccess, apiOnline }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (!apiOnline) throw new Error('Start the Django backend to create an account or sign in.');
      const data = await api(mode === 'signup' ? '/auth/register/' : '/auth/token/', {
        method: 'POST', body: JSON.stringify({ username, password }),
      });
      onSuccess(data); onClose();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="modal-close" onClick={onClose} aria-label="Close"><X /></button>
        <div className="modal-mark">L</div>
        <p className="eyebrow">Good to have you here</p>
        <h2 id="auth-title">{mode === 'signup' ? 'Make room for a new find.' : 'Welcome back.'}</h2>
        <p className="modal-copy">Join a community that values the story behind the things we keep.</p>
        <form onSubmit={submit} className="auth-form">
          <label>Username<input autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a username" required minLength={3} /></label>
          <label>Password<input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} /></label>
          {error && <div className="form-error">{error}</div>}
          <button className="button button-dark auth-submit" disabled={busy}>{busy ? 'One moment…' : mode === 'signup' ? 'Create my account' : 'Sign in'} <ArrowRight size={16} /></button>
        </form>
        <p className="auth-switch">{mode === 'signup' ? 'Already have an account?' : 'New to Lotline?'} <button onClick={() => { setError(''); setMode(mode === 'signup' ? 'login' : 'signup'); }}>{mode === 'signup' ? 'Sign in' : 'Create an account'}</button></p>
        <p className="auth-note"><ShieldCheck size={13} /> Your account details stay private.</p>
      </section>
    </div>
  );
}

function LotModal({ lot, onClose, onBid, user, apiOnline, onSignIn, watched, onWatch, toast }) {
  const [amount, setAmount] = useState(Number(lot.next_bid || 0));
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const countdown = useCountdown(lot.ends_at);
  useEffect(() => {
    if (!apiOnline || String(lot.id).startsWith('demo-')) return;
    api(`/auctions/${lot.id}/`).then((data) => { setHistory(data.recent_bids || []); setAmount(Number(data.next_bid || 0)); }).catch(() => {});
  }, [apiOnline, lot.id]);
  const placeBid = async () => {
    if (!user) { onSignIn(); return; }
    if (!apiOnline || String(lot.id).startsWith('demo-')) { toast('Connect the backend to place a real bid.'); return; }
    setBusy(true);
    try { await onBid(lot, amount); onClose(); }
    catch (error) { toast(error.message); }
    finally { setBusy(false); }
  };
  return (
    <div className="overlay detail-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="lot-modal" role="dialog" aria-modal="true" aria-labelledby="lot-modal-title">
        <button className="modal-close" onClick={onClose} aria-label="Close"><X /></button>
        <div className="lot-modal-image"><img src={lot.image_url} alt={lot.title} /><span className="live-dot"><span /> {lot.state || 'live'}</span></div>
        <div className="lot-modal-body">
          <div className="lot-category">{lot.category_label || lot.category} <span>·</span> offered by {lot.seller_name}</div>
          <h2 id="lot-modal-title">{lot.title}</h2>
          <p className="modal-description">{lot.description || lot.subtitle}</p>
          <div className="bid-panel">
            <div className="bid-panel-top"><div><span className="muted-label">Leading bid</span><strong>{money(lot.leading_bid)}</strong></div><div className="auction-clock"><span className="muted-label">Time remaining</span><strong><Timer size={17} />{countdown}</strong></div></div>
            <div className="bid-panel-actions"><label className="bid-input-label">Your bid<input type="number" min={Number(lot.next_bid)} step="100" value={amount} onChange={(e) => setAmount(e.target.value)} /></label><button className="button button-dark" onClick={placeBid} disabled={busy || lot.state === 'ended'}>{busy ? 'Placing bid…' : 'Place bid'} <ArrowUpRight size={16} /></button></div>
            <small>Minimum next bid: {money(lot.next_bid)} · Secure checkout is arranged after the auction.</small>
          </div>
          <div className="modal-meta"><span><Gavel size={15} /> {lot.bid_count ?? 0} bids so far</span><button className={watched ? 'is-watched' : ''} onClick={() => onWatch(lot)}><Heart size={15} fill={watched ? 'currentColor' : 'none'} /> {watched ? 'Watching' : 'Add to watchlist'}</button></div>
          {history.length > 0 && <div className="bid-history"><h3>Recent bids</h3>{history.slice(0, 5).map((bid) => <div className="history-row" key={bid.id}><span><b>{bid.bidder_name}</b><small>{new Date(bid.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</small></span><strong>{money(bid.amount)}</strong></div>)}</div>}
        </div>
      </section>
    </div>
  );
}

function ListingModal({ onClose, onCreate, busy, error }) {
  const defaultEnd = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);
  const [form, setForm] = useState({ title: '', description: '', category: 'art', image_url: '', starting_bid: '1000', bid_increment: '100', starts_at: new Date().toISOString().slice(0, 16), ends_at: defaultEnd.toISOString().slice(0, 16) });
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="listing-modal" role="dialog" aria-modal="true" aria-labelledby="listing-title">
        <button className="modal-close" onClick={onClose} aria-label="Close"><X /></button>
        <p className="eyebrow">Give a good thing another chapter</p><h2 id="listing-title">Create a listing</h2><p className="modal-copy">Tell its story, set a starting bid, and let the right person find it.</p>
        <form className="listing-form" onSubmit={(e) => { e.preventDefault(); onCreate(form); }}>
          <label>Item name<input required maxLength={140} value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. A lamp from another time" /></label>
          <label>Category<select value={form.category} onChange={(e) => update('category', e.target.value)}>{categoryOptions.slice(1).map((c) => <option value={c.key} key={c.key}>{c.label}</option>)}</select></label>
          <label className="wide-field">Description<textarea required rows="3" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="What makes this item worth keeping?" /></label>
          <label className="wide-field">Image URL<input type="url" value={form.image_url} onChange={(e) => update('image_url', e.target.value)} placeholder="https://…" /></label>
          <label>Starting bid (₹)<input type="number" min="1" step="100" required value={form.starting_bid} onChange={(e) => update('starting_bid', e.target.value)} /></label>
          <label>Bid increment (₹)<input type="number" min="1" step="100" required value={form.bid_increment} onChange={(e) => update('bid_increment', e.target.value)} /></label>
          <label>Starts<input type="datetime-local" required value={form.starts_at} onChange={(e) => update('starts_at', e.target.value)} /></label>
          <label>Ends<input type="datetime-local" required value={form.ends_at} onChange={(e) => update('ends_at', e.target.value)} /></label>
          {error && <div className="form-error wide-field">{error}</div>}
          <button className="button button-dark wide-field" disabled={busy}>{busy ? 'Publishing…' : 'Publish auction'} <ArrowRight size={16} /></button>
        </form>
      </section>
    </div>
  );
}

export default function App() {
  const [lots, setLots] = useState(demoLots);
  const [apiOnline, setApiOnline] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filter, setFilter] = useState('live');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [selectedLot, setSelectedLot] = useState(null);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lotline-user') || 'null'); } catch { return null; }
  });
  const [watched, setWatched] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('lotline-watchlist') || '[]')); } catch { return new Set(); }
  });
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [listingOpen, setListingOpen] = useState(false);
  const [listingBusy, setListingBusy] = useState(false);
  const [listingError, setListingError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeToast = useCallback(() => setToastMessage(''), []);
  const toast = useCallback((message) => setToastMessage(message), []);
  const loadLots = useCallback(async () => {
    try {
      const params = new URLSearchParams({ state: filter });
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (search) params.set('q', search);
      if (filter === 'watchlist' && user?.token) params.set('watched', '1');
      const data = await api(`/auctions/?${params}`, { token: user?.token });
      setLots(Array.isArray(data) && data.length ? data : []); setApiOnline(true);
    } catch {
      setApiOnline(false);
      const matching = demoLots.filter((lot) => (selectedCategory === 'all' || lot.category === selectedCategory) && (!search || `${lot.title} ${lot.subtitle}`.toLowerCase().includes(search.toLowerCase())));
      setLots(filter === 'live' ? matching : []);
    }
  }, [filter, selectedCategory, search, user?.token]);

  useEffect(() => { loadLots(); const timer = setInterval(loadLots, 20000); return () => clearInterval(timer); }, [loadLots]);
  useEffect(() => {
    if (!apiOnline || !user?.token) return;
    api('/me/', { token: user.token }).then((data) => setWatched(new Set(data.watchlist || []))).catch(() => {});
  }, [apiOnline, user?.token]);

  const featured = useMemo(() => lots.find((lot) => lot.id === 'demo-1') || lots[0] || demoLots[0], [lots]);
  const visibleLots = useMemo(() => {
    if (filter === 'watchlist' && !apiOnline) return demoLots.filter((lot) => watched.has(lot.id));
    return lots;
  }, [lots, filter, watched, apiOnline]);

  const handleAuth = (data) => {
    const nextUser = { token: data.token, username: data.username };
    setUser(nextUser); localStorage.setItem('lotline-user', JSON.stringify(nextUser)); toast(`Welcome, ${data.username}.`); loadLots();
  };
  const signOut = () => { setUser(null); localStorage.removeItem('lotline-user'); toast('You have signed out.'); };
  const openAuth = (mode = 'login') => { setAuthMode(mode); setAuthOpen(true); };
  const handleWatch = async (lot) => {
    if (apiOnline && user?.token && !String(lot.id).startsWith('demo-')) {
      try { const data = await api(`/auctions/${lot.id}/watch/`, { token: user.token, method: 'POST' }); setWatched((prev) => { const next = new Set(prev); data.watching ? next.add(lot.id) : next.delete(lot.id); return next; }); toast(data.watching ? 'Added to your watchlist.' : 'Removed from your watchlist.'); loadLots(); }
      catch (e) { toast(e.message); }
      return;
    }
    if (!apiOnline) { toast('Run the backend to save your watchlist.'); return; }
    if (!user) { openAuth('login'); return; }
    toast('This preview listing is not connected to the database.');
  };
  const handleBid = async (lot, amount) => {
    const result = await api(`/auctions/${lot.id}/bids/`, { token: user?.token, method: 'POST', body: JSON.stringify({ amount }) });
    toast(`Your bid of ${money(result.amount)} is in.`); await loadLots();
  };
  const handleCreate = async (form) => {
    setListingBusy(true); setListingError('');
    try {
      await api('/auctions/', { token: user?.token, method: 'POST', body: JSON.stringify({ ...form, starts_at: new Date(form.starts_at).toISOString(), ends_at: new Date(form.ends_at).toISOString() }) });
      setListingOpen(false); setFilter('live'); setSelectedCategory('all'); toast('Your auction is published.'); await loadLots();
    } catch (e) { setListingError(e.message); }
    finally { setListingBusy(false); }
  };

  const scrollToLots = () => document.getElementById('live-lots')?.scrollIntoView({ behavior: 'smooth' });
  return (
    <div className="site-shell">
      <div className="announcement"><span className="announcement-spark">✳</span> Fresh lots. Fair bids. Good stories. <span className="announcement-link" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>How bidding works <ArrowRight size={13} /></span></div>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Lotline home"><span className="brand-mark">L</span><span>lotline<span className="brand-period">.</span></span></a>
        <nav className={`main-nav ${mobileOpen ? 'nav-open' : ''}`}>
          <button className="nav-link active" onClick={() => { setFilter('live'); scrollToLots(); setMobileOpen(false); }}>Discover</button>
          <button className="nav-link" onClick={() => { setFilter('upcoming'); scrollToLots(); setMobileOpen(false); }}>Coming up</button>
          <button className="nav-link" onClick={() => { setFilter('watchlist'); scrollToLots(); setMobileOpen(false); }}>Watchlist</button>
          <button className="nav-link mobile-how" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>How it works</button>
        </nav>
        <div className="header-actions">
          <button className="header-search" onClick={() => document.getElementById('auction-search')?.focus()} aria-label="Search"><Search size={18} /></button>
          {user ? <div className="user-menu"><span className="user-avatar">{user.username.slice(0, 1).toUpperCase()}</span><span className="user-name">{user.username}</span><button className="signout-button" onClick={signOut}>Sign out</button></div> : <button className="signin-button" onClick={() => openAuth('login')}>Sign in</button>}
          {user ? <button className="button button-dark header-sell" onClick={() => { setListingError(''); setListingOpen(true); }}><Plus size={16} /> Sell a lot</button> : <button className="button button-dark header-sell" onClick={() => openAuth('signup')}>Join Lotline <ArrowRight size={15} /></button>}
          <button className="mobile-menu" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle navigation">{mobileOpen ? <X /> : <Menu />}</button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> The live auction room</div>
            <h1>The next good find<br /><em>is up for bid.</em></h1>
            <p className="hero-description">Vintage cameras, studio pottery, time-tested design. Open bids, clear deadlines, and a little more time when a late bid lands.</p>
            <div className="hero-actions"><button className="button button-dark hero-cta" onClick={scrollToLots}>See what’s live <ArrowRight size={17} /></button><button className="text-button" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>How bidding works <ArrowDownRight size={16} /></button></div>
            <div className="hero-proof"><div className="proof-avatars"><span>R</span><span>M</span><span>A</span><span>+</span></div><p><b>Every bid is in the open.</b><br />A fair room for people who love the find.</p></div>
          </div>
          <div className="hero-art">
            <div className="hero-photo-wrap"><img className="hero-photo" src="https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1400&q=90" alt="A vintage watch offered in a live auction" /><div className="hero-photo-grain" /></div>
            <div className="hero-note"><span className="note-star">✳</span><span>Live bids.<br /><i>All in the open.</i></span></div>
            <div className="hero-lot-teaser"><div className="teaser-image"><img src={featured.image_url} alt="" /></div><div className="teaser-content"><span>Worth a closer look</span><b>{featured.title}</b><small>Leading at {money(featured.leading_bid)}</small></div><button onClick={() => setSelectedLot(featured)} aria-label="View featured lot"><ArrowUpRight size={18} /></button></div>
            <div className="hero-index">01 <span /> 04</div>
          </div>
          <div className="hero-bottom-line"><span>Clear bids and closing times.</span><span>Every move visible to all bidders.</span><span>Late bids extend the clock fairly.</span></div>
        </section>

        <section className="trust-strip"><div><Sparkles size={17} /><span>Seller details on every lot</span></div><div><ShieldCheck size={17} /><span>Bid history stays transparent</span></div><div><Zap size={17} /><span>Late bids add two minutes</span></div><div><Heart size={17} /><span>No hidden bid jumps</span></div></section>

        <section className="lots-section" id="live-lots">
          <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> Lots on the block</div><h2>{filter === 'upcoming' ? 'Coming up.' : filter === 'watchlist' ? 'Your watchlist.' : filter === 'ended' ? 'Recently closed.' : 'Going, going.'}</h2><p>Live prices. Clear clocks. Your next favorite find.</p></div><div className="section-side-note"><span className="live-pulse" /> <b>{apiOnline ? 'Auction room open' : 'Preview mode'}</b><small>{apiOnline ? 'Bids refresh every few seconds' : 'Connect the backend for bidding'}</small></div></div>
          <div className="lot-toolbar">
            <div className="category-tabs">{categoryOptions.map((category) => <button key={category.key} className={selectedCategory === category.key ? 'selected' : ''} onClick={() => setSelectedCategory(category.key)}>{category.label}</button>)}</div>
            <form className="lot-search" onSubmit={(e) => { e.preventDefault(); setSearch(query); }}><Search size={16} /><input id="auction-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a good thing" /><button type="submit" aria-label="Search lots"><ArrowRight size={15} /></button></form>
            <div className="state-select-wrap"><select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter auctions"><option value="live">Live now</option><option value="upcoming">Coming up</option><option value="ended">Recently closed</option><option value="watchlist">My watchlist</option></select><ChevronDown size={14} /></div>
          </div>
          {visibleLots.length ? <div className="lot-grid">{visibleLots.map((lot) => <LotCard key={lot.id} lot={lot} watched={watched.has(lot.id)} onSelect={setSelectedLot} onWatch={handleWatch} />)}</div> : <div className="empty-state"><span className="empty-icon"><Search size={23} /></span><h3>{filter === 'watchlist' ? 'Your watchlist is waiting.' : 'Nothing here just yet.'}</h3><p>{filter === 'watchlist' ? 'Save a lot to keep an eye on it.' : 'Try another category or check back soon.'}</p><button className="text-button" onClick={() => { setSelectedCategory('all'); setFilter('live'); }}>Browse all live lots <ArrowRight size={15} /></button></div>}
          <div className="browse-footer"><span>Showing {visibleLots.length} {visibleLots.length === 1 ? 'lot' : 'lots'}{!apiOnline && <i> · curated preview</i>}</span><button onClick={() => openAuth('signup')}>Sell something with a story <ArrowUpRight size={15} /></button></div>
        </section>

        <section className="editorial-band" id="how-it-works"><div className="editorial-image"><img src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1300&q=85" alt="A classic film camera ready for a new owner" /></div><div className="editorial-content"><div className="eyebrow"><span className="eyebrow-line" /> A clear way to bid</div><h2>Good finds.<br /><em>Fair play.</em></h2><p>Know the current price, the next bid and the exact closing time. Every bid is visible. If one lands in the final two minutes, the clock extends so everyone has a fair chance to respond.</p><div className="editorial-steps"><div><span>01</span><b>Find your lot</b><small>Check the condition, seller and closing clock.</small></div><div><span>02</span><b>Make your move</b><small>Meet the minimum bid and see it enter the history.</small></div><div><span>03</span><b>Win the find</b><small>The leading bidder gets the next chapter.</small></div></div><button className="text-button" onClick={() => openAuth('signup')}>Join the bidding room <ArrowRight size={16} /></button></div></section>

        <section className="closing-cta"><div className="closing-mark">L<span>.</span></div><div><p className="eyebrow">The room is open</p><h2>There’s a good one<br /><em>on the block.</em></h2></div><button className="button button-light" onClick={scrollToLots}>Make your move <ArrowUpRight size={16} /></button><span className="closing-flower">✳</span></section>
      </main>

      <footer className="site-footer"><a className="brand footer-brand" href="#top"><span className="brand-mark">L</span><span>lotline<span className="brand-period">.</span></span></a><span>Good things, kept in circulation.</span><span>Thoughtfully made for the next chapter <span className="footer-heart">♥</span></span><span>© {new Date().getFullYear()} Lotline</span></footer>
      {selectedLot && <LotModal lot={selectedLot} onClose={() => setSelectedLot(null)} onBid={handleBid} user={user} apiOnline={apiOnline} onSignIn={() => { setSelectedLot(null); openAuth('login'); }} watched={watched.has(selectedLot.id)} onWatch={() => handleWatch(selectedLot)} toast={toast} />}
      {authOpen && <AuthModal mode={authMode} setMode={setAuthMode} onClose={() => setAuthOpen(false)} onSuccess={handleAuth} apiOnline={apiOnline} />}
      {listingOpen && <ListingModal onClose={() => setListingOpen(false)} onCreate={handleCreate} busy={listingBusy} error={listingError} />}
      <Toast message={toastMessage} onClose={closeToast} />
    </div>
  );
}
