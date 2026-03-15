# 敲木鱼 - 微信小程序

## 项目结构

```
├── miniprogram/          # 微信小程序前端
│   ├── app.json
│   ├── pages/
│   │   ├── index/        # 主页（敲击）
│   │   └── rank/         # 排行榜
│   └── assets/           # 皮肤图片、音效（需自行放入）
├── db/
│   ├── migrate.js        # 数据库迁移脚本
│   └── pool.js           # 连接池
├── routes/
│   └── index.js          # API 路由
├── server.js             # Koa 服务入口
├── .env                  # 环境变量
└── package.json
```

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置 .env 中的 DB_URL

# 3. 执行数据库迁移（创建表和索引）
npm run db:migrate

# 4. 启动后端服务
npm start
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/health | 健康检查 |
| POST | /api/user/login | 用户登录/注册 |
| POST | /api/merit/sync | 同步功德 |
| GET | /api/rank?limit=20 | 排行榜 |
| GET | /api/skins | 皮肤列表 |
| POST | /api/user/skin | 切换皮肤 |

## 验证

```bash
# 健康检查
curl http://localhost:3000/api/health

# 登录
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"openid":"test123","nickname":"测试用户"}'

# 同步功德
curl -X POST http://localhost:3000/api/merit/sync \
  -H "Content-Type: application/json" \
  -d '{"openid":"test123","delta":10}'

# 排行榜
curl http://localhost:3000/api/rank
```
