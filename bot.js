require('./routes');
const session = require('./middlewares/session');
const webhookPing = require('./middlewares/webhookPing');
const setUserInfo = require('./middlewares/setUserInfo');
const socket = require('./services/socket');
const knex = require('./services/db');
const
	Telegraf = require('telegraf'),
	I18n = require('telegraf-i18n'),
	Markup = require('telegraf/markup'),
	Stage = require('telegraf/stage'),
	path = require('path'),
	scenes = require('./scenes'),
	config = require('./config.js'),
  { match } = I18n;  

const i18n = new I18n({
  useSession: true,
  directory: path.resolve(__dirname, 'locales'),
  defaultLanguage: 'ru',
})
const stage = new Stage(scenes);

function configure(bot) {
  bot.use(session.middleware());
  bot.use((ctx, next) => {
    if (ctx.chat && ctx.chat.type !== 'private')
      return;
    return next(ctx);
  });
  bot.use(setUserInfo);
  bot.use(i18n.middleware());
  bot.use(webhookPing);
  bot.command(['start', 'stop', 'restart'], async (ctx, next) => {
    if (!ctx.user) {
      return next(ctx);
    }
    ctx.session.__scenes = {};
    return global.routes.start(ctx);
  });
  bot.use(stage.middleware());
  bot.use(async (ctx, next) => {
    if (!ctx.user) {
      return ctx.scene.enter('register');
    }
    next(ctx);
  });

  bot.hears('📙 Меню', ctx => {
    ctx.scene.enter('menu')
  });
  bot.hears('⚙️ Настройки', ctx => {
    ctx.scene.enter('settings');
  });
  bot.hears('✍️ Оставить отзыв', ctx => {
    ctx.scene.enter('feedback');
  });
  bot.hears('ℹ️ Инфо', global.routes.info);

  bot.on('text', ctx => ctx.reply(ctx.i18n.t('tap-on-buttons')));

  bot.start((ctx) => global.routes.start(ctx));

  bot.catch(err => {
    console.log("(Bot) Unhandled Exception:", err);
  })
}

module.exports = configure;
