const Markup = require('telegraf/markup');
const WizardScene = require('telegraf/scenes/wizard');
const Composer = require('telegraf/composer');
const { match } = require('telegraf-i18n');
const dbService = require('../services/db');
const { findKeyByValue } = require('../common/utils');

const stars = {
  5: '⭐⭐⭐⭐⭐',
  4: '⭐⭐⭐⭐',
  3: '⭐⭐⭐',
  2: '⭐⭐',
  1: '⭐'
}

module.exports = new WizardScene(
  'feedback',
  async ctx => {
    ctx.replyWithMarkdown(
      'Оцените нашу работу по 5-бальной шкале.',
      Markup.keyboard([
        ...Object.values(stars),
        ctx.i18n.t('back')
      ], { columns: 1 }).resize().extra()
    );
    ctx.wizard.next();
  },
  new Composer()
    .hears(Object.values(stars), ctx => {
      ctx.scene.state.rate = findKeyByValue(stars, ctx.message.text);
      ctx.replyWithMarkdown(
        'Оставьте свой отзыв в виде сообщения, аудио, видео или фото:',
        Markup.keyboard([
          ctx.i18n.t('back')
        ]).resize().extra()
      );
      ctx.wizard.next();
    })
    .hears(match('back'), ctx => {
      ctx.scene.leave();
      return global.routes.start(ctx);
    }),
  new Composer()
    .hears(match('back'), ctx => {
      ctx.scene.reenter();
    })
    .on(['text', 'photo', 'video', 'audio', 'voice'], async ctx => {
      let comment = ctx.message.text ? ctx.message.text : await getUrl(ctx);
      dbService('feedback').insert({
        type: getMessageType(ctx.message),
        bot_user_id: ctx.user.id,
        comment: comment
      }).then(res => {
        ctx.replyWithMarkdown('Спасибо за ваш отзыв!');
        ctx.scene.leave();
        return global.routes.start(ctx);
      })
    })
)

function getMessageType(message) {
  switch (true) {
    case Boolean(message.text):
      return 'text';
    case Boolean(message.audio):
      return 'audio';
    case Boolean(message.photo):
      return 'photo';
    case Boolean(message.voice):
      return 'voice';
    case Boolean(message.video):
      return 'video';
  }
}

async function getUrl(ctx) {
  const message = ctx.message;
  switch (true) {
    case Boolean(message.audio):
      return getAudioUrl(ctx, message.audio)
    case Boolean(message.photo):
      return getPhotoUrl(ctx, message.photo)
    case Boolean(message.voice):
      return getVoiceUrl(ctx, message.voice)
    case Boolean(message.video):
      return getVideoUrl(ctx, message.video)
  }
}

async function getPhotoUrl(bot, photo) {
  let file_id = photo[photo.length - 1].file_id
  let url = await bot.telegram.getFileLink(file_id)
  return url
}

async function getVoiceUrl(bot, voice) {
  let url = await bot.telegram.getFileLink(voice.file_id)
  return url
}

async function getAudioUrl(bot, audio) {
  let url = await bot.telegram.getFileLink(audio.file_id)
  return url
}

async function getVideoUrl(bot, video) {
  let url = await bot.telegram.getFileLink(video.file_id)
  return url
}

function getSendMethod(fileType) {
  switch (fileType) {
    case 'photo':
      return 'sendPhoto';
    case 'video':
      return 'sendVideo';
    case 'audio':
      return 'sendAudio';
    case 'voice':
      return 'sendVoice';
    default:
      throw Exception('unknown type');
  }
}