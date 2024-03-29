const io = require('socket.io-client');
const config = require('../config');
const { id } = require('../scenes/menu');
const socket = io(config.ws_url);
socket.on('event', console.log);
socket.on('disconnect', console.log);
socket.on('error', err => console.log)
socket.on('connect', () => {
  console.log('connected');
});

const KEYS = {
  NEW_ORDER: 1,
  NEW_FEEDBACK: 2,
  NEW_MESSAGE: 3,
  NEW_BOT_USER: 4,
};

const TYPES = {
  INFO: 1,
  WARNING: 2,
};

function sendNotification(org_id, key, key_id, ) {
  socket.emit('newNotification', {
    org_id,
    notification: {
      key_id,
      key
    }
  })
}

function sendFeedbackNotification(org_id, key_id) {
  sendNotification(org_id, KEYS.NEW_FEEDBACK, key_id);
}

function sendOrderNotification(org_id, key_id) {
  sendNotification(org_id, KEYS.NEW_ORDER, key_id);
}

module.exports = {
  socket,
  sendOrderNotification,
  sendFeedbackNotification,
};