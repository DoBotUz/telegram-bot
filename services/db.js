const config = require('../config.js');
const knex = require("knex")({
  client: 'mysql',
  connection: config.db
});

const io = require('socket.io-client');
const socket = io('http://localhost:4000');
socket.on('event', console.log);
socket.on('disconnect', console.log);
socket.on('error', err => console.log)
socket.on('connect', () => {
  console.log('connected');
});

module.exports = {
  dbService: knex,
}