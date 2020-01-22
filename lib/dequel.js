'use strict';

const { Pool } = require('pg');

function makeBindParams(begin, count) {
  return Array(count).fill().map((_, i) => `$${begin + i}`);
}

class Model {
  static init(pool, options = {}) {
    this.pool = pool;
    this.tableName = options.tableName || this.name.toLowerCase() + 's';
  }

  static execute(query) {
    return this.pool.query(query).then((item) => item.rows);
  }

  static take() {
    const sql = `SELECT * FROM ${this.tableName} LIMIT 1;`;

    return this.execute(sql).then((rows) => rows.shift());
  }

  static count() {
    const sql = `SELECT COUNT(*) FROM ${this.tableName};`;

    return this.execute(sql).then((rows) => Number(rows.shift().count));
  }

  static create(params) {
    const columns = Object.keys(params);
    const values = Object.values(params);

    const bindParams = makeBindParams(1, values.length).join(',');
    const text = `INSERT INTO ${this.tableName} (${columns.join(',')}) VALUES (${bindParams});`;

    return this.execute({ text, values }).then((rows) => rows.shift());
  }

  static where(condition, ...values) {
    const text = `SELECT * FROM ${this.tableName} WHERE ${condition};`;

    return this.execute({ text, values });
  }
}

module.exports = {
  Pool,
  Model,
};
