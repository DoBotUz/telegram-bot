const knex = require("..");

function signUp({
  botId,
  tg_id,
  first_name,
  last_name,
  phone_number,
  username,
  bio,
  language,
  organizationId
}) {
  return knex('bot_user').insert({
    botId,
    tg_id,
    first_name,
    last_name,
    phone_number,
    username,
    bio,
    language,
    status: '10',
    organizationId
  }).then(res => res[0]);
}

function getUser({ botId, tg_id }) {
  return knex('bot_user')
    .where({ botId, tg_id })
    .first()
}

function saveUserInfo(botId, tg_id, info) {
  return getUser({botId, tg_id}).update(info)
  
}

module.exports = {
  signUp,
  getUser,
  saveUserInfo
}