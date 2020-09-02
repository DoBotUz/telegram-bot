const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const dbService = require('../services/db');
const fs = require('fs');
const config = require('../config.js');

module.exports = async ctx => {
  const organization = await dbService('organization')
    .where({ id: ctx.meta.organizationId })
    .first();
  if (organization.thumbnail) {
    ctx.replyWithPhoto(
      { source: fs.readFileSync(config.mediaPath + '/organizations/' + organization.thumbnail) },
      Extra.caption(organization[`${ctx.i18n.locale()}_description`])
    );
  } else {
    ctx.reply(organization[`${ctx.i18n.locale()}_description`]);
  }
}