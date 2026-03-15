require('dotenv').config();
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const router = require('./routes');

const app = new Koa();
const PORT = process.env.PORT || 3000;

app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
