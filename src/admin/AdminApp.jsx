import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { BRAND } from '../data';
import { api } from '../backend';
import { Icon } from '../components/ui';
import { PostEditor, PostsList } from './Posts';
import ReviewsAdmin from './ReviewsAdmin';
import { Account, UsersAdmin } from './Users';
import './admin.css';

/* ---------- Logged-in staff member ---------- */
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = checking, null = logged out

  useEffect(() => {
    api('/auth/me').then(setUser, () => setUser(null));
  }, []);

  const login = useCallback(async (email, password) => {
    setUser(await api('/auth/login', { method: 'POST', body: { email, password } }));
  }, []);

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
  }, []);

  // A 401 from any admin request means the session expired
  const onAuthError = useCallback((err) => {
    if (err?.status === 401) setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, login, logout, onAuthError }}>{children}</AuthContext.Provider>;
}

/* ---------- Login ---------- */
function Login() {
  const { user, login } = useAuth();
  const { state } = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={state?.from || '/admin'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <main className="alogin">
      <form className="alogin__card" onSubmit={submit}>
        <img src={BRAND.logo} alt="" width="56" height="56" />
        <h1>Staff login</h1>
        <p>The Mirrors Dermatology Clinic</p>
        <label className="bf__field">
          <span className="bf__label">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required autoFocus />
        </label>
        <label className="bf__field">
          <span className="bf__label">Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <p className="bf__fail">{error}</p>}
        <button className="btn btn--navy" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <Link to="/" className="alogin__back">
          ← Back to website
        </Link>
      </form>
    </main>
  );
}

/* ---------- Layout for logged-in staff ---------- */
function Layout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);

  useEffect(() => setMenu(false), [pathname]);

  if (user === undefined) return <p className="admin-loading">Loading…</p>;
  if (!user) return <Navigate to="/admin/login" replace state={{ from: pathname }} />;

  const isAdmin = user.role === 'admin';
  const links = [
    { to: '/admin', label: 'Blog posts', icon: 'plan', end: true },
    { to: '/admin/posts/new', label: 'Write a post', icon: 'plus' },
    ...(isAdmin
      ? [
          { to: '/admin/reviews', label: 'Reviews', icon: 'chat' },
          { to: '/admin/users', label: 'Staff accounts', icon: 'shield' },
        ]
      : []),
    { to: '/admin/account', label: 'My account', icon: 'check' },
  ];

  return (
    <div className="admin">
      <aside className={`admin__side ${menu ? 'is-open' : ''}`}>
        <Link to="/admin" className="admin__brand">
          <img src={BRAND.logoWhite} alt="" width="36" height="36" />
          <span>
            The Mirrors
            <small>Staff area</small>
          </span>
        </Link>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              <Icon name={l.icon} size={18} /> {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin__me">
          <strong>{user.name}</strong>
          <span>{isAdmin ? 'Admin' : 'Employee'}</span>
          <div>
            <a href="/" target="_blank" rel="noreferrer">
              View website
            </a>
            <button
              onClick={async () => {
                await logout();
                navigate('/admin/login');
              }}
            >
              Log out
            </button>
          </div>
        </div>
      </aside>
      <div className="admin__main">
        <header className="admin__bar">
          <button className="admin__menu" onClick={() => setMenu((m) => !m)} aria-label="Menu" aria-expanded={menu}>
            <Icon name={menu ? 'close' : 'menu'} size={22} />
          </button>
          <span>Staff area</span>
        </header>
        <Outlet />
      </div>
    </div>
  );
}

function AdminOnly({ children }) {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/admin" replace />;
}

export default function AdminApp() {
  // Keep the staff area out of search engines
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    document.title = 'Staff area — The Mirrors';
    document.documentElement.classList.add('is-ready');
    return () => meta.remove();
  }, []);

  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route element={<Layout />}>
          <Route index element={<PostsList />} />
          <Route path="posts/new" element={<PostEditor />} />
          <Route path="posts/:id" element={<PostEditor />} />
          <Route path="reviews" element={<AdminOnly><ReviewsAdmin /></AdminOnly>} />
          <Route path="users" element={<AdminOnly><UsersAdmin /></AdminOnly>} />
          <Route path="account" element={<Account />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
