const Markup = require('telegraf/markup');
const WizardScene = require('telegraf/scenes/wizard');
const Composer = require('telegraf/composer');
const { match } = require('telegraf-i18n');
const dbService = require('../services/db');
const { isCartEmpty } = require('../common/utils');
const _ = require('lodash');

async function buildCheque(ctx) {
  const products = await dbService('item')
    .whereIn('id', Object.keys(ctx.session.cart).filter(id => ctx.session.cart[id]));
  const text = products.map(product => (
    `*${product.ru_title}*\n` +
    `${ctx.session.cart[product.id]} x ${product.price} = ${ctx.session.cart[product.id] * product.price} сум`
  )).join('\n\n');
  const total = products.reduce((p, c) => {
    return p + ctx.session.cart[c.id] * c.price;
  }, 0);

  return {
    text: '📥 Корзина:\n\n' + text + `\n\n*Итого:* ${total} сум`,
    keyboard: [
      '🔄 Очистить',
      ...products.map(prod => `❌ ${prod.ru_title}`),
      ctx.i18n.t('back')
    ]
  }
}

module.exports = new WizardScene(
  'cart',
  async ctx => {
    if (isCartEmpty(ctx.session.cart)) {
      await ctx.replyWithMarkdown('Корзина пуста');
      return ctx.scene.leave();
      // return global.routes.start(ctx)
    }

    await ctx.replyWithMarkdown('«❌ Наименование» - удалить одну позицию\n«🔄 Очистить» - полная очистка корзины');
    const { text, keyboard } = await buildCheque(ctx);
    ctx.replyWithMarkdown(
      text,
      Markup.keyboard(keyboard).resize().extra()
    );
    ctx.wizard.next();
  },
  new Composer()
    .hears(match('back'), ctx => {
      if (ctx.scene.state.origin) {
        return ctx.scene.enter(ctx.scene.state.origin);
      }
      ctx.scene.leave();
      return global.routes.start(ctx);
    })
    .hears(/^❌ .+/, async ctx => {
      let name = ctx.message.text.replace('❌ ', '');
      let product = await dbService('item').where({ ru_title: name }).first();
      delete ctx.session.cart[product.id];
      if (isCartEmpty(ctx.session.cart)) {
        await ctx.replyWithMarkdown('Корзина пуста');
        ctx.scene.leave();
        return global.routes.start(ctx);
      }
      ctx.scene.reenter();
    })
    .hears('🔄 Очистить', async ctx => {
      ctx.session.cart = {};
      ctx.scene.leave();
      await ctx.replyWithMarkdown('Корзина очищена');
      global.routes.start(ctx);
    })
)