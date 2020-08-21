const Telegraf = require('telegraf');
const Koa = require('koa')
const KoaBody = require('koa-body');
const fs = require('fs');
const configure = require('./bot');
const dbService = require('./services/db');
const { webhook } = require('./config');
const { socket } = require('./services/socket');
const knex = require('./services/db');
const config = require('./config');

const DOBOTS = {};

const app = new Koa();
app.use(KoaBody());
app.use(async (ctx, next) => {
  let token = ctx.url.replace(webhook.path, '');
  if (ctx.method === 'POST' && DOBOTS[token]) {
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
  DOBOTS[meta.token] = bot;
}

dbService('bot').where({
  status: '10'
}).then(bots => {
  bots.forEach(bot => {
    attachBot(bot);
  });
})

socket.on('botStatusChange', async data => {
  let { id, status } = data;
  let bot = await dbService('bot')
    .where({ id: id })
    .first();
  if (status == 10) {
    attachBot(bot);
  } else if (status == 11) {
    let dobot = DOBOTS[bot.token];
    if (dobot) {
      dobot.telegram.setWebhook(null);
      DOBOTS[bot.token] = null;
    }
  }
});

socket.on('newBotNotification', async data => {
  let botNotificationId = data;
  let botNotification = await dbService('bot_notification').where({ id: botNotificationId }).first();
  let bot = await dbService('bot').where({ id: botNotification.botId }).first();
  let mailingTemplate = await dbService('mailing_template').where({ id: botNotification.mailingTemplateId }).first();
  let botUsers = await knex('bot_user')
    .where({
      botId: bot.id
    });
  let dobot = DOBOTS[bot.token];
  if (!dobot) {
    attachBot(bot);
    dobot = DOBOTS[bot.token];
  }
  let photo = null;
  if (mailingTemplate.thumbnail)
    photo = fs.readFileSync(config.mediaPath + '/mailing-templates/' + mailingTemplate.thumbnail);
  botUsers.forEach(user => {
    if (photo)
      bot.telegram.sendPhoto(user.tg_id, photo, {
        caption: mailingTemplate.ru_description
      });
    else 
      bot.telegram.sendMessage(user.tg_id, mailingTemplate.ru_description)
  });
})

app.listen(3000)
