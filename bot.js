const session = require('./middlewares/session');

function configure(bot) {
  bot.use(session.middleware())
  bot.start((ctx) => ctx.reply('Welcome'))
  bot.help((ctx) => ctx.reply('Send me a sticker'))
  bot.on('sticker', (ctx) => ctx.reply('👍'))
  bot.hears('hi', (ctx) => ctx.reply('Hey there'))
}

module.exports = configure;
