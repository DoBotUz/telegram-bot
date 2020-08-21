const Markup = require('telegraf/markup');
const WizardScene = require('telegraf/scenes/wizard');
const Composer = require('telegraf/composer');
const { match } = require('telegraf-i18n');
const { languages } = require('../common/constants');
const { findKeyByValue, getSessionKey } = require('../common/utils');
const { saveSession } = require('../middlewares/session');
const { saveUserInfo } = require('../services/db/user');

module.exports = new WizardScene(
  'settings',
  async ctx => {
    ctx.replyWithMarkdown(
      ctx.i18n.t('settings-info', {
        name: ctx.user.bio,
        phone: ctx.user.phone_number,
        lang: languages[ctx.i18n.locale()]
      }),
      Markup.keyboard([
        ctx.i18n.t('change-name'),
        ctx.i18n.t('change-phone'),
        ctx.i18n.t('change-lang'),
        ctx.i18n.t('back')
      ], { columns: 1 }).resize().extra()
    );
    ctx.wizard.next()
  },
  new Composer()
    .hears(match('back'), ctx => {
      ctx.scene.leave();
      return global.routes.start(ctx);
    })
    .hears(match('change-name'), ctx => {
      ctx.scene.state.step = 'name';
      ctx.replyWithMarkdown(
        ctx.i18n.t('enter-name'),
        Markup.keyboard([
          ctx.i18n.t('back')
        ]).resize().extra()
      );
      ctx.wizard.next();
    })
    .hears(match('change-phone'), ctx => {
      ctx.scene.state.step = 'phone';
      ctx.replyWithMarkdown(
        ctx.i18n.t('enter-phone'),
        Markup.keyboard([
          Markup.contactRequestButton(ctx.i18n.t('my-number')),
          ctx.i18n.t('back')
        ], { columns: 1 }).resize().extra()
      );
      ctx.wizard.next();
    })
    .hears(match('change-lang'), ctx => {
      ctx.scene.state.step = 'lang';
      ctx.reply(
        ctx.i18n.t('select-language'),
        Markup.keyboard([
          ...Object.values(languages),
          ctx.i18n.t('back')
        ]).resize().extra()
      );
      ctx.wizard.next();
    }),
  new Composer()
    .hears(match('back'), ctx => {
      ctx.scene.reenter();
    })
    .on('contact', async ctx => {
      if (ctx.scene.state.step === 'phone') {
        let phone = ctx.message.contact.phone_number.replace(/\+/g, '');
        await saveUserInfo(ctx.meta.id, ctx.from.id, { phone_number: phone });
        ctx.scene.reenter();
      }
    })
    .hears(/^\+?(998)?( |\-)?\d{2}( |\-)?\d{3}( |\-)?\d{2}( |\-)?\d{2}/, async ctx => {
      if (ctx.scene.state.step === 'phone') {
        let phone = ctx.message.text.replace(/\+| |\-/g, '');
        await saveUserInfo(ctx.meta.id, ctx.from.id, { phone_number: phone });
        ctx.scene.reenter();
      }
    })
    .hears(Object.values(languages), async ctx => {
      if (ctx.scene.state.step === 'lang') {
        ctx.i18n.locale(findKeyByValue(languages, ctx.message.text));
        await saveSession(ctx.meta.id, getSessionKey(ctx), ctx.session);
        await saveUserInfo(ctx.meta.id, ctx.from.id, { language: ctx.i18n.locale() });
        ctx.scene.reenter();
      }
    })
    .on('text', async ctx => {
      if (ctx.scene.state.step === 'name') {
        await saveUserInfo(ctx.meta.id, ctx.from.id, { bio: ctx.message.text });
        return ctx.scene.reenter()
      } else if (ctx.scene.state.step === 'phone') {
        return ctx.replyWithMarkdown(
          ctx.i18n.t('enter-phone'),
          Markup.keyboard([
            Markup.contactRequestButton(ctx.i18n.t('my-number')),
            ctx.i18n.t('back')
          ], { columns: 1 }).resize().extra()
        );
      } else if (ctx.scene.state.step === 'lang') {
        return ctx.reply(
          ctx.i18n.t('select-language'),
          Markup.keyboard([
            ...Object.keys(languages),
            ctx.i18n.t('back')
          ]).resize().extra()
        );
      }
      return ctx.scene.reenter();
    })
);