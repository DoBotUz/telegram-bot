const config = require('../../config.js');
const knex = require("knex")({
  client: 'mysql',
  connection: config.db
});

module.exports = knex;