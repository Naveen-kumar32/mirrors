import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BRAND, CONTACT, DOCTOR, HOURS, SERVICES } from '../data';
import { api, useApi } from '../backend';
import { Icon } from '../components/ui';
import { confirmationMessage, smsTo, whatsappTo } from './messages';
import { useAuth } from './AdminApp';

export const VISIT_TYPE_LABEL = {
  first: '1st Visit',
  revisit: 'Revisit',
  rescheduled_first: '1st Visit (Reopened)',
};

export function VisitBadge({ r, onOpenHistory }) {
  const vt = r.visitType || 'first';
  const vNum = Number(r.visitNumber) || 1;
  const label =
    vt === 'revisit'
      ? `Revisit #${vNum}`
      : vt === 'rescheduled_first'
        ? '1st Visit · Reopened'
        : '1st Visit';

  return (
    <>
      <span className={`badge badge--vt-${vt}`} title="Visit classification">
        {label}
      </span>
      {r.visitCount > 1 && (
        <button
          type="button"
          className="badge badge--linked"
          onClick={(e) => {
            e.stopPropagation();
            onOpenHistory?.(r);
          }}
          title={`View all ${r.visitCount} visits linked to ${r.ref}`}
        >
          🔗 {r.visitCount} visits
        </button>
      )}
    </>
  );
}

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

/* ---------- Shared Canvas-to-PDF helpers ---------- */
function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function buildPdfFromCanvases(canvases) {
  const enc = new TextEncoder();
  const chunks = [];
  let offset = 0;
  const pushStr = (s) => {
    const b = enc.encode(s);
    chunks.push(b);
    offset += b.length;
  };
  const pushBytes = (b) => {
    chunks.push(b);
    offset += b.length;
  };

  const pageCount = canvases.length;
  const totalObjs = 2 + pageCount * 3;
  const offsets = new Array(totalObjs + 1).fill(0);

  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  offsets[1] = offset;
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  const kids = canvases.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
  offsets[2] = offset;
  pushStr(`2 0 obj\n<< /Type /Pages /Kids [ ${kids} ] /Count ${pageCount} >>\nendobj\n`);

  const ptW = 595.28;
  const ptH = 841.89;

  canvases.forEach((canvas, i) => {
    const pageObj = 3 + i * 3;
    const contentObj = 4 + i * 3;
    const imgObj = 5 + i * 3;
    const jpeg = dataUrlToBytes(canvas.toDataURL('image/jpeg', 0.92));

    offsets[pageObj] = offset;
    pushStr(
      `${pageObj} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [ 0 0 ${ptW} ${ptH} ] /Resources << /XObject << /Im0 ${imgObj} 0 R >> >> /Contents ${contentObj} 0 R >>\nendobj\n`
    );

    const stream = `q\n${ptW} 0 0 ${ptH} 0 0 cm\n/Im0 Do\nQ\n`;
    offsets[contentObj] = offset;
    pushStr(`${contentObj} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj\n`);

    offsets[imgObj] = offset;
    pushStr(
      `${imgObj} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`
    );
    pushBytes(jpeg);
    pushStr('\nendstream\nendobj\n');
  });

  const xrefStart = offset;
  pushStr(`xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`);
  for (let i = 1; i <= totalObjs; i++) {
    pushStr(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  }
  pushStr(`trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  return new Blob(chunks, { type: 'application/pdf' });
}

export function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapLines(ctx, text, maxWidth) {
  const paragraphs = String(text || '—').split('\n');
  const lines = [];
  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push('');
      continue;
    }
    let current = words[0];
    for (let i = 1; i < words.length; i++) {
      const test = `${current} ${words[i]}`;
      if (ctx.measureText(test).width <= maxWidth) {
        current = test;
      } else {
        lines.push(current);
        current = words[i];
      }
    }
    lines.push(current);
  }
  return lines.length ? lines : ['—'];
}

export function drawClinicPageHeader(ctx, logo, W, M) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, 1754);

  // Top brand bar
  ctx.fillStyle = '#13335e';
  ctx.fillRect(0, 0, W, 14);
  ctx.fillStyle = '#2a9db0';
  ctx.fillRect(0, 14, W, 4);

  let y = 40;
  if (logo) {
    ctx.drawImage(logo, M, y, 68, 68);
  }
  const hx = logo ? M + 84 : M;

  ctx.fillStyle = '#13335e';
  ctx.font = 'bold 27px Georgia, serif';
  ctx.fillText(BRAND.full.toUpperCase(), hx, y + 25);

  ctx.fillStyle = '#2a9db0';
  ctx.font = 'italic 14.5px Georgia, serif';
  ctx.fillText(BRAND.tagline, hx, y + 46);

  ctx.fillStyle = '#334155';
  ctx.font = '600 13.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(`${DOCTOR.name} · ${DOCTOR.qualifications[0]} · Reg. ${DOCTOR.registration}`, hx, y + 68);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#475569';
  ctx.font = '12.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(CONTACT.address, W - M, y + 18);
  ctx.fillText(CONTACT.area, W - M, y + 36);
  ctx.fillText(`Tel: ${CONTACT.phone}`, W - M, y + 54);
  ctx.fillText(CONTACT.email, W - M, y + 72);
  ctx.textAlign = 'left';

  y += 88;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(M, y);
  ctx.lineTo(W - M, y);
  ctx.stroke();

  return y + 16;
}

export function drawClinicPageFooter(ctx, W, H, M, pageNum, totalPages, subtitle = 'Confidential clinic record') {
  const fy = H - 92;
  ctx.strokeStyle = '#13335e';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(M, fy);
  ctx.lineTo(W - M, fy);
  ctx.stroke();

  ctx.fillStyle = '#13335e';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(`${BRAND.full} — ${CONTACT.address}, ${CONTACT.area}`, M, fy + 24);

  ctx.fillStyle = '#475569';
  ctx.font = '12.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(
    `Phone: ${CONTACT.phone}  ·  Email: ${CONTACT.email}  ·  Hours: ${HOURS[0].day}, ${HOURS[0].time}`,
    M,
    fy + 45
  );
  ctx.fillStyle = '#64748b';
  ctx.font = 'italic 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(subtitle, M, fy + 65);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#13335e';
  ctx.font = 'bold 13.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(`Page ${pageNum} of ${totalPages}`, W - M, fy + 24);
  ctx.fillStyle = '#2a9db0';
  ctx.font = '12.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(BRAND.domain.replace('https://', ''), W - M, fy + 45);
  ctx.textAlign = 'left';

  ctx.fillStyle = '#13335e';
  ctx.fillRect(0, H - 12, W, 12);
}

/* ---------- Individual Patient Clinical & Billing PDF Report Generator ---------- */
export async function generateIndividualPatientPdf(record) {
  const logo = await loadImage(BRAND.logo);
  const W = 1240;
  const H = 1754; // A4 @ 150 DPI
  const M = 64;
  const contentW = W - M * 2;

  const meds = Array.isArray(record.medicinesList) ? record.medicinesList.filter((m) => m.name?.trim()) : [];
  const MEDS_FIRST_PAGE = 7;
  const MEDS_NEXT_PAGE = 14;
  const extraMeds = Math.max(0, meds.length - MEDS_FIRST_PAGE);
  const totalPages = 1 + Math.ceil(extraMeds / MEDS_NEXT_PAGE);

  const canvases = [];

  for (let p = 0; p < totalPages; p++) {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    let y = drawClinicPageHeader(ctx, logo, W, M);

    // Document Title Banner
    ctx.fillStyle = '#13335e';
    ctx.fillRect(M, y, contentW, 46);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText('PATIENT CLINICAL CASE SHEET & BILLING REPORT', M + 18, y + 29);

    ctx.textAlign = 'right';
    ctx.font = 'bold 14px monospace';
    const vtLabel =
      record.visitType === 'revisit'
        ? `REVISIT #${record.visitNumber || 2}`
        : record.visitType === 'rescheduled_first'
          ? '1ST VISIT (REOPENED)'
          : '1ST VISIT';
    ctx.fillText(`REF ID: ${record.ref || '—'}  ·  ${vtLabel}`, W - M - 18, y + 29);
    ctx.textAlign = 'left';
    y += 60;

    // Patient Info Card (shown on every page for clear identification)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(M, y, contentW, 108);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(M, y, contentW, 108);

    const col1 = M + 20;
    const col2 = M + 410;
    const col3 = M + 780;

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('PATIENT NAME', col1, y + 24);
    ctx.fillText('MOBILE & EMAIL', col2, y + 24);
    ctx.fillText('APPOINTMENT DATE & TIME', col3, y + 24);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(record.name || '—', col1, y + 46);
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(`${record.phone || '—'}${record.email ? ` · ${record.email}` : ''}`, col2, y + 46);
    ctx.font = 'bold 14.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(`${fmtDate(record.date)} · ${record.time || '—'}`, col3, y + 46);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('DATE OF BIRTH', col1, y + 72);
    ctx.fillText('CONSULTATION FOR', col2, y + 72);
    ctx.fillText('NEXT FOLLOW-UP', col3, y + 72);

    ctx.fillStyle = '#1e293b';
    ctx.font = '13.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(fmtDob(record.dob), col1, y + 92);
    ctx.fillText(record.concern || 'General Consultation', col2, y + 92);
    ctx.fillStyle = '#2a9db0';
    ctx.font = 'bold 13.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(record.followUpDate ? fmtDate(record.followUpDate) : 'As advised', col3, y + 92);

    y += 126;

    const drawSectionBox = (title, content, minHeight = 76) => {
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      const lines = wrapLines(ctx, content || '—', contentW - 36).slice(0, 5);
      const boxH = Math.max(minHeight, 38 + lines.length * 22 + 12);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(M, y, contentW, boxH);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(M, y, contentW, boxH);

      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(M, y, contentW, 28);
      ctx.fillStyle = '#13335e';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(title, M + 14, y + 19);

      ctx.fillStyle = '#1e293b';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      lines.forEach((line, idx) => {
        ctx.fillText(line, M + 16, y + 50 + idx * 22);
      });

      y += boxH + 14;
    };

    if (p === 0) {
      // Clinical Assessment sections on Page 1
      drawSectionBox('1. PRESENTING COMPLAINT / PAIN & SYMPTOMS', record.pain || record.concern || '—', 78);
      drawSectionBox('2. CLINICAL DIAGNOSIS & FINDINGS', record.diagnosis || '—', 84);
      drawSectionBox('3. TREATMENTS / PROCEDURES PERFORMED OR ADVISED', record.treatments || record.concern || '—', 84);
    }

    // Prescribed Medicines Table
    const pageMeds =
      p === 0
        ? meds.slice(0, MEDS_FIRST_PAGE)
        : meds.slice(MEDS_FIRST_PAGE + (p - 1) * MEDS_NEXT_PAGE, MEDS_FIRST_PAGE + p * MEDS_NEXT_PAGE);

    ctx.fillStyle = '#13335e';
    ctx.fillRect(M, y, contentW, 34);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('℞  4. PRESCRIBED MEDICINES & SKINCARE REGIMEN', M + 14, y + 22);
    y += 34;

    const mCols = [
      { label: '#', x: M, w: 46 },
      { label: 'MEDICINE / PRODUCT NAME', x: M + 46, w: 390 },
      { label: 'DOSAGE / TIMING', x: M + 436, w: 260 },
      { label: 'DURATION', x: M + 696, w: 150 },
      { label: 'INSTRUCTIONS', x: M + 846, w: 266 },
    ];

    ctx.fillStyle = '#e6f4f6';
    ctx.fillRect(M, y, contentW, 30);
    ctx.fillStyle = '#13335e';
    ctx.font = 'bold 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    mCols.forEach((c) => ctx.fillText(c.label, c.x + 10, y + 20));
    y += 30;

    if (pageMeds.length === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(M, y, contentW, 44);
      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(M, y, contentW, 44);
      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 13.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText('No medicines recorded for this visit.', M + 16, y + 27);
      y += 44;
    } else {
      pageMeds.forEach((m, idx) => {
        const medNum = p === 0 ? idx + 1 : MEDS_FIRST_PAGE + (p - 1) * MEDS_NEXT_PAGE + idx + 1;
        const rH = 42;
        ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        ctx.fillRect(M, y, contentW, rH);
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(M, y, contentW, rH);

        ctx.fillStyle = '#64748b';
        ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText(String(medNum), mCols[0].x + 10, y + 26);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 13.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText(String(m.name || '').slice(0, 46), mCols[1].x + 10, y + 26);

        ctx.fillStyle = '#1e293b';
        ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText(String(m.dosage || '—').slice(0, 32), mCols[2].x + 10, y + 26);
        ctx.fillText(String(m.duration || '—').slice(0, 20), mCols[3].x + 10, y + 26);

        ctx.fillStyle = '#475569';
        ctx.fillText(String(m.notes || '—').slice(0, 34), mCols[4].x + 10, y + 26);
        y += rH;
      });
    }

    y += 16;

    // On the last page, draw Post-Care Advice, Billing Summary & Doctor Signature
    if (p === totalPages - 1) {
      drawSectionBox('5. POST-TREATMENT ADVICE & CLINICAL NOTES', record.advice || record.note || 'Follow prescribed skincare regimen and sun protection.', 74);

      // Billing & Payment Receipt Box + Doctor Signature side-by-side
      const billW = 620;
      const sigW = contentW - billW - 24;
      const boxH = 176;

      // Billing box
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(M, y, billW, boxH);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(M, y, billW, boxH);

      ctx.fillStyle = '#13335e';
      ctx.fillRect(M, y, billW, 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText('6. BILLING & PAYMENT SUMMARY', M + 14, y + 20);

      const cFee = Number(record.consultationFee) || 0;
      const tCost = Number(record.treatmentCost) || 0;
      const mCost = Number(record.medicineCost) || 0;
      const disc = Number(record.discount) || 0;
      const paid = Number(record.amountPaid) || 0;

      ctx.fillStyle = '#334155';
      ctx.font = '13.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(`Consultation Fee: Rs. ${cFee.toLocaleString('en-IN')}`, M + 18, y + 58);
      ctx.fillText(`Treatments / Procedures: Rs. ${tCost.toLocaleString('en-IN')}`, M + 18, y + 84);
      ctx.fillText(`Medicines / Skincare: Rs. ${mCost.toLocaleString('en-IN')}`, M + 310, y + 58);
      ctx.fillText(`Discount: - Rs. ${disc.toLocaleString('en-IN')}`, M + 310, y + 84);

      ctx.strokeStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(M + 18, y + 102);
      ctx.lineTo(M + billW - 18, y + 102);
      ctx.stroke();

      ctx.fillStyle = '#13335e';
      ctx.font = 'bold 17px Georgia, serif';
      ctx.fillText(`TOTAL AMOUNT PAID: Rs. ${paid.toLocaleString('en-IN')}`, M + 18, y + 132);

      ctx.fillStyle = '#23784a';
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      const pStatus = String(record.paymentStatus || 'paid').toUpperCase();
      ctx.fillText(`Mode: ${record.paymentMode || 'UPI'}  ·  Status: ${pStatus}`, M + 18, y + 158);

      // Doctor signature box
      const sx = M + billW + 24;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx, y, sigW, boxH);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(sx, y, sigW, boxH);

      ctx.fillStyle = '#64748b';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText('CONSULTANT DERMATOLOGIST', sx + 20, y + 28);

      ctx.strokeStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(sx + 20, y + 102);
      ctx.lineTo(sx + sigW - 20, y + 102);
      ctx.stroke();

      ctx.fillStyle = '#13335e';
      ctx.font = 'bold 15px Georgia, serif';
      ctx.fillText(DOCTOR.name, sx + 20, y + 126);
      ctx.fillStyle = '#334155';
      ctx.font = '12.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(`${DOCTOR.qualifications[0]} · Reg. ${DOCTOR.registration}`, sx + 20, y + 146);
      ctx.fillStyle = '#64748b';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText('Signature & Clinic Stamp', sx + 20, y + 164);
    }

    drawClinicPageFooter(
      ctx,
      W,
      H,
      M,
      p + 1,
      totalPages,
      `Patient Clinical Report · Ref: ${record.ref || '—'} · ${record.name || ''}`
    );

    canvases.push(canvas);
  }

  return buildPdfFromCanvases(canvases);
}

const PAIN_CHIPS = [
  'No pain (0/10)',
  'Mild pain / tenderness (2/10)',
  'Moderate pain (5/10)',
  'Severe pain (8/10)',
  'Itching / redness',
  'Active acne breakouts',
  'Pigmentation / dark spots',
  'Hair fall / thinning',
];

const EMPTY_MED = { name: '', dosage: '1-0-1 (After food)', duration: '15 days', notes: '' };

/* ---------- Individual Patient Clinical & Billing Report Modal ---------- */
export function PatientReportModal({ request: initialRequest, onClose, onSaved }) {
  const { onAuthError } = useAuth();
  const [activeReq, setActiveReq] = useState(initialRequest);
  const history = useApi(activeReq?.ref ? `/admin/patients/lookup?ref=${encodeURIComponent(activeReq.ref)}` : null);

  const buildForm = (r) => ({
    visitType: r.visitType || 'first',
    visitNumber: r.visitNumber || 1,
    concern: r.concern || '',
    pain: r.pain || '',
    diagnosis: r.diagnosis || '',
    treatments: r.treatments || r.concern || '',
    medicinesList:
      Array.isArray(r.medicinesList) && r.medicinesList.length
        ? r.medicinesList
        : [{ ...EMPTY_MED }],
    advice: r.advice || '',
    followUpDate: r.followUpDate || '',
    note: r.note || '',
    consultationFee: r.consultationFee ?? 500,
    treatmentCost: r.treatmentCost ?? 0,
    medicineCost: r.medicineCost ?? 0,
    discount: r.discount ?? 0,
    amountPaid: r.amountPaid ?? 500,
    paymentMode: r.paymentMode || 'UPI',
    paymentStatus: r.paymentStatus || 'paid',
  });

  const [f, setF] = useState(() => buildForm(initialRequest));
  const [manualTotal, setManualTotal] = useState(Boolean(initialRequest.amountPaid));
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setF(buildForm(activeReq));
    setManualTotal(Boolean(activeReq.amountPaid));
  }, [activeReq]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Auto-calculate Amount Paid when fee components change unless manually overridden
  useEffect(() => {
    if (manualTotal) return;
    const calc = Math.max(
      0,
      (Number(f.consultationFee) || 0) +
        (Number(f.treatmentCost) || 0) +
        (Number(f.medicineCost) || 0) -
        (Number(f.discount) || 0)
    );
    setF((x) => ({ ...x, amountPaid: calc }));
  }, [f.consultationFee, f.treatmentCost, f.medicineCost, f.discount, manualTotal]);

  const set = (k) => (e) => {
    const val = e.target.value;
    if (k === 'amountPaid') setManualTotal(true);
    if (['consultationFee', 'treatmentCost', 'medicineCost', 'discount'].includes(k)) setManualTotal(false);
    setF((x) => ({ ...x, [k]: val }));
  };

  const setMed = (idx, key, val) => {
    setF((x) => ({
      ...x,
      medicinesList: x.medicinesList.map((m, i) => (i === idx ? { ...m, [key]: val } : m)),
    }));
  };

  const addMed = () => {
    setF((x) => ({ ...x, medicinesList: [...x.medicinesList, { ...EMPTY_MED }] }));
  };

  const removeMed = (idx) => {
    setF((x) => ({
      ...x,
      medicinesList: x.medicinesList.length > 1 ? x.medicinesList.filter((_, i) => i !== idx) : [{ ...EMPTY_MED }],
    }));
  };

  const appendText = (field, snippet) => {
    setF((x) => {
      const cur = String(x[field] || '').trim();
      if (cur.toLowerCase().includes(snippet.toLowerCase())) return x;
      return { ...x, [field]: cur ? `${cur}, ${snippet}` : snippet };
    });
  };

  const saveRecord = async () => {
    setBusy(true);
    setError('');
    setMsg('');
    try {
      const updated = await api(`/admin/requests/${activeReq.id}/clinical`, {
        method: 'PUT',
        body: f,
      });
      setActiveReq(updated);
      history.reload?.();
      setMsg('Patient clinical & billing report saved.');
      onSaved?.('Patient clinical report saved.');
      setBusy(false);
      return updated;
    } catch (err) {
      onAuthError(err);
      setError(err.message);
      setBusy(false);
      return null;
    }
  };

  const saveAndDownloadPdf = async () => {
    setDownloading(true);
    const saved = await saveRecord();
    const recordToPrint = saved || { ...activeReq, ...f };
    try {
      const blob = await generateIndividualPatientPdf(recordToPrint);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = String(recordToPrint.name || 'patient')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      a.href = url;
      a.download = `the-mirrors-patient-report-${recordToPrint.ref || 'visit'}-${safeName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      setError(err.message || 'Could not generate patient PDF.');
    }
    setDownloading(false);
  };

  const linkedVisits = history.data?.visits || [];

  return createPortal(
    <div className="bf-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bf bf--wide" role="dialog" aria-modal="true" aria-label="Individual Patient Report">
        <header className="bf__head">
          <div>
            <p className="bf__eyebrow">
              Ref ID: <strong>{activeReq.ref}</strong> · {fmtDate(activeReq.date)} ({activeReq.time || '—'})
            </p>
            <h2>Individual Patient Report — {activeReq.name}</h2>
          </div>
          <button type="button" className="bf__close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </header>

        <div className="bf__form csheet">
          {/* Linked Visits History Bar (when the patient has multiple visits under the same Ref ID) */}
          {linkedVisits.length > 1 && (
            <div className="csheet__history">
              <span>Linked visits for ID <code>{activeReq.ref}</code>:</span>
              <div className="csheet__history-pills">
                {linkedVisits.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className={`csheet__vpill ${v.id === activeReq.id ? 'is-on' : ''}`}
                    onClick={() => setActiveReq(v)}
                  >
                    {v.visitType === 'revisit' ? `Revisit #${v.visitNumber}` : '1st Visit'} · {fmtDate(v.date)} ({v.status})
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="bf__fail">{error}</p>}
          {msg && <p className="aflash">{msg}</p>}

          {/* Patient & Visit Summary Row */}
          <div className="csheet__grid3">
            <label className="bf__field">
              <span className="bf__label">Visit classification</span>
              <select value={f.visitType} onChange={set('visitType')}>
                <option value="first">1st Visit (New Patient)</option>
                <option value="revisit">Revisit / Follow-up (Same ID)</option>
                <option value="rescheduled_first">1st Visit — Reopened / Rescheduled</option>
              </select>
            </label>
            <label className="bf__field">
              <span className="bf__label">Visit number</span>
              <input type="number" min={1} max={99} value={f.visitNumber} onChange={set('visitNumber')} />
            </label>
            <label className="bf__field">
              <span className="bf__label">Consultation / Treatment for</span>
              <input
                list="csheet-services"
                value={f.concern}
                onChange={set('concern')}
                placeholder="e.g. Acne Scar Revision"
              />
              <datalist id="csheet-services">
                <option value="General consultation" />
                {SERVICES.map((s) => (
                  <option key={s.slug} value={s.title} />
                ))}
              </datalist>
            </label>
          </div>

          {/* 1. Chief Complaint & Pain / Symptoms */}
          <div className="bf__field">
            <span className="bf__label">1. Chief Complaint, Pain Level &amp; Symptoms</span>
            <div className="csheet__chips">
              {PAIN_CHIPS.map((c) => (
                <button key={c} type="button" className="csheet__chip" onClick={() => appendText('pain', c)}>
                  + {c}
                </button>
              ))}
            </div>
            <textarea
              rows={2}
              value={f.pain}
              onChange={set('pain')}
              placeholder="Describe presenting symptoms, pain level, duration…"
            />
          </div>

          {/* 2. Clinical Diagnosis & 3. Treatments Performed */}
          <div className="bf__row">
            <label className="bf__field">
              <span className="bf__label">2. Clinical Diagnosis &amp; Findings</span>
              <textarea
                rows={3}
                value={f.diagnosis}
                onChange={set('diagnosis')}
                placeholder="e.g. Grade II Acne Vulgaris with Post-Inflammatory Hyperpigmentation"
              />
            </label>
            <div className="bf__field">
              <span className="bf__label">3. Treatments / Procedures Done or Advised</span>
              <textarea
                rows={3}
                value={f.treatments}
                onChange={set('treatments')}
                placeholder="e.g. Salicylic Acid Peel (Session 1) + Comedone Extraction"
              />
              <div className="csheet__chips">
                {SERVICES.slice(0, 5).map((s) => (
                  <button key={s.slug} type="button" className="csheet__chip" onClick={() => appendText('treatments', s.title)}>
                    + {s.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Prescribed Medicines Table */}
          <div className="bf__field">
            <div className="csheet__med-head">
              <span className="bf__label">4. Prescribed Medicines &amp; Skincare (℞)</span>
              <button type="button" className="abtn abtn--primary" onClick={addMed}>
                + Add medicine
              </button>
            </div>
            <div className="csheet__meds">
              {f.medicinesList.map((m, idx) => (
                <div key={idx} className="csheet__med-row">
                  <input
                    value={m.name}
                    onChange={(e) => setMed(idx, 'name', e.target.value)}
                    placeholder="Medicine / Cream / Cleanser name…"
                  />
                  <input
                    list="med-dosages"
                    value={m.dosage}
                    onChange={(e) => setMed(idx, 'dosage', e.target.value)}
                    placeholder="Dosage (e.g. 1-0-1)"
                  />
                  <input
                    value={m.duration}
                    onChange={(e) => setMed(idx, 'duration', e.target.value)}
                    placeholder="Duration (e.g. 15 days)"
                  />
                  <input
                    value={m.notes}
                    onChange={(e) => setMed(idx, 'notes', e.target.value)}
                    placeholder="Instructions (e.g. After food / Night)"
                  />
                  <button
                    type="button"
                    className="abtn abtn--danger"
                    onClick={() => removeMed(idx)}
                    title="Remove row"
                  >
                    ×
                  </button>
                </div>
              ))}
              <datalist id="med-dosages">
                <option value="1-0-1 (After food)" />
                <option value="0-0-1 (Night - thin layer)" />
                <option value="1-0-0 (Morning)" />
                <option value="Twice daily (Morning & Night)" />
                <option value="Apply 20 mins before sun exposure" />
              </datalist>
            </div>
          </div>

          {/* 5. Advice & Follow-up Date */}
          <div className="bf__row">
            <label className="bf__field">
              <span className="bf__label">5. Post-Care Advice / Instructions</span>
              <textarea
                rows={2}
                value={f.advice}
                onChange={set('advice')}
                placeholder="e.g. Avoid direct sun for 48 hours, use SPF 50+ daily, do not pick scabs."
              />
            </label>
            <label className="bf__field">
              <span className="bf__label">Next Follow-up Visit Date</span>
              <input type="date" value={f.followUpDate} onChange={set('followUpDate')} />
            </label>
          </div>

          {/* 6. Billing & Amount Paid */}
          <div className="csheet__billing">
            <h4>6. Billing &amp; Amount Paid (₹)</h4>
            <div className="csheet__bill-grid">
              <label className="bf__field">
                <span className="bf__label">Consultation (₹)</span>
                <input type="number" min={0} value={f.consultationFee} onChange={set('consultationFee')} />
              </label>
              <label className="bf__field">
                <span className="bf__label">Treatments (₹)</span>
                <input type="number" min={0} value={f.treatmentCost} onChange={set('treatmentCost')} />
              </label>
              <label className="bf__field">
                <span className="bf__label">Medicines (₹)</span>
                <input type="number" min={0} value={f.medicineCost} onChange={set('medicineCost')} />
              </label>
              <label className="bf__field">
                <span className="bf__label">Discount (₹)</span>
                <input type="number" min={0} value={f.discount} onChange={set('discount')} />
              </label>
              <label className="bf__field csheet__total-field">
                <span className="bf__label">Total Amount Paid (₹)</span>
                <input type="number" min={0} value={f.amountPaid} onChange={set('amountPaid')} />
              </label>
              <label className="bf__field">
                <span className="bf__label">Payment Mode</span>
                <select value={f.paymentMode} onChange={set('paymentMode')}>
                  <option value="UPI">UPI (GPay / PhonePe)</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI + Cash">UPI + Cash</option>
                </select>
              </label>
              <label className="bf__field">
                <span className="bf__label">Payment Status</span>
                <select value={f.paymentStatus} onChange={set('paymentStatus')}>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="pending">Pending</option>
                </select>
              </label>
            </div>
          </div>

          <div className="bf__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn--ghost" onClick={saveRecord} disabled={busy || downloading}>
              {busy ? 'Saving…' : 'Save clinical record'}
            </button>
            <button type="button" className="btn btn--navy" onClick={saveAndDownloadPdf} disabled={busy || downloading}>
              <Icon name="download" size={18} /> {downloading ? 'Generating PDF…' : 'Save & Download Patient PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---------- Flexible Reopen / Revisit / Reschedule / Link ID Modal ---------- */
export function ReopenVisitDialog({ request, onClose, onSaved }) {
  const { onAuthError } = useAuth();
  const slots = useApi(`/admin/slots?except=${request.id}`);
  const patients = useApi('/admin/patients/lookup');

  // Default mode: if already visited ('done'), default to adding an Existing Customer Revisit (same ID);
  // if cancelled, default to Reopen / Reschedule as First Appointment (same ID).
  const [mode, setMode] = useState(request.status === 'done' ? 'revisit' : 'reschedule_first_update');
  const [f, setF] = useState({
    date: request.date || '',
    time: request.time || '',
    concern: request.concern || 'General consultation',
    note: request.note || '',
    status: 'confirmed',
    targetRef: '',
    visitType: 'revisit',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const days = slots.data?.days || [];
  const selected = days.find((d) => d.date === f.date);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value, ...(k === 'date' && { time: '' }) }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api(`/admin/requests/${request.id}/reopen`, {
        method: 'POST',
        body: {
          mode,
          date: f.date,
          time: f.time,
          concern: f.concern,
          note: f.note,
          status: f.status,
          targetRef: f.targetRef,
          visitType: f.visitType,
        },
      });
      setBusy(false);
      if (mode === 'link_existing') {
        onSaved(`Linked ${res.name} to Ref ID ${res.ref} (${VISIT_TYPE_LABEL[res.visitType] || 'Revisit'}).`);
        onClose();
        return;
      }
      setSaved(res);
      onSaved(
        mode === 'revisit'
          ? `Revisit #${res.visitNumber} booked for ${res.name} under same ID ${res.ref}.`
          : `Appointment reopened as 1st Visit for ${res.name} (ID ${res.ref}).`
      );
    } catch (err) {
      onAuthError(err);
      setError(err.message);
      setBusy(false);
      slots.reload();
    }
  };

  if (saved) {
    const text = confirmationMessage(saved);
    const copy = () => navigator.clipboard?.writeText(text).then(() => setCopied(true), () => {});
    return createPortal(
      <div className="bf-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="bf" role="dialog" aria-modal="true" aria-label="Send confirmation">
          <header className="bf__head">
            <div>
              <p className="bf__eyebrow">
                {saved.name} · Ref ID: <strong>{saved.ref}</strong>
              </p>
              <h2>{saved.visitType === 'revisit' ? `Revisit #${saved.visitNumber} ready` : '1st Visit reopened'}</h2>
            </div>
            <button type="button" className="bf__close" onClick={onClose} aria-label="Close">
              <Icon name="close" size={20} />
            </button>
          </header>
          <div className="bf__form">
            <p className="bf__promise">
              <Icon name="check" size={18} />
              <span>
                Linked under Customer ID <strong>{saved.ref}</strong> ({fmtDate(saved.date)} · {saved.time}). Send{' '}
                {saved.name.split(' ')[0]} the confirmation:
              </span>
            </p>
            <pre className="amsg">{text}</pre>
            <div className="bf__actions bf__actions--start">
              {saved.phone && (
                <>
                  <a className="btn btn--navy" href={whatsappTo(saved.phone, text)} target="_blank" rel="noreferrer">
                    <Icon name="whatsapp" size={18} /> Send on WhatsApp
                  </a>
                  <a className="btn btn--ghost" href={smsTo(saved.phone, text)}>
                    Send as SMS
                  </a>
                </>
              )}
              <button type="button" className="btn btn--ghost" onClick={copy}>
                {copied ? 'Copied' : 'Copy message'}
              </button>
            </div>
            <button type="button" className="aback amsg__done" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  const existingPatients = (patients.data?.patients || []).filter((p) => p.ref !== request.ref);

  return createPortal(
    <div className="bf-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="bf bf--wide" role="dialog" aria-modal="true" aria-label="Reopen or Add Revisit" onSubmit={submit}>
        <header className="bf__head">
          <div>
            <p className="bf__eyebrow">
              {request.name} · Current Ref ID: <strong>{request.ref}</strong>
            </p>
            <h2>Reopen / Revisit / Reschedule Options</h2>
          </div>
          <button type="button" className="bf__close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </header>

        <div className="bf__form">
          {error && <p className="bf__fail">{error}</p>}

          <div className="reopen-modes" role="radiogroup" aria-label="Choose how to reopen or link this appointment">
            <label className={`reopen-mode ${mode === 'revisit' ? 'is-on' : ''}`}>
              <input
                type="radio"
                name="reopenMode"
                checked={mode === 'revisit'}
                onChange={() => setMode('revisit')}
              />
              <div>
                <strong>1. Add Existing Customer Revisit (Keep Same ID: {request.ref})</strong>
                <span>
                  Creates a linked follow-up appointment (Revisit #{(Number(request.visitNumber) || 1) + 1}) using the{' '}
                  <strong>exact same Ref ID ({request.ref})</strong> while keeping the previous visit in history.
                </span>
              </div>
            </label>

            <label className={`reopen-mode ${mode === 'reschedule_first_update' ? 'is-on' : ''}`}>
              <input
                type="radio"
                name="reopenMode"
                checked={mode === 'reschedule_first_update'}
                onChange={() => setMode('reschedule_first_update')}
              />
              <div>
                <strong>2. Reopen / Reschedule as 1st Appointment (Update This Booking — ID: {request.ref})</strong>
                <span>
                  Best when a first-time customer cancelled or wanted to change their time. Reopens this booking as
                  their <strong>First Visit</strong> with a new date/time and the same ID.
                </span>
              </div>
            </label>

            <label className={`reopen-mode ${mode === 'reschedule_first_new' ? 'is-on' : ''}`}>
              <input
                type="radio"
                name="reopenMode"
                checked={mode === 'reschedule_first_new'}
                onChange={() => setMode('reschedule_first_new')}
              />
              <div>
                <strong>3. Rebook Cancelled 1st Visit as New Entry (Keep Cancelled Log + Same ID: {request.ref})</strong>
                <span>
                  Leaves the cancelled booking in the history log and creates a new active <strong>1st Visit</strong>{' '}
                  sharing the same Ref ID ({request.ref}).
                </span>
              </div>
            </label>

            <label className={`reopen-mode ${mode === 'link_existing' ? 'is-on' : ''}`}>
              <input
                type="radio"
                name="reopenMode"
                checked={mode === 'link_existing'}
                onChange={() => setMode('link_existing')}
              />
              <div>
                <strong>4. Link This Booking to Another Existing Customer ID</strong>
                <span>
                  If an existing customer booked from the website and got a new code, assign their original{' '}
                  <code>MD-...</code> ID to link all their visits together.
                </span>
              </div>
            </label>
          </div>

          {mode === 'link_existing' ? (
            <div className="bf__row">
              <label className="bf__field">
                <span className="bf__label">Target Existing Customer Ref ID</span>
                <input
                  list="existing-patient-refs"
                  value={f.targetRef}
                  onChange={set('targetRef')}
                  placeholder="Type or select MD-... code"
                  required
                />
                <datalist id="existing-patient-refs">
                  {existingPatients.map((p) => (
                    <option key={p.ref} value={p.ref}>
                      {p.name} ({p.phone}) — {p.visitCount} visit(s)
                    </option>
                  ))}
                </datalist>
              </label>
              <label className="bf__field">
                <span className="bf__label">Classify this visit as</span>
                <select value={f.visitType} onChange={set('visitType')}>
                  <option value="revisit">Existing Customer Revisit (Follow-up)</option>
                  <option value="rescheduled_first">1st Appointment (Reopened / Rescheduled)</option>
                </select>
              </label>
            </div>
          ) : (
            <>
              <div className="bf__row">
                <label className="bf__field">
                  <span className="bf__label">Booking status</span>
                  <select value={f.status} onChange={set('status')}>
                    <option value="confirmed">Confirm slot immediately</option>
                    <option value="new">Move to New (Pending confirmation)</option>
                  </select>
                </label>
                <label className="bf__field">
                  <span className="bf__label">Treatment / Concern</span>
                  <input
                    list="reopen-services"
                    value={f.concern}
                    onChange={set('concern')}
                    placeholder="General consultation"
                  />
                  <datalist id="reopen-services">
                    <option value="General consultation" />
                    {SERVICES.map((s) => (
                      <option key={s.slug} value={s.title} />
                    ))}
                  </datalist>
                </label>
              </div>

              <label className="bf__field">
                <span className="bf__label">Select Date</span>
                <select value={selected ? f.date : ''} onChange={set('date')} required={f.status === 'confirmed'}>
                  <option value="">{slots.loading && !slots.data ? 'Loading…' : 'Choose a day…'}</option>
                  {days.map((d) => (
                    <option key={d.date} value={d.date}>
                      {d.label}
                      {d.booked.length ? ` — ${d.booked.length} booked` : ''}
                    </option>
                  ))}
                </select>
              </label>

              <div className="bf__field">
                <span className="bf__label">Select Time Slot</span>
                {selected ? (
                  <div className="slots">
                    {slots.data.times.map((t) => {
                      const taken = selected.booked.find(
                        (b) => b.time === t && (mode !== 'reschedule_first_update' || b.id !== request.id)
                      );
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={!!taken}
                          className={`slot ${f.time === t ? 'is-on' : ''} ${taken ? 'is-booked' : ''}`}
                          onClick={() => setF((x) => ({ ...x, time: t }))}
                          title={taken ? `Booked: ${taken.name}` : undefined}
                        >
                          {t}
                          {taken && <small>{taken.name.split(' ')[0]}</small>}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="slots__hint">Choose a day above to see available time slots.</p>
                )}
              </div>

              <label className="bf__field">
                <span className="bf__label">Clinic Note (optional)</span>
                <input
                  value={f.note}
                  onChange={set('note')}
                  placeholder={
                    mode === 'revisit'
                      ? 'e.g. Follow-up session 2 — review peel response'
                      : 'e.g. Rescheduled 1st appointment as requested by patient'
                  }
                />
              </label>
            </>
          )}

          <div className="bf__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--navy"
              disabled={busy || (mode !== 'link_existing' && f.status === 'confirmed' && (!selected || !f.time))}
            >
              {busy
                ? 'Saving…'
                : mode === 'revisit'
                  ? `Book Revisit (Same ID ${request.ref})`
                  : mode === 'link_existing'
                    ? 'Link to Customer ID'
                    : `Reopen as 1st Visit (ID ${request.ref})`}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body
  );
}

