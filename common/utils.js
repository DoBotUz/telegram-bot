const _ = require('lodash');

function rangeKeyboard(min, max, size = 3) {
  let arr = new Array(max - min + 1).fill(0).map((el, i) => (i + min).toString());
  return _.chunk(arr, size);
}

function isCartEmpty(cart) {
  return !cart || Object.keys(cart).filter(id => cart[id]).length == 0;
}

function formatMoney(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
}

function strikeThrough(text) {
  return text
    .split('')
    .map(char => char + '\u0336')
    .join('')
}

function findKeyByValue(object, value) {
  return Object.keys(object).find(key => obj[key] === value);
}

module.exports = {
  rangeKeyboard,
  isCartEmpty,
  formatMoney,
  strikeThrough,
  findKeyByValue,
}