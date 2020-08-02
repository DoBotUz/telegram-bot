const knex = require("..");

function signUp({
  bot_id,
  tg_id,
  first_name,
  last_name,
  phone_number,
  username,
  bio,
  language
}) {
  return knex('bot_user').insert({
    bot_id,
    tg_id,
    first_name,
    last_name,
    phone_number,
    username,
    bio,
    language,
    status: 10
  }).then(res => res[0]);
}

function getUser({ bot_id, tg_id }) {
  return knex('bot_user')
    .where({ bot_id, tg_id }).first();
}

module.exports = {
  signUp,
  getUser,
}