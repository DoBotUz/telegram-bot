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
  let sent_count = 0;
  if (mailingTemplate.thumbnail)
    photo = fs.readFileSync(config.mediaPath + '/mailing-templates/' + mailingTemplate.thumbnail);
  botUsers.forEach(async user => {
    sent_count++;
    if (photo)
      dobot.telegram.sendPhoto(user.tg_id,
        { source: photo },
        { caption: mailingTemplate.ru_description }
      )
    else
      dobot.telegram.sendMessage(user.tg_id, mailingTemplate.ru_description)
    if (sent_count >= botUsers.length) {
      await dbService('mailing_template')
        .where({ id: mailingTemplate.id })
        .update({ status: 11 });
      await dbService('bot_notification')
        .where({ id: botNotificationId })
        .update({ status: 10 });
    }
  });
});

socket.on('newMessage', async data => {
  const message = JSON.parse(data);
  if (!message.sent_by_operator) {
    return;
  }
  const bot = await knex('bot').where({
    organizationId: message.organizationId
  }).first();
  const user = await knex('bot_user').where({
    id: message.recipient
  }).first();
  if (!user) return;
  let dobot = DOBOTS[bot.token];
  if (!dobot) {
    attachBot(bot);
    dobot = DOBOTS[bot.token];
  }
  dobot.telegram.sendMessage(user.tg_id, message.text);
});

app.listen(3000)

process.on('unhandledRejection', function(reason, p){
  console.log("Possibly Unhandled Exception at: Promise ", p, " reason: ", reason);
});