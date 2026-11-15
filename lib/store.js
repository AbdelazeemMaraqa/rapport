// Member storage. Upstash Redis (REST API, no SDK) in production; a JSON file for local development.
import { promises as fs } from 'node:fs';
import path from 'node:path';

const PREFIX = process.env.STORE_PREFIX || 'teamprint';
const idsKey = () => `${PREFIX}:ids`;
const memberKey = (id) => `${PREFIX}:m:${id}`;
const recordKey = (id) => `${PREFIX}:r:${id}`;

function upstash() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ''), token } : null;
}

/** 'upstash' | 'file' | 'none'. On Vercel without a store we refuse to write to the ephemeral disk. */
export function storageKind() {
  if (upstash()) return 'upstash';
  if (process.env.VERCEL) return 'none';
  return 'file';
}

async function redis(cmd) {
  const cfg = upstash();
  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: { authorization: `Bearer ${cfg.token}`, 'content-type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(`Upstash error: ${data.error || res.status}`);
  return data.result;
}

// ---- File store (local development only) ----
const filePath = () => path.resolve(process.env.DEV_DB_PATH || 'data/dev-db.json');

async function readFileDb() {
  try {
    const db = JSON.parse(await fs.readFile(filePath(), 'utf8'));
    return { members: db.members || {}, records: db.records || {} };
  } catch {
    return { members: {}, records: {} };
  }
}

async function writeFileDb(db) {
  await fs.mkdir(path.dirname(filePath()), { recursive: true });
  await fs.writeFile(filePath(), JSON.stringify(db, null, 2));
}

// ---- Public API ----
export async function listMembers() {
  if (storageKind() === 'upstash') {
    const ids = (await redis(['SMEMBERS', idsKey()])) || [];
    if (!ids.length) return [];
    const raw = await redis(['MGET', ...ids.map(memberKey)]);
    return (raw || []).filter(Boolean).map((s) => JSON.parse(s));
  }
  const db = await readFileDb();
  return Object.values(db.members);
}

export async function countMembers() {
  if (storageKind() === 'upstash') return Number(await redis(['SCARD', idsKey()])) || 0;
  const db = await readFileDb();
  return Object.keys(db.members).length;
}

export async function getMember(id) {
  if (storageKind() === 'upstash') {
    const raw = await redis(['GET', memberKey(id)]);
    return raw ? JSON.parse(raw) : null;
  }
  const db = await readFileDb();
  return db.members[id] || null;
}

export async function saveMember(member) {
  if (storageKind() === 'upstash') {
    await redis(['SET', memberKey(member.id), JSON.stringify(member)]);
    await redis(['SADD', idsKey(), member.id]);
    return;
  }
  const db = await readFileDb();
  db.members[member.id] = member;
  await writeFileDb(db);
}

export async function deleteMember(id) {
  if (storageKind() === 'upstash') {
    await redis(['DEL', memberKey(id), recordKey(id)]);
    await redis(['SREM', idsKey(), id]);
    return;
  }
  const db = await readFileDb();
  delete db.members[id];
  delete db.records[id];
  await writeFileDb(db);
}

// ---- Lead records (info, development plan, notes). Only the admin API reads or writes these. ----
/** Returns { [memberId]: record } for the given member ids. */
export async function getRecords(ids) {
  if (!ids.length) return {};
  if (storageKind() === 'upstash') {
    const raw = await redis(['MGET', ...ids.map(recordKey)]);
    const out = {};
    (raw || []).forEach((s, i) => {
      if (s) out[ids[i]] = JSON.parse(s);
    });
    return out;
  }
  const db = await readFileDb();
  return Object.fromEntries(ids.filter((id) => db.records[id]).map((id) => [id, db.records[id]]));
}

export async function saveRecord(id, record) {
  if (storageKind() === 'upstash') {
    await redis(['SET', recordKey(id), JSON.stringify(record)]);
    return;
  }
  const db = await readFileDb();
  db.records[id] = record;
  await writeFileDb(db);
}
