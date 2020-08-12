const { getUser } = require('../services/db/user');


module.exports = async function(ctx, next) {
  let user = await getUser({
    botId: ctx.meta.id,
    tg_id: ctx.from.id
  });
  ctx.user = user;
  next();
}