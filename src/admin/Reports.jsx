import { useEffect, useState } from 'react';
import { BRAND, CONTACT, DOCTOR, HOURS } from '../data';
import { useApi } from '../backend';
import { Icon } from '../components/ui';
import { RefreshButton, useAuth } from './AdminApp';
import {
  PatientReportModal,
  ReopenVisitDialog,
  VisitBadge,
  buildPdfFromCanvases,
  drawClinicPageFooter,
  drawClinicPageHeader,
  generateIndividualPatientPdf,
  loadImage,
} from './PatientModals';

const PERIODS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'today', label: 'Today' },
  { value: 'all', label: 'All' },
  { value: 'custom', label: 'Custom dates' },
];

const STATUSES = [
  { value: 'all', label: 'All statuses' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'new', label: 'New (Pending)' },
  { value: 'done', label: 'Visited (Done)' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_LABEL = {
  new: 'New (Pending)',
  confirmed: 'Confirmed',
  done: 'Visited',
  cancelled: 'Cancelled',
};

const fmtDate = (iso) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const fmtDob = (iso) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

function truncateText(ctx, text, maxW) {
  const s = String(text || '');
  if (ctx.measureText(s).width <= maxW) return s;
  let out = s;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxW) {
    out = out.slice(0, -1);
  }
  return `${out}…`;
}

/* ---------- Multi-page All-Appointments PDF generator with Clinic Header & Footer on every page ---------- */
async function generateReportPdf({ items, summary, periodLabel, statusLabel }) {
  const logo = await loadImage(BRAND.logo);
  const W = 1240;
  const H = 1754; // A4 @ 150 DPI
  const M = 64;
  const ROWS_PER_PAGE = 14;
  const totalPages = Math.max(1, Math.ceil(items.length / ROWS_PER_PAGE));
  const generatedOn = new Date().toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const canvases = [];

  for (let p = 0; p < totalPages; p++) {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    let y = drawClinicPageHeader(ctx, logo, W, M);

    // Report title & metadata band
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(M, y, W - M * 2, 64);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(M, y, W - M * 2, 64);

    ctx.fillStyle = '#13335e';
    ctx.font = 'bold 19px Georgia, serif';
    ctx.fillText('APPOINTMENTS REPORT', M + 16, y + 26);

    ctx.fillStyle = '#475569';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(`Filter: ${periodLabel} · ${statusLabel}`, M + 16, y + 48);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#13335e';
    ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(
      `Total: ${summary.total}  |  Confirmed: ${summary.confirmed}  |  Pending: ${summary.new}  |  Visited: ${summary.done}  |  Paid: Rs. ${(summary.revenue || 0).toLocaleString('en-IN')}`,
      W - M - 16,
      y + 26
    );
    ctx.fillStyle = '#64748b';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(`Generated on ${generatedOn} · Page ${p + 1} of ${totalPages}`, W - M - 16, y + 48);
    ctx.textAlign = 'left';

    y += 80;

    /* ---------- TABLE HEADER ---------- */
    const cols = [
      { label: '#', x: M, w: 38 },
      { label: 'REF ID & VISIT', x: M + 38, w: 132 },
      { label: 'DATE & TIME', x: M + 170, w: 190 },
      { label: 'PATIENT & CONTACT', x: M + 360, w: 230 },
      { label: 'DIAGNOSIS / TREATMENT', x: M + 590, w: 290 },
      { label: 'AMOUNT', x: M + 880, w: 115 },
      { label: 'STATUS', x: M + 995, w: 117 },
    ];

    ctx.fillStyle = '#13335e';
    ctx.fillRect(M, y, W - M * 2, 38);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    cols.forEach((c) => {
      ctx.fillText(c.label, c.x + 8, y + 24);
    });
    y += 38;

    /* ---------- TABLE ROWS ---------- */
    const pageItems = items.slice(p * ROWS_PER_PAGE, (p + 1) * ROWS_PER_PAGE);
    const rowH = 82;

    if (pageItems.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No appointments match the selected filters.', W / 2, y + 80);
      ctx.textAlign = 'left';
    } else {
      pageItems.forEach((r, idx) => {
        const rowNum = p * ROWS_PER_PAGE + idx + 1;
        ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        ctx.fillRect(M, y, W - M * 2, rowH);

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(M, y + rowH);
        ctx.lineTo(W - M, y + rowH);
        ctx.stroke();

        // #
        ctx.fillStyle = '#64748b';
        ctx.font = '12.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText(String(rowNum), cols[0].x + 8, y + 32);

        // Ref ID & Visit Type
        ctx.fillStyle = '#13335e';
        ctx.font = 'bold 12.5px monospace';
        ctx.fillText(r.ref || '—', cols[1].x + 8, y + 30);
        ctx.fillStyle = r.visitType === 'revisit' ? '#1c7584' : '#64748b';
        ctx.font = '600 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        const vLabel =
          r.visitType === 'revisit'
            ? `Revisit #${r.visitNumber || 2}`
            : r.visitType === 'rescheduled_first'
              ? '1st (Reopened)'
              : '1st Visit';
        ctx.fillText(vLabel, cols[1].x + 8, y + 52);

        // Date & Time
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 13.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText(fmtDate(r.date), cols[2].x + 8, y + 30);
        ctx.fillStyle = '#2a9db0';
        ctx.font = '600 12.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText(r.time || '—', cols[2].x + 8, y + 52);

        // Patient Name & Contact
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 13.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText(truncateText(ctx, r.name, cols[3].w - 14), cols[3].x + 8, y + 30);
        ctx.fillStyle = '#475569';
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText(truncateText(ctx, `${r.phone || '—'}${r.dob ? ` · DOB ${fmtDob(r.dob)}` : ''}`, cols[3].w - 14), cols[3].x + 8, y + 52);

        // Diagnosis / Treatment
        ctx.fillStyle = '#1e293b';
        ctx.font = '600 12.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText(
          truncateText(ctx, r.diagnosis || r.concern || 'General consultation', cols[4].w - 14),
          cols[4].x + 8,
          y + 30
        );
        const subText = r.treatments || r.pain || r.note || '';
        if (subText) {
          ctx.fillStyle = '#64748b';
          ctx.font = '11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.fillText(truncateText(ctx, subText, cols[4].w - 14), cols[4].x + 8, y + 52);
        }

        // Amount Paid
        const paid = Number(r.amountPaid) || 0;
        ctx.fillStyle = paid > 0 ? '#13335e' : '#94a3b8';
        ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText(paid > 0 ? `Rs. ${paid.toLocaleString('en-IN')}` : '—', cols[5].x + 8, y + 32);
        if (paid > 0) {
          ctx.fillStyle = '#64748b';
          ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.fillText(r.paymentMode || 'UPI', cols[5].x + 8, y + 52);
        }

        // Status badge
        const stColors = {
          confirmed: { bg: '#e3f3e8', fg: '#23784a' },
          new: { bg: '#fff3d6', fg: '#8a6420' },
          done: { bg: '#e6f4f6', fg: '#1c7584' },
          cancelled: { bg: '#f6e5e4', fg: '#b0413e' },
        }[r.status] || { bg: '#f1f5f9', fg: '#475569' };

        ctx.fillStyle = stColors.bg;
        ctx.fillRect(cols[6].x + 8, y + 18, 92, 26);
        ctx.fillStyle = stColors.fg;
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText((STATUS_LABEL[r.status] || r.status).split(' ')[0].toUpperCase(), cols[6].x + 15, y + 35);

        y += rowH;
      });
    }

    drawClinicPageFooter(
      ctx,
      W,
      H,
      M,
      p + 1,
      totalPages,
      'Confidential clinic appointment report — for authorised staff use only.'
    );

    canvases.push(canvas);
  }

  return buildPdfFromCanvases(canvases);
}

export default function Reports() {
  const { onAuthError } = useAuth();
  const [period, setPeriod] = useState('upcoming');
  const [status, setStatus] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [q, setQ] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [reportTarget, setReportTarget] = useState(null); // individual patient report modal
  const [reopenTarget, setReopenTarget] = useState(null); // reopen / revisit modal
  const [flash, setFlash] = useState('');

  const query = new URLSearchParams({
    period,
    status,
    ...(period === 'custom' && from ? { from } : {}),
    ...(period === 'custom' && to ? { to } : {}),
    ...(q.trim() ? { q: q.trim() } : {}),
  }).toString();

  const { data, error, loading, refreshing, reload } = useApi(`/admin/reports?${query}`);

  useEffect(() => {
    if (error) onAuthError(error);
  }, [error, onAuthError]);

  const items = data?.items || [];
  const summary = data?.summary || { total: 0, confirmed: 0, new: 0, done: 0, cancelled: 0, revisits: 0, revenue: 0 };

  const periodLabel =
    period === 'custom'
      ? `Custom (${from || 'start'} to ${to || 'end'})`
      : PERIODS.find((p) => p.value === period)?.label || 'All';
  const statusLabel = STATUSES.find((s) => s.value === status)?.label || 'All statuses';

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const blob = await generateReportPdf({ items, summary, periodLabel, statusLabel });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `the-mirrors-appointments-report-${period}-${dateStamp}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      window.alert(err.message || 'Could not generate PDF.');
    }
    setDownloading(false);
  };

  const downloadOnePatientPdf = async (r) => {
    setDownloadingId(r.id);
    try {
      const blob = await generateIndividualPatientPdf(r);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = String(r.name || 'patient')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      a.href = url;
      a.download = `the-mirrors-patient-report-${r.ref || r.id}-${safeName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      window.alert(err.message || 'Could not generate patient PDF.');
    }
    setDownloadingId(null);
  };

  return (
    <section className="apage areport areport--compact">
      {/* Single-line command bar: Refresh · Title · Stats · Actions */}
      <div className="areport__cmdbar no-print">
        <RefreshButton onRefresh={reload} refreshing={refreshing} loading={loading} />
        <span className="areport__cmdbar-title">Reports</span>
        <div className="astats-mini" aria-label="Report summary">
          <span className="astat-pill">Total <strong>{summary.total}</strong></span>
          <span className="astat-pill astat-pill--confirmed">Confirmed <strong>{summary.confirmed}</strong></span>
          <span className="astat-pill astat-pill--new">Pending <strong>{summary.new}</strong></span>
          <span className="astat-pill astat-pill--done">Visited <strong>{summary.done}</strong></span>
          <span className="astat-pill">Revisits <strong>{summary.revisits || 0}</strong></span>
          <span className="astat-pill">Cancelled <strong>{summary.cancelled}</strong></span>
          {summary.revenue > 0 && (
            <span className="astat-pill astat-pill--paid">Paid <strong>₹{summary.revenue.toLocaleString('en-IN')}</strong></span>
          )}
        </div>
        <div className="areport__cmdbar-btns">
          <button className="abtn" onClick={() => window.print()} disabled={!items.length}>
            <Icon name="printer" size={13} /> Print
          </button>
          <a
            className={`abtn${!items.length ? ' abtn--disabled' : ''}`}
            href={items.length ? `/api/admin/reports/export?${query}` : undefined}
            download
            aria-disabled={!items.length}
          >
            <Icon name="download" size={13} /> Export Excel
          </a>
          <button className="abtn abtn--primary" onClick={downloadPdf} disabled={downloading || loading}>
            <Icon name="download" size={13} /> {downloading ? '…' : 'Download PDF'}
          </button>
        </div>
      </div>

      {flash && (
        <p className="aflash no-print" role="status">
          {flash}
          <button onClick={() => setFlash('')} aria-label="Dismiss">
            ×
          </button>
        </p>
      )}

      {/* Single-Row Compact Filter Bar */}
      <div className="areport__bar no-print">
        <div className="filters filters--compact" role="tablist" aria-label="Report period">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              role="tab"
              aria-selected={period === p.value}
              className={period === p.value ? 'is-on' : ''}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="areport__dates">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
            <span>to</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
          </div>
        )}

        <select
          className="areport__select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <input
          type="search"
          className="areport__search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Ref ID (MD-...), patient name, phone, diagnosis…"
          aria-label="Search report"
        />
      </div>

      {loading && !data && <p className="state">Loading report…</p>}
      {error && <p className="bf__fail">{error.message}</p>}

      {/* Report Sheet (immediately visible without scrolling) */}
      <div className="rprint rprint--compact">
        <header className="rprint__head rprint__head--compact">
          <div className="rprint__brand">
            <img src={BRAND.logo} alt="" width="40" height="40" />
            <div>
              <h2>{BRAND.full}</h2>
              <p className="rprint__doc">
                <strong>{DOCTOR.name}</strong> · {DOCTOR.qualifications[0]} · Reg. {DOCTOR.registration}
              </p>
            </div>
          </div>
          <div className="rprint__contact">
            <p>
              {CONTACT.address}, {CONTACT.area} · Tel: {CONTACT.phone}
            </p>
            <p>
              <strong>{periodLabel}</strong> · {statusLabel} ({summary.total} records)
            </p>
          </div>
        </header>

        {items.length === 0 ? (
          <p className="state">No appointments match the selected filters.</p>
        ) : (
          <div className="rtable-wrap">
            <table className="rtable">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Ref ID &amp; Visit</th>
                  <th>Date &amp; Time</th>
                  <th>Patient &amp; Contact</th>
                  <th>Diagnosis / Treatment / Meds</th>
                  <th>Amount Paid</th>
                  <th>Status</th>
                  <th className="no-print">Individual Report &amp; Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td>
                      <code className="aref">{r.ref}</code>
                      <div className="rtable__badges">
                        <VisitBadge r={r} onOpenHistory={(item) => setReportTarget(item)} />
                      </div>
                    </td>
                    <td>
                      <strong>{fmtDate(r.date)}</strong>
                      <span>{r.time}</span>
                    </td>
                    <td>
                      <strong>{r.name}</strong>
                      <span>{r.phone || '—'}</span>
                      {r.dob && <small>DOB: {fmtDob(r.dob)}</small>}
                    </td>
                    <td>
                      <strong>{r.diagnosis || r.concern || 'General consultation'}</strong>
                      {r.pain && <small>Pain/Symptoms: {r.pain}</small>}
                      {r.treatments && <small>Tx: {r.treatments}</small>}
                      {r.medicinesList?.length > 0 && (
                        <small className="rtable__meds">
                          ℞ {r.medicinesList.map((m) => m.name).join(', ')}
                        </small>
                      )}
                      {r.note && <small>Note: {r.note}</small>}
                    </td>
                    <td>
                      {Number(r.amountPaid) > 0 ? (
                        <>
                          <strong>₹{Number(r.amountPaid).toLocaleString('en-IN')}</strong>
                          <small>
                            {r.paymentMode || 'UPI'} · {r.paymentStatus || 'paid'}
                          </small>
                        </>
                      ) : (
                        <span className="amuted">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge--st-${r.status}`}>{STATUS_LABEL[r.status] || r.status}</span>
                    </td>
                    <td className="no-print">
                      <div className="rtable__actions">
                        <button
                          type="button"
                          className="abtn abtn--primary"
                          onClick={() => setReportTarget(r)}
                          title="Edit or generate individual patient clinical report, medicines & billing"
                        >
                          Patient Report / ℞
                        </button>
                        <button
                          type="button"
                          className="abtn"
                          onClick={() => downloadOnePatientPdf(r)}
                          disabled={downloadingId === r.id}
                          title="Download individual patient PDF report"
                        >
                          <Icon name="download" size={14} /> {downloadingId === r.id ? '…' : 'PDF'}
                        </button>
                        <button
                          type="button"
                          className="abtn"
                          onClick={() => setReopenTarget(r)}
                          title="Add existing customer revisit or reopen as 1st appointment with same ID"
                        >
                          Reopen / Revisit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="rprint__foot">
          <div>
            <strong>{BRAND.full}</strong> · {CONTACT.address}, {CONTACT.area} · Phone: {CONTACT.phone} · Hours:{' '}
            {HOURS[0].day}, {HOURS[0].time}
          </div>
          <div className="rprint__foot-right">
            <span>{BRAND.domain.replace('https://', '')}</span>
          </div>
        </footer>
      </div>

      {reportTarget && (
        <PatientReportModal
          request={reportTarget}
          onClose={() => setReportTarget(null)}
          onSaved={(message) => {
            setFlash(message);
            reload();
          }}
        />
      )}

      {reopenTarget && (
        <ReopenVisitDialog
          request={reopenTarget}
          onClose={() => setReopenTarget(null)}
          onSaved={(message) => {
            setFlash(message);
            reload();
          }}
        />
      )}
    </section>
  );
}
