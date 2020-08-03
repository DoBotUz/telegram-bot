module.exports = function(ctx, next) {
  ctx.reply('...')
    .then(res => {
      console.log(res);
      if (res.message_id) {
        ctx.telegram.deleteMessage(ctx.from.id, res.message_id);
      }
    });
  next(ctx);
}