const dbService = require('..');

function getProductsInCart(cart) {
  return dbService('item').whereIn('id', Object.keys(cart).filter(id => cart[id]))
}

module.exports = {
  getProductsInCart,
}
