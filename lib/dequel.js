'use strict';

const { Pool } = require('pg');

function makeBindParams(begin, count) {
  return Array(count).fill().map((_, i) => `$${begin + i}`);
}

class Model {
  static columns = [];
  static primaryKey = 'id';

  constructor(obj = {}) {
    for (const [ key, value ] of Object.entries(obj)) {
      this[key] = value;
    }
  }

  static init(pool, options = {}) {
    this.pool = pool;
    this.tableName = options.tableName || this.name.toLowerCase() + 's';
  }

  static execute(query) {
    return this.pool.query(query).then((item) => item.rows.map(row => new this(row)));
  }

  static take() {
    const columns = this.columns.join(',') || '*';
    const sql = `SELECT ${columns} FROM ${this.tableName} LIMIT 1;`;

    return this.execute(sql).then((rows) => rows.shift());
  }

  static count() {
    const sql = `SELECT COUNT(*) FROM ${this.tableName};`;

    return this.execute(sql).then((rows) => Number(rows.shift().count));
  }

  static create(params = {}) {
    const columns = Object.keys(params);
    const values = Object.values(params);

    if (!columns.length) {
      return this.execute(`INSERT INTO ${this.tableName} DEFAULT VALUES;`);
    }

    const bindParams = makeBindParams(1, values.length).join(',');
    const text = `INSERT INTO ${this.tableName} (${columns.join(',')}) VALUES (${bindParams}) RETURNING ${this.columns.join(',')};`;

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
