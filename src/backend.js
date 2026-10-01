/*
 * Talks to the Node API in /server (same origin; Vite proxies /api in development).
 */
import { useCallback, useEffect, useState } from 'react';

export async function api(path, { method = 'GET', body, form } = {}) {
  const init = { method, credentials: 'same-origin', headers: {} };
  if (form) init.body = form;
  else if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(`/api${path}`, init);
  } catch {
    throw Object.assign(new Error('Can’t reach the server. Please check your connection and try again.'), { status: 0 });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong. Please try again.'), { status: res.status });
  return data;
}

/** Fetch JSON for a component: { data, error, loading, reload } */
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!path) return;
    let live = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    api(path).then(
      (data) => live && setState({ data, error: null, loading: false }),
      (error) => live && setState({ data: null, error, loading: false })
    );
    return () => {
      live = false;
    };
  }, [path, n]);
  const reload = useCallback(() => setN((x) => x + 1), []);
  return { ...state, reload };
}

/* The review score is shown in several places (page banners, reviews page) */
let summaryCache = null;
export function useReviewSummary() {
  const [summary, setSummary] = useState(summaryCache);
  useEffect(() => {
    if (summaryCache) return;
    let live = true;
    api('/reviews/summary').then((s) => {
      summaryCache = s;
      if (live) setSummary(s);
    }, () => {});
    return () => {
      live = false;
    };
  }, []);
  return summary;
}
export const invalidateReviewSummary = () => {
  summaryCache = null;
};

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
