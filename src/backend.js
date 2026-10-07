/*
 * Talks to the Node API in /server (same origin; Vite proxies /api in development).
 */
import { useCallback, useEffect, useState } from 'react';
import STARTER_POSTS from '../server/seed-posts.json';
import { GOOGLE } from './data';

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
    throw Object.assign(new Error('Can’t reach the server. Please check your connection and try again.'), { status: 0, offline: true });
  }
  // A host without the Node server (e.g. static-only hosting) answers with HTML or a bare 404
  if (!(res.headers.get('content-type') || '').includes('application/json')) throw unavailable();
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong. Please try again.'), { status: res.status, code: data.code });
  return data;
}

const unavailable = () =>
  Object.assign(new Error('This feature is temporarily unavailable. Please try again later, or call us.'), {
    status: 503,
    offline: true,
  });

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

/*
 * Blog posts. If the server can't be reached (e.g. the site is on static hosting
 * without the Node server), fall back to the starter articles bundled with the site.
 */
const readTime = (body) => `${Math.max(1, Math.round(body.split(/\s+/).length / 200))} min read`;
const BUILT_IN_POSTS = STARTER_POSTS.map((p) => ({ ...p, id: p.slug, status: 'published', readTime: readTime(p.body) }));

export function usePosts() {
  const r = useApi('/posts');
  return r.error?.offline ? { ...r, data: BUILT_IN_POSTS, error: null } : r;
}

export function usePost(slug) {
  const r = useApi(`/posts/${encodeURIComponent(slug)}`);
  if (!r.error?.offline) return r;
  const post = BUILT_IN_POSTS.find((p) => p.slug === slug);
  return post
    ? { ...r, data: post, error: null }
    : { ...r, error: Object.assign(new Error('Article not found.'), { status: 404 }) };
}

/*
 * Google rating: live from the server when GOOGLE_PLACES_API_KEY is set, otherwise the
 * figures entered by hand in GOOGLE (src/data/site.js), otherwise nothing.
 */
let googleCache;
export function useGoogle() {
  const manual = GOOGLE.rating
    ? { rating: GOOGLE.rating, count: GOOGLE.count, checkedAt: GOOGLE.checkedOn, url: GOOGLE.listingUrl, reviewUrl: GOOGLE.reviewUrl, reviews: [] }
    : null;
  const [live, setLive] = useState(googleCache);
  useEffect(() => {
    if (googleCache !== undefined) return;
    let on = true;
    api('/google').then(
      (d) => {
        googleCache = d;
        if (on) setLive(d);
      },
      () => {
        googleCache = null;
        if (on) setLive(null);
      }
    );
    return () => {
      on = false;
    };
  }, []);
  const g = live || manual;
  // Always have somewhere to send people to review us
  return { ...g, url: g?.url || GOOGLE.listingUrl, reviewUrl: g?.reviewUrl || GOOGLE.reviewUrl, has: !!g?.rating };
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
