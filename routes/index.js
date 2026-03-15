const Router = require('koa-router');
const pool = require('../db/pool');

const router = new Router({ prefix: '/api' });

// 健康检查
router.get('/health', async (ctx) => {
  try {
    await pool.query('SELECT 1');
    ctx.body = { status: 'ok', db: 'connected' };
  } catch {
    ctx.status = 503;
    ctx.body = { status: 'error', db: 'disconnected' };
  }
});

// 用户登录/注册（小程序端传 openid）
router.post('/user/login', async (ctx) => {
  const { openid, nickname, avatar_url } = ctx.request.body;
  if (!openid) { ctx.status = 400; ctx.body = { error: 'openid required' }; return; }

  const { rows } = await pool.query(
    `INSERT INTO users (openid, nickname, avatar_url)
     VALUES ($1, $2, $3)
     ON CONFLICT (openid) DO UPDATE SET
       nickname = COALESCE(NULLIF($2, ''), users.nickname),
       avatar_url = COALESCE(NULLIF($3, ''), users.avatar_url),
       updated_at = NOW()
     RETURNING id, openid, nickname, avatar_url, merit, current_skin`,
    [openid, nickname || '', avatar_url || '']
  );
  ctx.body = { user: rows[0] };
});

// 同步功德
router.post('/merit/sync', async (ctx) => {
  const { openid, delta, client_ts } = ctx.request.body;
  if (!openid || !delta) { ctx.status = 400; ctx.body = { error: 'openid and delta required' }; return; }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO merit_logs (openid, delta, client_ts) VALUES ($1, $2, $3)`,
      [openid, delta, client_ts || Date.now()]
    );
    const { rows } = await client.query(
      `UPDATE users SET merit = merit + $1, updated_at = NOW() WHERE openid = $2 RETURNING merit`,
      [delta, openid]
    );
    await client.query('COMMIT');
    ctx.body = { merit: rows[0]?.merit ?? 0 };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// 排行榜
router.get('/rank', async (ctx) => {
  const limit = Math.min(parseInt(ctx.query.limit) || 20, 100);
  const { rows } = await pool.query(
    `SELECT openid, nickname, avatar_url, merit FROM users ORDER BY merit DESC LIMIT $1`,
    [limit]
  );
  ctx.body = { list: rows };
});

// 皮肤列表
router.get('/skins', async (ctx) => {
  const { rows } = await pool.query('SELECT * FROM skins ORDER BY sort_order');
  ctx.body = { list: rows };
});

// 切换皮肤
router.post('/user/skin', async (ctx) => {
  const { openid, skin_id } = ctx.request.body;
  if (!openid || !skin_id) { ctx.status = 400; ctx.body = { error: 'openid and skin_id required' }; return; }

  await pool.query(
    `UPDATE users SET current_skin = $1, updated_at = NOW() WHERE openid = $2`,
    [skin_id, openid]
  );
  ctx.body = { success: true };
});

module.exports = router;
