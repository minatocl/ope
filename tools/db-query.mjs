#!/usr/bin/env node
// Supabase Management API 経由で本番DBにSQLを実行する(docs/supabase.md 記載の正規手順)。
// 使い方: node db-query.mjs <sqlファイル>  または  node db-query.mjs -e "select 1"
// PAT は ~/.config/supabase-pat.env の SUPABASE_PAT(または SUPABASE_ACCESS_TOKEN)。
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const PROJECT_REF = 'xwfeafjoltrytvotvahw';

function loadEnv(path) {
  const env = {};
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i === -1) continue;
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return env;
}

const env = loadEnv(join(homedir(), '.config', 'supabase-pat.env'));
const pat = env.SUPABASE_PAT || env.SUPABASE_ACCESS_TOKEN;
if (!pat) {
  console.error('PAT が ~/.config/supabase-pat.env にありません');
  process.exit(1);
}

const sql = process.argv[2] === '-e' ? process.argv[3] : readFileSync(process.argv[2], 'utf8');
const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${pat}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
});
const text = await res.text();
if (!res.ok) {
  console.error(`HTTP ${res.status}: ${text}`);
  process.exit(1);
}
try {
  console.log(JSON.stringify(JSON.parse(text), null, 2));
} catch {
  console.log(text);
}
