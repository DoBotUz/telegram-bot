const Markup = require('telegraf/markup');
const WizardScene = require('telegraf/scenes/wizard');
const Composer = require('telegraf/composer');
const {
  languages
} = require('../common/constants');
const { signUp } = require('../services/db/user');
const { findKeyByValue } = require('../common/utils');

module.exports = new WizardScene(
  'register',
  async ctx => {
    ctx.reply(
      ctx.i18n.t('select-language'),
      Markup.keyboard(Object.values(languages)).resize().extra()
    );
    ctx.wizard.next()
  },
  new Composer()
    .hears(Object.values(languages), ctx => {
      const lang_selected = findKeyByValue(languages, ctx.message.text);
      ctx.i18n.locale(lang_selected);
      ctx.replyWithMarkdown(
        ctx.i18n.t('enter-name'),
        Markup.keyboard().removeKeyboard().extra()
      );
      ctx.wizard.next();
    })
    .on('text', ctx => {
      ctx.reply(
        ctx.i18n.t('select-language'),
        Markup.keyboard(Object.values(languages)).resize().extra()
      );
    }),
  new Composer()
    .on('text', ctx => {
      ctx.session.client = {
        name: ctx.message.text
      }
      ctx.replyWithMarkdown(
        ctx.i18n.t('enter-phone'),
        Markup.keyboard([
          Markup.contactRequestButton(ctx.i18n.t('my-number'))
        ]).resize().extra()
      )
      ctx.wizard.next()
    }),
  new Composer()
    .on('contact', (ctx, next) => {
      let phone = ctx.message.contact.phone_number.replace(/\+/g, '');
      ctx.session.client.phone = phone;
      next(ctx);
    })
    .hears(/^\+?(998)?( |\-)?\d{2}( |\-)?\d{3}( |\-)?\d{2}( |\-)?\d{2}/, (ctx, next) => {
      ctx.session.client.phone = ctx.message.text.replace(/\+| |\-/g, '');
      next(ctx);
    })
    .use(async (ctx, next) => {
      if (!ctx.session.client || !ctx.session.client.phone) {
        return next(ctx);
      }
      await signUp({
        bot_id: ctx.meta.id,
        tg_id: ctx.from.id,
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name,
        phone_number: ctx.session.client.phone,
        username: ctx.from.username,
        bio: ctx.session.client.name,
        language: ctx.i18n.locale()
      }).catch(err => console.log('signup', err))
      ctx.session.client = null;
      await ctx.replyWithMarkdown(ctx.i18n.t('register_complete'));
      ctx.scene.leave();
      return global.routes.start(ctx);
    })
    .on('text', async ctx => {
      ctx.replyWithMarkdown(
        ctx.i18n.t('enter-phone'),
        Markup.keyboard([
          Markup.contactRequestButton('my-number')
        ]).resize().extra()
      );
    })
);