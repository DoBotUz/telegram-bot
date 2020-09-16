const Markup = require('telegraf/markup');

module.exports = ctx => {
  return ctx.replyWithMarkdown(
    'Привет!',
    Markup.keyboard([
      ['📙 Меню'],
      ['✍️ Оставить отзыв', 'ℹ️ Инфо'],
      ['⚙️ Настройки']
    ], { columns: 2}).resize().extra()
  )
}