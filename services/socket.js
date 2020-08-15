const io = require('socket.io-client');
const config = require('../config');
const socket = io(config.ws_url);
socket.on('event', console.log);
socket.on('disconnect', console.log);
socket.on('error', err => console.log)
socket.on('connect', () => {
  console.log('connected');
});

module.exports = socket;