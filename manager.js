const Telegraf = require('telegraf');
const Koa = require('koa')
const KoaBody = require('koa-body');
const configure = require('./bot');
const dbService = require('./services/db');
const { webhook } = require('./config');
const { socket } = require('./services/socket');

const DOBOT_TOKENS = [];
const DOBOTS = {};

const app = new Koa();
app.use(KoaBody());
app.use(async (ctx, next) => {
  let token = ctx.url.replace(webhook.path, '');
  if (ctx.method === 'POST' && DOBOT_TOKENS.some(t => t === token)) {
    await DOBOTS[token].handleUpdate(ctx.request.body, ctx.response);
  }
  ctx.status = 200;
  next();
});

function attachBot(meta) { // meta = bot
  const bot = new Telegraf(meta.token)
  bot.use((ctx, next) => {
    ctx.meta = meta;
    next();
  });
  configure(bot);
  bot.telegram.setWebhook(webhook.url + webhook.path + meta.token)
    .then(res => {
      console.log('setWebhook', meta.token, res)
      return dbService('bot').where({
        id: meta.id,
      }).update({
        status: '10',
        // is_online: true
      });
    })
    .catch(err => {
      console.error('webhook err', meta.token, err);
      return dbService('bot').where({
        id: meta.id,
      }).update({
        status: '11',
        // is_online: false
      });
    });
  DOBOTS[meta.id] = bot;
  DOBOT_TOKENS.push(meta.token);
}

dbService('bot').where({
  status: '10'
}).then(bots => {
  bots.forEach(bot => {
    attachBot(bot);
  });
})

socket.on('botStatusChange', async data => {
  console.log(data);
  let { id, status } = data;
  if (status == 10) {
    dbService('bot')
      .where({ id: id })
      .first()
      .then(bot => {
        attachBot(bot);
      });
  } else if (status == 11) {
    let bot = DOBOTS[id];
    if (bot) {
      bot.setWebhook(null);
      delete DOBOTS[id];
    }
  }
});

app.listen(3000)
