const { getUser } = require('../services/db/user');


module.exports = async function(ctx, next) {
  let user = await getUser({
    bot_id: ctx.meta.id,
    tg_id: ctx.from.id
  });
  ctx.user = user;
  next();
}