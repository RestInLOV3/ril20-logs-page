import { Hono } from 'hono';
import type { Env } from './types';
import { r2KeyToUrl, uploadToR2, deleteFromR2, getFromR2 } from './r2';

type Bindings = Env;

const app = new Hono<{ Bindings: Bindings }>().basePath('/api');

function requireAdmin(env: Bindings, authHeader: string | undefined): boolean {
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  return token === env.ADMIN_TOKEN;
}

// ── 공개 API ──────────────────────────────────────────

app.get('/scenarios', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT s.*, COUNT(l.id) AS log_count
    FROM scenarios s
    LEFT JOIN logs l ON l.scenario_id = s.id
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `).all<Record<string, unknown>>();

  const baseUrl = c.env.R2_PUBLIC_URL;
  const data = results.map((s: Record<string, unknown>) => ({
    ...s,
    cover_url: r2KeyToUrl(s.cover_r2 as string | null, baseUrl),
  }));
  return c.json(data);
});

app.get('/scenarios/:slug', async (c) => {
  const slug = c.req.param('slug');
  const baseUrl = c.env.R2_PUBLIC_URL;

  const scenario = await c.env.DB.prepare(
    'SELECT * FROM scenarios WHERE slug = ?',
  ).bind(slug).first<Record<string, unknown>>();
  if (!scenario) return c.json({ error: 'not_found', message: '시나리오를 찾을 수 없습니다.' }, 404);

  const { results: chars } = await c.env.DB.prepare(
    'SELECT * FROM characters WHERE scenario_id = ? ORDER BY sort_order',
  ).bind(scenario.id).all<Record<string, unknown>>();

  const { results: quotes } = await c.env.DB.prepare(
    `SELECT * FROM character_quotes WHERE character_id IN (
      SELECT id FROM characters WHERE scenario_id = ?
    )`,
  ).bind(scenario.id).all<Record<string, unknown>>();

  const quotesByChar = new Map<number, { id: number; quote: string }[]>();
  for (const q of quotes) {
    const cid = q.character_id as number;
    if (!quotesByChar.has(cid)) quotesByChar.set(cid, []);
    quotesByChar.get(cid)!.push({ id: q.id as number, quote: q.quote as string });
  }

  const characters = chars.map((ch: Record<string, unknown>) => ({
    ...ch,
    image_url: r2KeyToUrl(ch.image_r2 as string | null, baseUrl),
    quotes: quotesByChar.get(ch.id as number) ?? [],
  }));

  const { results: logs } = await c.env.DB.prepare(
    'SELECT id, title, order_num FROM logs WHERE scenario_id = ? ORDER BY order_num',
  ).bind(scenario.id).all();

  return c.json({
    ...scenario,
    cover_url: r2KeyToUrl(scenario.cover_r2 as string | null, baseUrl),
    characters,
    logs,
  });
});

app.get('/scenarios/:slug/logs/:logId', async (c) => {
  const slug = c.req.param('slug');
  const logId = parseInt(c.req.param('logId'));

  const scenario = await c.env.DB.prepare(
    'SELECT id FROM scenarios WHERE slug = ?',
  ).bind(slug).first<{ id: number }>();
  if (!scenario) return c.json({ error: 'not_found', message: '시나리오를 찾을 수 없습니다.' }, 404);

  const log = await c.env.DB.prepare(
    'SELECT * FROM logs WHERE id = ? AND scenario_id = ?',
  ).bind(logId, scenario.id).first<Record<string, unknown>>();
  if (!log) return c.json({ error: 'not_found', message: '로그를 찾을 수 없습니다.' }, 404);

  const html = await getFromR2(c.env.BUCKET, log.html_r2 as string);
  if (!html) return c.json({ error: 'not_found', message: '로그 파일을 찾을 수 없습니다.' }, 404);

  const prev = await c.env.DB.prepare(
    'SELECT id, title, order_num FROM logs WHERE scenario_id = ? AND order_num < ? ORDER BY order_num DESC LIMIT 1',
  ).bind(scenario.id, log.order_num).first();

  const next = await c.env.DB.prepare(
    'SELECT id, title, order_num FROM logs WHERE scenario_id = ? AND order_num > ? ORDER BY order_num ASC LIMIT 1',
  ).bind(scenario.id, log.order_num).first();

  return c.json({ id: log.id, title: log.title, order_num: log.order_num, html, prev, next });
});

app.get('/reviews', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') ?? '30'), 100);
  const offset = parseInt(c.req.query('offset') ?? '0');

  const { results } = await c.env.DB.prepare(`
    SELECT r.*, s.color AS scenario_color
    FROM reviews r
    JOIN scenarios s ON s.id = r.scenario_id
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all();

  return c.json(results);
});

app.get('/scenarios/:slug/reviews', async (c) => {
  const slug = c.req.param('slug');

  const scenario = await c.env.DB.prepare(
    'SELECT id FROM scenarios WHERE slug = ?',
  ).bind(slug).first<{ id: number }>();
  if (!scenario) return c.json({ error: 'not_found', message: '시나리오를 찾을 수 없습니다.' }, 404);

  const { results } = await c.env.DB.prepare(`
    SELECT r.*, s.color AS scenario_color
    FROM reviews r
    JOIN scenarios s ON s.id = r.scenario_id
    WHERE r.scenario_id = ?
    ORDER BY r.created_at DESC
  `).bind(scenario.id).all();

  return c.json(results);
});

app.post('/scenarios/:slug/reviews', async (c) => {
  const slug = c.req.param('slug');

  const scenario = await c.env.DB.prepare(
    'SELECT id FROM scenarios WHERE slug = ?',
  ).bind(slug).first<{ id: number }>();
  if (!scenario) return c.json({ error: 'not_found', message: '시나리오를 찾을 수 없습니다.' }, 404);

  const body = await c.req.json<{ pl_name?: string | null; content: string }>();
  if (!body.content?.trim()) {
    return c.json({ error: 'bad_request', message: '내용을 입력해주세요.' }, 400);
  }
  if (body.content.length > 1000) {
    return c.json({ error: 'bad_request', message: '후기는 1000자 이하로 작성해주세요.' }, 400);
  }

  const plName = body.pl_name?.trim() || null;
  const { meta } = await c.env.DB.prepare(
    'INSERT INTO reviews (scenario_id, pl_name, content) VALUES (?, ?, ?)',
  ).bind(scenario.id, plName, body.content.trim()).run();

  const review = await c.env.DB.prepare(
    'SELECT r.*, s.color AS scenario_color FROM reviews r JOIN scenarios s ON s.id = r.scenario_id WHERE r.id = ?',
  ).bind(meta.last_row_id).first();

  return c.json(review, 201);
});

// ── 관리자 API ────────────────────────────────────────

app.get('/admin/ping', (c) => {
  if (!requireAdmin(c.env, c.req.header('Authorization'))) {
    return c.json({ error: 'unauthorized', message: '인증이 필요합니다.' }, 401);
  }
  return c.json({ ok: true });
});

app.post('/admin/scenarios', async (c) => {
  if (!requireAdmin(c.env, c.req.header('Authorization'))) {
    return c.json({ error: 'unauthorized', message: '인증이 필요합니다.' }, 401);
  }

  const body = await c.req.json<{
    slug: string; title: string; color: string;
    description?: string | null; cover_r2?: string | null;
    rule?: string | null; scenario_type?: string | null;
  }>();

  if (!body.slug || !body.title || !body.color) {
    return c.json({ error: 'bad_request', message: 'slug, title, color는 필수입니다.' }, 400);
  }

  const { meta } = await c.env.DB.prepare(
    'INSERT INTO scenarios (slug, title, description, color, cover_r2, rule, scenario_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).bind(body.slug, body.title, body.description ?? null, body.color, body.cover_r2 ?? null, body.rule ?? null, body.scenario_type ?? null).run();

  const scenario = await c.env.DB.prepare('SELECT * FROM scenarios WHERE id = ?')
    .bind(meta.last_row_id).first();
  return c.json(scenario, 201);
});

app.put('/admin/scenarios/:id', async (c) => {
  if (!requireAdmin(c.env, c.req.header('Authorization'))) {
    return c.json({ error: 'unauthorized', message: '인증이 필요합니다.' }, 401);
  }

  const id = parseInt(c.req.param('id'));
  const body = await c.req.json<{
    slug?: string; title?: string; color?: string;
    description?: string | null; cover_r2?: string | null;
    rule?: string | null; scenario_type?: string | null;
  }>();

  await c.env.DB.prepare(`
    UPDATE scenarios SET
      slug = COALESCE(?, slug),
      title = COALESCE(?, title),
      description = ?,
      color = COALESCE(?, color),
      cover_r2 = ?,
      rule = ?,
      scenario_type = ?
    WHERE id = ?
  `).bind(
    body.slug ?? null, body.title ?? null,
    body.description ?? null, body.color ?? null,
    'cover_r2' in body ? (body.cover_r2 ?? null) : null,
    body.rule ?? null, body.scenario_type ?? null,
    id,
  ).run();

  return c.json({ ok: true });
});

app.delete('/admin/scenarios/:id', async (c) => {
  if (!requireAdmin(c.env, c.req.header('Authorization'))) {
    return c.json({ error: 'unauthorized', message: '인증이 필요합니다.' }, 401);
  }

  const id = parseInt(c.req.param('id'));

  const { results: logs } = await c.env.DB.prepare(
    'SELECT html_r2 FROM logs WHERE scenario_id = ?',
  ).bind(id).all<{ html_r2: string }>();
  await Promise.all(logs.map((l) => deleteFromR2(c.env.BUCKET, l.html_r2)));

  const scenario = await c.env.DB.prepare('SELECT cover_r2 FROM scenarios WHERE id = ?')
    .bind(id).first<{ cover_r2: string | null }>();
  if (scenario?.cover_r2) await deleteFromR2(c.env.BUCKET, scenario.cover_r2);

  await c.env.DB.prepare('DELETE FROM scenarios WHERE id = ?').bind(id).run();
  return new Response(null, { status: 204 });
});

app.post('/admin/scenarios/:id/characters', async (c) => {
  if (!requireAdmin(c.env, c.req.header('Authorization'))) {
    return c.json({ error: 'unauthorized', message: '인증이 필요합니다.' }, 401);
  }

  const scenarioId = parseInt(c.req.param('id'));
  const body = await c.req.json<{
    name: string; pl_name: string;
    image_r2?: string | null; bio?: string | null;
    sort_order?: number; quotes?: string[];
  }>();

  const { meta } = await c.env.DB.prepare(
    'INSERT INTO characters (scenario_id, name, pl_name, image_r2, bio, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
  ).bind(
    scenarioId, body.name, body.pl_name,
    body.image_r2 ?? null, body.bio ?? null, body.sort_order ?? 0,
  ).run();

  const charId = meta.last_row_id;

  if (body.quotes?.length) {
    const stmts = body.quotes.map((q) =>
      c.env.DB.prepare('INSERT INTO character_quotes (character_id, quote) VALUES (?, ?)').bind(charId, q),
    );
    await c.env.DB.batch(stmts);
  }

  const character = await c.env.DB.prepare('SELECT * FROM characters WHERE id = ?').bind(charId).first();
  return c.json(character, 201);
});

app.put('/admin/characters/:id', async (c) => {
  if (!requireAdmin(c.env, c.req.header('Authorization'))) {
    return c.json({ error: 'unauthorized', message: '인증이 필요합니다.' }, 401);
  }

  const id = parseInt(c.req.param('id'));
  const body = await c.req.json<{
    name?: string; pl_name?: string;
    image_r2?: string | null; bio?: string | null;
    sort_order?: number; quotes?: string[];
  }>();

  await c.env.DB.prepare(`
    UPDATE characters SET
      name = COALESCE(?, name),
      pl_name = COALESCE(?, pl_name),
      image_r2 = ?,
      bio = ?,
      sort_order = COALESCE(?, sort_order)
    WHERE id = ?
  `).bind(
    body.name ?? null, body.pl_name ?? null,
    body.image_r2 ?? null, body.bio ?? null,
    body.sort_order ?? null, id,
  ).run();

  if (body.quotes !== undefined) {
    await c.env.DB.prepare('DELETE FROM character_quotes WHERE character_id = ?').bind(id).run();
    if (body.quotes.length) {
      const stmts = body.quotes.map((q) =>
        c.env.DB.prepare('INSERT INTO character_quotes (character_id, quote) VALUES (?, ?)').bind(id, q),
      );
      await c.env.DB.batch(stmts);
    }
  }

  return c.json({ ok: true });
});

app.delete('/admin/characters/:id', async (c) => {
  if (!requireAdmin(c.env, c.req.header('Authorization'))) {
    return c.json({ error: 'unauthorized', message: '인증이 필요합니다.' }, 401);
  }

  const id = parseInt(c.req.param('id'));
  const char = await c.env.DB.prepare('SELECT image_r2 FROM characters WHERE id = ?')
    .bind(id).first<{ image_r2: string | null }>();
  if (char?.image_r2) await deleteFromR2(c.env.BUCKET, char.image_r2);

  await c.env.DB.prepare('DELETE FROM characters WHERE id = ?').bind(id).run();
  return new Response(null, { status: 204 });
});

app.post('/admin/scenarios/:id/logs', async (c) => {
  if (!requireAdmin(c.env, c.req.header('Authorization'))) {
    return c.json({ error: 'unauthorized', message: '인증이 필요합니다.' }, 401);
  }

  const scenarioId = parseInt(c.req.param('id'));

  const scenario = await c.env.DB.prepare('SELECT slug FROM scenarios WHERE id = ?')
    .bind(scenarioId).first<{ slug: string }>();
  if (!scenario) return c.json({ error: 'not_found', message: '시나리오를 찾을 수 없습니다.' }, 404);

  const form = await c.req.formData();
  const title = form.get('title') as string;
  const orderNum = parseInt(form.get('order_num') as string);
  const file = form.get('file') as File | null;

  if (!title || isNaN(orderNum) || !file) {
    return c.json({ error: 'bad_request', message: 'title, order_num, file은 필수입니다.' }, 400);
  }

  const { meta } = await c.env.DB.prepare(
    'INSERT INTO logs (scenario_id, title, order_num, html_r2) VALUES (?, ?, ?, ?)',
  ).bind(scenarioId, title, orderNum, 'placeholder').run();

  const logId = meta.last_row_id;
  const r2Key = `scenarios/${scenario.slug}/logs/${logId}.html`;

  await uploadToR2(c.env.BUCKET, r2Key, await file.arrayBuffer(), 'text/html; charset=utf-8');
  await c.env.DB.prepare('UPDATE logs SET html_r2 = ? WHERE id = ?').bind(r2Key, logId).run();

  return c.json({ id: logId, title, order_num: orderNum, html_r2: r2Key }, 201);
});

app.put('/admin/logs/:id', async (c) => {
  if (!requireAdmin(c.env, c.req.header('Authorization'))) {
    return c.json({ error: 'unauthorized', message: '인증이 필요합니다.' }, 401);
  }

  const id = parseInt(c.req.param('id'));
  const log = await c.env.DB.prepare('SELECT html_r2 FROM logs WHERE id = ?')
    .bind(id).first<{ html_r2: string }>();
  if (!log) return c.json({ error: 'not_found', message: '로그를 찾을 수 없습니다.' }, 404);

  const form = await c.req.formData();
  const title = (form.get('title') as string | null) || null;
  const orderNumStr = form.get('order_num') as string | null;
  const file = form.get('file') as File | null;

  if (file) {
    await uploadToR2(c.env.BUCKET, log.html_r2, await file.arrayBuffer(), 'text/html; charset=utf-8');
  }

  await c.env.DB.prepare(`
    UPDATE logs SET
      title = COALESCE(?, title),
      order_num = COALESCE(?, order_num)
    WHERE id = ?
  `).bind(title, orderNumStr ? parseInt(orderNumStr) : null, id).run();

  return c.json({ ok: true });
});

app.delete('/admin/logs/:id', async (c) => {
  if (!requireAdmin(c.env, c.req.header('Authorization'))) {
    return c.json({ error: 'unauthorized', message: '인증이 필요합니다.' }, 401);
  }

  const id = parseInt(c.req.param('id'));
  const log = await c.env.DB.prepare('SELECT html_r2 FROM logs WHERE id = ?')
    .bind(id).first<{ html_r2: string }>();
  if (!log) return c.json({ error: 'not_found', message: '로그를 찾을 수 없습니다.' }, 404);

  await deleteFromR2(c.env.BUCKET, log.html_r2);
  await c.env.DB.prepare('DELETE FROM logs WHERE id = ?').bind(id).run();
  return new Response(null, { status: 204 });
});

app.delete('/admin/reviews/:id', async (c) => {
  if (!requireAdmin(c.env, c.req.header('Authorization'))) {
    return c.json({ error: 'unauthorized', message: '인증이 필요합니다.' }, 401);
  }

  const id = parseInt(c.req.param('id'));
  await c.env.DB.prepare('DELETE FROM reviews WHERE id = ?').bind(id).run();
  return new Response(null, { status: 204 });
});

app.post('/admin/upload', async (c) => {
  if (!requireAdmin(c.env, c.req.header('Authorization'))) {
    return c.json({ error: 'unauthorized', message: '인증이 필요합니다.' }, 401);
  }

  const form = await c.req.formData();
  const key = form.get('key') as string;
  const file = form.get('file') as File | null;

  if (!key || !file) {
    return c.json({ error: 'bad_request', message: 'key와 file은 필수입니다.' }, 400);
  }

  await uploadToR2(c.env.BUCKET, key, await file.arrayBuffer(), file.type);
  const url = `${c.env.R2_PUBLIC_URL}/${key}`;
  return c.json({ key, url });
});

export default app;
