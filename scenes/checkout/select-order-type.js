const Markup = require('telegraf/markup');
const WizardScene = require('telegraf/scenes/wizard');
const Composer = require('telegraf/composer');
const { match } = require('telegraf-i18n');
const _ = require('lodash');
const dbService = require('../services/db');

const _types_ = {
  selfService: 0,
  delivery: 1,
}

module.exports = new WizardScene(
  'select-order-type',
  async ctx => {
    ctx.replyWithMarkdown(
      'Заберите свой заказ *самостоятельно* или выберите *доставку*',
      Markup.keyboard([
        '🚘 Доставка', '🏃 Самовывоз',
        ctx.i18n.t('back')
      ], { columns: 2 }).resize().extra()
    );
    ctx.wizard.next();
  },
  new Composer()
    .hears(match('back'), ctx => {
      ctx.scene.enter('menu');
    })
    .hears('🚘 Доставка', ctx => {
      ctx.scene.state.type = _types_.delivery;
      ctx.replyWithMarkdown(
        `Куда нужно доставить ваш заказ 🚙?\nОтправьте свою локацию 📍 и мы определим ближайший к вам филиал и стоимость доставки 💵.`,
        Markup.keyboard([
          Markup.locationRequestButton('📍 Моя локация'),
          ctx.i18n.t('back'),
        ], { columns: 1 }).resize().extra()
      );
      ctx.wizard.next();
    })
    .hears('🏃 Самовывоз', ctx => {
      ctx.scene.state.type = _types_.selfService;
      ctx.replyWithMarkdown(
        `Где вы находитесь 👀?  Если вы отправите локацию 📍, мы определим ближайший к вам филиал`,
        Markup.keyboard([
          Markup.locationRequestButton('📍 Моя локация'),
          ctx.i18n.t('back'),
        ], { columns: 1 }).resize().extra()
      );
      ctx.wizard.next();
    })
    .on('text', ctx => {
      ctx.scene.reenter();
    }),
  new Composer()
    .hears(match('back'), ctx => {
      ctx.scene.reenter();
    })
    .on('location', ctx => {
      ctx.scene.state.location = ctx.message.location;
      const { type } = ctx.scene.state;
      ctx.scene.enter(
        type == _types_.delivery ? 'delivery' : 'self-service',
        {
          ...ctx.scene.state,
          origin: 'select-order-type'
        }
      );
    })
    .on('text', ctx => {
      ctx.scene.state.address = ctx.message.text;
      ctx.replyWithMarkdown(
        'Мы не можем определить расстояние до вас, когда вы вводите адрес вручную 😔\nКакой филиал выберите?',
        Markup.keyboard([
          Markup.locationRequestButton('📍 Узнать ближайший филиал'),
          ctx.i18n.t('back'),
        ], { columns: 1 }).resize().extra()
      )
    })
)