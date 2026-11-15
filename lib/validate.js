// Validates and clamps what members and the lead send. Anything not listed here is dropped.
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(v))));
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

const SHAPES = {
  disc: { keys: ['D', 'I', 'S', 'C'], lo: 0, hi: 100 },
  type: { keys: ['EI', 'SN', 'TF', 'JP'], lo: -100, hi: 100 },
  big5: { keys: ['O', 'C', 'E', 'A', 'ES'], lo: 0, hi: 100 },
};

export const cleanText = (s, max) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
// Like cleanText but keeps line breaks (for notes and plans).
export const cleanLong = (s, max) =>
  String(s ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);

const isoDate = (v) => {
  if (typeof v !== 'string' || v.length > 40) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
};
// A calendar day typed by the lead: YYYY-MM-DD or empty.
const day = (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v).getTime()) ? v : '');

/** Returns { ok: true, value } or { ok: false, error }. */
export function validateSubmission(body) {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Body must be a JSON object.' };
  const name = cleanText(body.name, 60);
  if (!name) return { ok: false, error: 'Name is required.' };
  const role = cleanText(body.role, 60);
  const lang = body.lang === 'en' ? 'en' : 'ar';
  const results = {};
  const completedAt = {};
  for (const [test, shape] of Object.entries(SHAPES)) {
    const r = body.results?.[test];
    if (r == null) continue;
    if (typeof r !== 'object') return { ok: false, error: `Results for ${test} are malformed.` };
    const out = {};
    for (const k of shape.keys) {
      if (!isNum(r[k])) return { ok: false, error: `Results for ${test} are missing ${k}.` };
      out[k] = clamp(r[k], shape.lo, shape.hi);
    }
    results[test] = out;
    const when = isoDate(body.completedAt?.[test]);
    if (when) completedAt[test] = when;
  }
  if (!Object.keys(results).length) return { ok: false, error: 'Send at least one result.' };
  return { ok: true, value: { name, role, lang, results, completedAt } };
}

const STATUSES = ['todo', 'doing', 'done'];
const shortId = (v, i) => cleanText(v, 24).replace(/[^a-z0-9_-]/gi, '') || `g${i}`;

/** The lead's own record for a member: info, development plan and 1:1 notes. */
export function validateRecord(rec) {
  if (!rec || typeof rec !== 'object') return { ok: false, error: 'Record must be an object.' };
  const info = rec.info && typeof rec.info === 'object' ? rec.info : {};
  const plan = rec.plan && typeof rec.plan === 'object' ? rec.plan : {};
  const goals = Array.isArray(plan.goals) ? plan.goals : [];
  const notes = Array.isArray(rec.notes) ? rec.notes : [];
  if (goals.length > 40) return { ok: false, error: 'At most 40 goals.' };
  if (notes.length > 150) return { ok: false, error: 'At most 150 notes.' };
  return {
    ok: true,
    value: {
      info: {
        team: cleanText(info.team, 80),
        email: cleanText(info.email, 120),
        phone: cleanText(info.phone, 40),
        startDate: day(info.startDate),
        about: cleanLong(info.about, 2000),
      },
      plan: {
        focus: cleanLong(plan.focus, 2000),
        goals: goals
          .filter((g) => g && typeof g === 'object')
          .map((g, i) => ({
            id: shortId(g.id, i),
            text: cleanLong(g.text, 600),
            measure: cleanLong(g.measure, 400),
            due: day(g.due),
            status: STATUSES.includes(g.status) ? g.status : 'todo',
          }))
          .filter((g) => g.text || g.measure),
        support: cleanLong(plan.support, 2000),
        review: day(plan.review),
      },
      notes: notes
        .filter((n) => n && typeof n === 'object')
        .map((n, i) => ({ id: shortId(n.id, i), date: day(n.date) || new Date().toISOString().slice(0, 10), text: cleanLong(n.text, 3000) }))
        .filter((n) => n.text),
    },
  };
}
