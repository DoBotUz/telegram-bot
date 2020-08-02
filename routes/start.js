const Markup = require('telegraf/markup');

module.exports = ctx => {
  ctx.replyWithMarkdown(
    'Вкусный плов в офис или на дом',
    Markup.keyboard([
      '📙 Меню', 'ℹ️ Инфо',
      '🧺 Корзина',
      '⚙️ Настройки'
    ], { columns: 2}).resize().extra()
  )
}