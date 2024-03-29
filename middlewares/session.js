const dbService = require('../services/db');
const { getSessionKey } = require('../common/utils');

class MySQLSession {
  constructor(options) {
    this.options = Object.assign({
      property: 'session',
      getSessionKey: getSessionKey,
      store: {}
    }, options);
    this.sessions = {};
  }

  getSession(bot_id, key) {
    let that = this;
    if (this.sessions[key]) 
      return { then: function (fn) { fn(that.sessions[key]) } }
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
        this.sessions[key] = session
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
      const that = this;
      if (!key) {
        return next()
      }
      return this.getSession(bot_id, key).then(() => {
        Object.defineProperty(ctx, this.options.property, {
          get: function () { return that.sessions[key] },
          set: function (newValue) { that.sessions[key] = Object.assign({}, newValue) }
        })
        return next().then(() => {
          return this.saveSession(bot_id, key, that.sessions[key])
        })
      })
    }
  }
}

module.exports = new MySQLSession()