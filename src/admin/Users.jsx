import { useEffect, useState } from 'react';
import { api, useApi } from '../backend';
import { useAuth } from './AdminApp';

/* ---------- Admin only: staff accounts ---------- */
const NEW_USER = { name: '', email: '', role: 'employee', password: '' };

export function UsersAdmin() {
  const { user: me, onAuthError } = useAuth();
  const { data, error, reload } = useApi('/admin/users');
  const [f, setF] = useState(NEW_USER);
  const [formError, setFormError] = useState('');
  const [flash, setFlash] = useState('');

  useEffect(() => {
    if (error) onAuthError(error);
  }, [error, onAuthError]);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const create = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const u = await api('/admin/users', { method: 'POST', body: f });
      setF(NEW_USER);
      setFlash(`Account created for ${u.name}. Share the email and password with them privately.`);
      reload();
    } catch (err) {
      onAuthError(err);
      setFormError(err.message);
    }
  };

  const update = async (u, body, message) => {
    try {
      await api(`/admin/users/${u.id}`, { method: 'PATCH', body });
      setFlash(message);
      reload();
    } catch (err) {
      onAuthError(err);
      window.alert(err.message);
    }
  };

  const resetPassword = (u) => {
    const password = window.prompt(`New password for ${u.name} (at least 8 characters):`);
    if (password) update(u, { password }, `Password changed for ${u.name}. They have been logged out everywhere.`);
  };

  return (
    <section className="apage">
      <header className="apage__head">
        <div>
          <h1>Staff accounts</h1>
          <p>
            <strong>Admins</strong> can do everything, including reviews and staff accounts. <strong>Employees</strong> can
            write blog posts and edit their own posts.
          </p>
        </div>
      </header>

      {flash && (
        <p className="aflash" role="status">
          {flash}
          <button onClick={() => setFlash('')} aria-label="Dismiss">
            ×
          </button>
        </p>
      )}
      {error && <p className="bf__fail">{error.message}</p>}

      <ul className="alist">
        {data?.map((u) => (
          <li key={u.id} className={`alist__row ${u.active ? '' : 'is-hidden'}`}>
            <span className="rcard__avatar" aria-hidden="true">
              {u.name[0]?.toUpperCase()}
            </span>
            <div className="alist__main">
              <strong>
                {u.name} {u.id === me.id && <em className="amuted">(you)</em>}
              </strong>
              <span>
                <span className={`badge badge--${u.role}`}>{u.role === 'admin' ? 'Admin' : 'Employee'}</span>
                {!u.active && <span className="badge badge--hidden">Disabled</span>}
                {u.email}
              </span>
            </div>
            {u.id !== me.id && (
              <div className="alist__actions">
                <button
                  className="abtn"
                  onClick={() =>
                    update(u, { role: u.role === 'admin' ? 'employee' : 'admin' }, `${u.name} is now ${u.role === 'admin' ? 'an employee' : 'an admin'}.`)
                  }
                >
                  Make {u.role === 'admin' ? 'employee' : 'admin'}
                </button>
                <button className="abtn" onClick={() => resetPassword(u)}>
                  Reset password
                </button>
                <button
                  className={`abtn ${u.active ? 'abtn--danger' : ''}`}
                  onClick={() => update(u, { active: !u.active }, `${u.name} has been ${u.active ? 'disabled' : 'enabled'}.`)}
                >
                  {u.active ? 'Disable' : 'Enable'}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <form className="aform aform--card" onSubmit={create}>
        <h2>Add a staff member</h2>
        {formError && <p className="bf__fail">{formError}</p>}
        <div className="bf__row">
          <label className="bf__field">
            <span className="bf__label">Name</span>
            <input value={f.name} onChange={set('name')} required />
          </label>
          <label className="bf__field">
            <span className="bf__label">Email (used to log in)</span>
            <input type="email" value={f.email} onChange={set('email')} required autoComplete="off" />
          </label>
        </div>
        <div className="bf__row">
          <label className="bf__field">
            <span className="bf__label">Access</span>
            <select value={f.role} onChange={set('role')}>
              <option value="employee">Employee — blog posts only</option>
              <option value="admin">Admin — full access</option>
            </select>
          </label>
          <label className="bf__field">
            <span className="bf__label">Temporary password</span>
            <input type="text" value={f.password} onChange={set('password')} required minLength={8} autoComplete="new-password" />
          </label>
        </div>
        <div className="aform__actions">
          <button className="btn btn--navy">Create account</button>
        </div>
      </form>
    </section>
  );
}

/* ---------- Everyone: change own password ---------- */
export function Account() {
  const { user, onAuthError } = useAuth();
  const [f, setF] = useState({ current: '', next: '', confirm: '' });
  const [msg, setMsg] = useState({ ok: '', error: '' });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (f.next !== f.confirm) return setMsg({ ok: '', error: 'The new passwords do not match.' });
    try {
      await api('/auth/password', { method: 'POST', body: { current: f.current, next: f.next } });
      setF({ current: '', next: '', confirm: '' });
      setMsg({ ok: 'Password changed.', error: '' });
    } catch (err) {
      onAuthError(err);
      setMsg({ ok: '', error: err.message });
    }
  };

  return (
    <section className="apage">
      <header className="apage__head">
        <div>
          <h1>My account</h1>
          <p>
            {user.name} · {user.email} · {user.role === 'admin' ? 'Admin' : 'Employee'}
          </p>
        </div>
      </header>
      <form className="aform aform--card aform--narrow" onSubmit={submit}>
        <h2>Change password</h2>
        {msg.error && <p className="bf__fail">{msg.error}</p>}
        {msg.ok && <p className="aflash">{msg.ok}</p>}
        <label className="bf__field">
          <span className="bf__label">Current password</span>
          <input type="password" value={f.current} onChange={set('current')} required autoComplete="current-password" />
        </label>
        <label className="bf__field">
          <span className="bf__label">New password (8+ characters)</span>
          <input type="password" value={f.next} onChange={set('next')} required minLength={8} autoComplete="new-password" />
        </label>
        <label className="bf__field">
          <span className="bf__label">Confirm new password</span>
          <input type="password" value={f.confirm} onChange={set('confirm')} required minLength={8} autoComplete="new-password" />
        </label>
        <div className="aform__actions">
          <button className="btn btn--navy">Update password</button>
        </div>
      </form>
    </section>
  );
}
