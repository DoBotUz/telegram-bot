const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const WizardScene = require('telegraf/scenes/wizard');
const Composer = require('telegraf/composer');
const { match } = require('telegraf-i18n');
const dbService = require('../services/db');
const { rangeKeyboard, isCartEmpty, formatMoney } = require('../common/utils');
const _ = require('lodash');
const config = require('../config.js');
const fs = require('fs');

function buildProductDescription(product) {
  return `${product.name}\n\n${product.description}\n\nЦена: ${formatMoney(product.price)} сум`
}

module.exports = new WizardScene(
  'menu',
  async ctx => {
    ctx.scene.state.prev_category = [];
    ctx.scene.state.parent_category = null;
    dbService('category').where({
      bot_id: ctx.meta.id,
      parent_category_id: ctx.scene.state.parent_category
    }).then(categories => {
      sendMsgWithCategories(ctx, categories);
    });
    ctx.wizard.next();
  },
  BasicComposer()
    .hears(match('back'), ctx => {
      let parent_category = ctx.scene.state.prev_category.pop();
      if (!ctx.scene.state.parent_category) {
        ctx.scene.leave();
        return global.routes.start(ctx);
      }
      dbService('category').where({
        bot_id: ctx.meta.id,
        parent_category_id: parent_category
      }).then(categories => {
        ctx.scene.state.parent_category = parent_category;
        sendMsgWithCategories(ctx, categories);
      });
      ctx.scene.state.product = null;
    })
    .on('text', ctx => {
      if (ctx.scene.state.product) {
        return dbService('item')
          .where({
            ru_title: ctx.message.text,
            category_id: ctx.scene.state.parent_category
          })
          .first()
          .then(product => {
            ctx.scene.state.product = product;
            if (product.photo) {
              ctx.replyWithPhoto({
                source: fs.readFileSync(config.mediaPath + '/items/' + product.photo)
              }, Extra
                  .caption(buildProductDescription(product))
                  .markdown()
                  .markup(Markup.keyboard([
                    ...rangeKeyboard(1, 9),
                    [ctx.i18n.t('back')]
                  ]).resize())
              )
            } else {
              ctx.replyWithMarkdown(
                buildProductDescription(product),
                Markup.keyboard([
                  ...rangeKeyboard(1, 9),
                  [ctx.i18n.t('back')]
                ]).resize().extra()
              );
            }
            ctx.wizard.next();
          });
      }

      dbService('category').where({
        ru_title: ctx.message.text,
        parent_category_id: ctx.scene.state.parent_category
      })
        .first()
        .then(async res => {
          if (res.id !== ctx.scene.state.parent_category)
            ctx.scene.state.prev_category.push(ctx.scene.state.parent_category);
          ctx.scene.state.parent_category = res.id;

          const categories = await dbService('category').where({
            parent_category_id: res.id
          });
          if (categories.length == 0) {
            ctx.scene.state.product = true;
            const products = await dbService('item').where({
              category_id: res.id
            });
            return sendMsgWithProducts(ctx, products);
          }
          sendMsgWithCategories(ctx, categories);
        });
    }),
  BasicComposer()
    .hears(match('back'), ctx => {
      let parent_category = ctx.scene.state.parent_category;
      dbService('item').where({
        category_id: parent_category
      }).then(products => {
        // ctx.scene.state.product = null;
        ctx.wizard.back();
        sendMsgWithProducts(ctx, products);
      });
    })
    .hears(/\d+/, async ctx => {
      let amount = Number(ctx.message.text);
      if (amount <= 0) {
        return ctx.replyWithMarkdown('Введите корректное количество блюда');
      }

      if (!ctx.session.cart) {
        ctx.session.cart = {};
      }

      let amountInCart = ctx.session.cart[ctx.scene.state.product.id] || 0;
      ctx.session.cart[ctx.scene.state.product.id] = amountInCart + amount;
      await ctx.replyWithMarkdown(
        'Товар добавлен в корзину'
      );
      let parent_category = ctx.scene.state.parent_category;
      dbService('item').where({
        category_id: parent_category
      }).then(products => {
        ctx.scene.state.product = null;
        ctx.wizard.back();
        sendMsgWithProducts(ctx, products);
      });
    })
);


function sendMsgWithCategories(ctx, categories) {
  ctx.replyWithMarkdown(
    'Выберите категорию',
    Markup.keyboard([
      ['🧺 Корзина', '🛵 Оформить заказ'],
      ..._.chunk(categories.map(cat => cat.ru_title), 2),
      [ctx.i18n.t('back')]
    ]).resize().extra()
  );
}

function sendMsgWithProducts(ctx, products) {
  return ctx.replyWithMarkdown(
    'Выберите блюдо',
    Markup.keyboard([
      ['🧺 Корзина', '🛵 Оформить заказ'],
      ..._.chunk(products.map(prod => prod.ru_title), 2),
      [ctx.i18n.t('back')]
    ]).resize().extra()
  )
}

function BasicComposer(composer) {
  if (!composer) {
    composer = new Composer();
  }

  return composer
    .hears('🧺 Корзина', ctx => {
      if (isCartEmpty(ctx.session.cart)) {
        return ctx.replyWithMarkdown('Корзина пуста');
      }
      ctx.scene.enter('cart', {
        origin: 'menu'
      });
    })
    .hears('🛵 Оформить заказ', ctx => {
      if (isCartEmpty(ctx.session.cart)) {
        return ctx.replyWithMarkdown('Корзина пуста');
      }
      ctx.scene.enter('order', {
        origin: 'menu'
      });
    });
}