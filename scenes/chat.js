const Markup = require('telegraf/markup');
const WizardScene = require('telegraf/scenes/wizard');
const Composer = require('telegraf/composer');
const { match } = require('telegraf-i18n');
const dbService = require('../services/db');
const { socket } = require('../services/socket');

module.exports = new WizardScene(
  'chat',
  async ctx => {
    ctx.replyWithMarkdown(
      'Отправьте вопрос и мы предоставим Вам оперативный ответ.',
      Markup.keyboard([
        ctx.i18n.t('back')
      ]).resize().extra()
    );
    ctx.wizard.next()
  },
  new Composer()
    .hears([match('back')], async ctx => {
      ctx.scene.leave();
      ctx.scene.enter('feedback');
    })
    .on('text', async (ctx, next) => {
      socket.emit('chat', {
        from: ctx.user.id,
        type: 'text',
        text: ctx.message.text,
        organizationId: ctx.meta.organizationId
      })
    })
    .on('photo', async (ctx, next) => {
      let path = ''; // TODO download photo
      socket.emit('chat', {
        from: ctx.user.id,
        type: 'photo',
        text: path
      })
    })
    .on('location', async (ctx, next) => {
      socket.emit('question', {
        from: ctx.user.id,
        type: 'location',
        text: JSON.stringify({
          lat: ctx.message.location.latitude,
          lng: ctx.message.location.longitude
        })
      })
    })
)