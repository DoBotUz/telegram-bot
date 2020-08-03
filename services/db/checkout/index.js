const { getProductsInCart } = require("../menu");
const dbService = require('..');

const ORDER_STATUSES = {
  ACTIVE: 10,
  MODERATION: 9,
  CANCELED: 0,
  PAID: 11,
  DELIVERED: 12,
};

const PAYMENT_TYPES = {
  CASH: 10,
  CARD: 0,
}

async function createOrder({ client, cart, location, address, payment_type, delivery_charge }) {
  const products = await getProductsInCart(cart);
  const total_charge = products.reduce((p, c) => {
      return p + cart[c.id]*c.price;
  }, 0);
  return dbService('order')
    .insert({
      address,
      lat: location ? location.latitude : null,
      lng: location ? location.longitude : null,
      payment_type: PAYMENT_TYPES[payment_type],
      total_charge,
      delivery_charge,
      bot_user_id: client.id,
      phone: client.phone_number,
      status: ORDER_STATUSES.MODERATION,
    }).then(async (order) => {
      await dbService('order_item')
        .insert(products.map(prod => ({
          order_id: order[0],
          item_id: prod.id,
          amount: cart[prod.id]
        })));
      return order[0];
    });
}

module.exports = {
  createOrder,
  PAYMENT_TYPES,
}