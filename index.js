'use strict';

const { Pool } = require('pg');

function makeBindParams(begin, count) {
  return Array(count).fill().map((_, i) => `$${begin + i}`);
}

class Model {
  static define(pool, options = {}) {
    this.pool = pool;
    this.tableName = options.tableName || this.name.toLowerCase() + 's';
  }

  static execute(sql) {
    console.log('debug:', sql);

    return this.pool.query(sql).then((response) => response.rows);
  }

  static take() {
    const sql = `SELECT * FROM ${this.tableName} LIMIT 1;`;

    return this.execute(sql).then((rows) => rows.shift());
  }

  static create(params) {
    const columns = Object.keys(params);
    const values = Object.values(params);

    const bindParams = makeBindParams(1, values.length).join(',');
    const text = `INSERT INTO ${this.tableName} (${columns.join(',')}) VALUES (${bindParams});`;

    return this.execute({ text, values }).then((rows) => rows.shift());
  }
}

module.exports = {
  Pool,
  Model,
};
