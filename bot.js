require('./routes');
const session = require('./middlewares/session');

function configure(bot) {
  bot.use(session.middleware())
  bot.start((ctx) => global.routes.start(ctx));
}

module.exports = configure;
