import { Context, Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const app = new Hono<{ Bindings: Env }>();

app.get('/api/health', c => c.json({ version: '1.0.0' }));

const cacheMiddleware = async (
  c: Context<{ Bindings: Env }>,
  next: () => Promise<void>
) => {
  c.res.headers.set('Cache-Control', 'public, max-age=3153600');
  return next();
};

app.get('/api/domains', cacheMiddleware, async c => {
  return c.json(
    (await c.env.CONSTANTS_DATABASE.prepare('SELECT * FROM domains').run())
      .results
  );
});

app.get('/api/domain/:domain', cacheMiddleware, async c => {
  const name = c.req.query('name');
  const value = c.req.query('value');
  const hex = !!c.req.query('hex');
  const tag = c.req.queries('tags');

  const domain = c.req.param('domain');
  let statement: string;
  let binds: any[];

  if (!name && !value && !tag) {
    statement = 'SELECT * FROM constants WHERE domain = ?';
    binds = [domain];
  } else if (name) {
    statement = 'SELECT * FROM constants WHERE domain = ? AND name = ?';
    binds = [domain, name];
  } else if (value && tag) {
    statement = `SELECT * FROM constants WHERE domain = ? AND ${hex ? 'hex_value' : 'value'} LIKE ? AND tags IN ?`;
    binds = [domain, `${value}%`, tag];
  } else if (value) {
    statement = `SELECT * FROM constants WHERE domain = ? AND ${hex ? 'hex_value' : 'value'} LIKE ?`;
    binds = [domain, `${value}%`];
  } else {
    statement = 'SELECT * FROM constants WHERE domain = ? AND tags IN ?';
    binds = [domain, tag];
  }

  return c.json(
    (
      await c.env.CONSTANTS_DATABASE.prepare(statement)
        .bind(...binds)
        .run()
    ).results
  );
});

app.get('/api/domain/:domain/tags', cacheMiddleware, async c => {
  const domain = c.req.param('domain');
  return c.json(
    (
      await c.env.CONSTANTS_DATABASE.prepare(
        'SELECT DISTINCT(tags) FROM constants WHERE domain = ?'
      )
        .bind(domain)
        .run()
    ).results.map(r => r.tags)
  );
});

const authMiddleware = async (
  c: Context<{ Bindings: Env }>,
  next: () => Promise<void>
) => {
  const auth = c.req.header('Authentication');
  if (!auth)
    return c.json({ error: 'Authentication header not found in request' }, 401);
  if (!auth.startsWith('Bearer '))
    return c.json({ error: 'Invalid Authentication' }, 401);
  if (auth.substring(7) !== c.env.AUTH_TOKEN)
    return c.json({ error: 'Failed to authenticate' }, 403);
  return next();
};

const putDomainSchema = z.object({
  domain: z.string(),
  description: z.string(),
  link: z.string().optional(),
});

app.put(
  '/api/domains',
  authMiddleware,
  zValidator('json', putDomainSchema),
  async c => {
    const payload = c.req.valid('json');
    await c.env.CONSTANTS_DATABASE.prepare(
      `INSERT INTO domains
         VALUES (?, ?, ?)
         ON CONFLICT(domain)
           DO UPDATE SET description=excluded.description,
                         link=excluded.link`
    )
      .bind(payload.domain, payload.description, payload.link ?? null)
      .run();
    return c.json({ domain: payload.domain }, 201);
  }
);

app.delete('/api/domain/:domain', authMiddleware, async c => {
  const domain = c.req.param('domain');
  const rows = (
    await c.env.CONSTANTS_DATABASE.prepare(
      'DELETE FROM domains WHERE domain = ? RETURNING domain'
    )
      .bind(domain)
      .run()
  ).results;
  if (rows.length) return c.body(null, 204);
  else return c.json({ error: 'No domain found' }, 400);
});

const putConstantSchema = z.object({
  name: z.string(),
  value: z.union([z.string(), z.number()]),
  tags: z.string().optional(),
  description: z.string(),
  link: z.string().optional(),
});

app.put(
  '/api/domain/:domain',
  authMiddleware,
  zValidator('json', putConstantSchema),
  async c => {
    const payload = c.req.valid('json');
    const domain = c.req.param('domain');
    const value = String(payload.value);
    const hex =
      typeof payload.value === 'number' ? payload.value.toString(16) : null;

    try {
      await c.env.CONSTANTS_DATABASE.prepare(
        `INSERT INTO constants
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(domain, name)
         DO UPDATE SET value=excluded.value,
                       hex_value=excluded.hex_value,
                       tags=excluded.tags,
                       description=excluded.description,
                       link=excluded.link`
      )
        .bind(
          domain,
          payload.name,
          value,
          hex,
          payload.tags ?? null,
          payload.description,
          payload.link ?? null
        )
        .run();
      return c.json({ domain, name: payload.name }, 201);
    } catch {
      return c.json({ error: 'Domain is not created' }, 400);
    }
  }
);

app.delete('/api/domain/:domain/:name', authMiddleware, async c => {
  const domain = c.req.param('domain');
  const name = c.req.param('name');
  const rows = (
    await c.env.CONSTANTS_DATABASE.prepare(
      'DELETE FROM constants WHERE domain = ? AND name = ? RETURNING name'
    )
      .bind(domain, name)
      .run()
  ).results;
  if (rows.length) return c.body(null, 204);
  else return c.json({ error: 'No name found' }, 400);
});

export default app;
