const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "KoTA102",
  password: "root",
  port: 5434,
});

module.exports = pool;
