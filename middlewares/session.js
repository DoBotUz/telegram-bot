const dbService = require('../services/db');

var sessions = {}

class MySQLSession {
  constructor(options) {
    this.options = Object.assign({
      property: 'session',
      getSessionKey: (ctx) => {
        if (!ctx.from || !ctx.chat) {
          return
        }
        return `${ctx.chat.id}:${ctx.from.id}`
      },
      store: {}
    }, options)
  }

  getSession(bot_id, key) {
    if (sessions[key]) return { then: function (fn) { fn(sessions[key]) } }
    return dbService('sessions').where({ id: key, bot_id: bot_id }).first()
      .then(json => {
        let session = {}
        if (json) {
          try {
            session = JSON.parse(unescape(json.session))
          } catch (error) {
            console.error('Parse session state failed', error)
          }
        }
        sessions[key] = session
        return session
      })
      .catch(err => {
        console.error(err);
      })
  }

  saveSession(bot_id, key, session) {
    if (!session || Object.keys(session).length === 0) {
      return dbService('sessions').where({ id: key, bot_id }).delete();
    }

    const sessionString = escape(JSON.stringify(session))
    return dbService.raw(
      `INSERT INTO sessions(bot_id, id, session) value("${bot_id}", "${key}", "${sessionString}")
        on duplicate key update session="${sessionString}";`
    ).catch(err => {
      console.error(err);
    })
  }

  middleware() {
    return (ctx, next) => {
      const key = this.options.getSessionKey(ctx)
      const bot_id = ctx.meta.id;
      if (!key) {
        return next()
      }
      return this.getSession(bot_id, key).then(() => {
        Object.defineProperty(ctx, this.options.property, {
          get: function () { return sessions[key] },
          set: function (newValue) { sessions[key] = Object.assign({}, newValue) }
        })
        return next().then(() => {
          return this.saveSession(bot_id, key, sessions[key])
        })
      })
    }
  }
}

module.exports = new MySQLSession()