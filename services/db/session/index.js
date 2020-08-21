const knex = require('..');

function saveSession(bot_id, key, session) {
  knex('sessions').where({
    bot_id,
    key
  }).update({
    session: escape(JSON.stringify(session))
  })
}

module.exports = {
  saveSession,
}