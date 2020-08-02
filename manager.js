const Telegraf = require('telegraf');
const Koa = require('koa')
const KoaBody = require('koa-body');
const configure = require('./bot');
const dbService = require('./services/db');
const { webhook } = require('./config');

const app = new Koa();
app.use(KoaBody());

function attachBot(meta) { // meta = bot
  const bot = new Telegraf(meta.token)
  app.use(async (ctx, next) => {
    if (ctx.method === 'POST' && ctx.url.replace(webhook.path, '') === meta.token) {
      await bot.handleUpdate(ctx.request.body, ctx.response);
    }
    ctx.status = 200;
    next();
  })
  bot.use((ctx, next) => {
    ctx.meta = meta;
    next();
  });
  configure(bot);
  bot.telegram.setWebhook(webhook.url + webhook.path + meta.token);
}

db('bot').where({
  status: 10
}).then(bots => {
  bots.forEach(bot => {
    attachBot(bot);
  });
})

app.listen(3000)