const Markup = require('telegraf/markup');

module.exports = ctx => {
  return ctx.replyWithMarkdown(
    'Привет!',
    Markup.keyboard([
      '📙 Меню', 'ℹ️ Инфо',
      '✍️ Оставить отзыв', '⚙️ Настройки'
    ], { columns: 2}).resize().extra()
  )
}