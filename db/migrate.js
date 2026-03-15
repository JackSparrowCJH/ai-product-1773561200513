require('dotenv').config();
const { Client } = require('pg');

const SQL = `
-- 用户表：存储用户功德数据与皮肤选择
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  openid        VARCHAR(64) NOT NULL UNIQUE,
  nickname      VARCHAR(128) DEFAULT '',
  avatar_url    TEXT DEFAULT '',
  merit         BIGINT DEFAULT 0,
  current_skin  VARCHAR(32) DEFAULT 'default',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 按 openid 查询用户（登录/同步时高频使用）
CREATE INDEX IF NOT EXISTS idx_users_openid ON users (openid);

-- 按功德数降序排列（排行榜查询）
CREATE INDEX IF NOT EXISTS idx_users_merit_desc ON users (merit DESC);

-- 皮肤配置表
CREATE TABLE IF NOT EXISTS skins (
  id          VARCHAR(32) PRIMARY KEY,
  name        VARCHAR(64) NOT NULL,
  icon_url    TEXT DEFAULT '',
  sound_url   TEXT DEFAULT '',
  sort_order  INT DEFAULT 0
);

-- 敲击记录表：用于数据校验与防作弊
CREATE TABLE IF NOT EXISTS merit_logs (
  id          BIGSERIAL PRIMARY KEY,
  openid      VARCHAR(64) NOT NULL,
  delta       INT NOT NULL,
  client_ts   BIGINT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 按 openid + 时间查询敲击记录（防作弊校验）
CREATE INDEX IF NOT EXISTS idx_merit_logs_openid_ts ON merit_logs (openid, created_at DESC);

-- 插入默认皮肤数据
INSERT INTO skins (id, name, sort_order) VALUES
  ('default',    '经典木鱼',    0),
  ('cyberpunk',  '赛博朋克',    1),
  ('jade',       '翡翠禅心',    2)
ON CONFLICT (id) DO NOTHING;
`;

async function migrate() {
  const client = new Client({ connectionString: process.env.DB_URL });
  try {
    await client.connect();
    console.log('Connected to database.');
    await client.query(SQL);
    console.log('Migration completed: tables and indexes created.');

    // 验证
    const { rows } = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `);
    console.log('Tables:', rows.map(r => r.tablename).join(', '));

    const idx = await client.query(`
      SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname
    `);
    console.log('Indexes:', idx.rows.map(r => r.indexname).join(', '));
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
