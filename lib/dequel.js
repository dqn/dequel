'use strict';

const { Pool } = require('pg');

function makeBindParams(begin, count) {
  return Array(count).fill().map((_, i) => `$${begin + i}`);
}

function listTableColumns(pool, tableName) {
  const text = `
    SELECT
      t1.column_name,
      t3.constraint_type = 'PRIMARY KEY' AS is_primary_key
    FROM
      information_schema.columns AS t1
      LEFT OUTER JOIN information_schema.constraint_column_usage AS t2 ON (
        t1.table_schema = t2.table_schema
        AND t1.table_name = t2.table_name
        AND t1.column_name = t2.column_name
      )
      LEFT OUTER JOIN information_schema.table_constraints AS t3 ON (
        t2.table_schema = t3.table_schema
        AND t2.table_name = t3.table_name
        AND t2.constraint_name = t3.constraint_name
      )
    WHERE
      t1.table_schema = 'public'
      AND t1.table_name = $1
    ;`;

  return pool.query({ text, values: [ tableName ] });
}

class Model {
  constructor(obj = {}) {
    for (const [ key, value ] of Object.entries(obj)) {
      this[key] = value;
    }
  }

  static async initialize(pool, options = {}) {
    this.pool = pool;

    this.tableName = options.tableName || this.name.toLowerCase() + 's';
    const { rows } = await listTableColumns(this.pool, this.tableName);
    this.primaryKey = rows.find((item) => item.is_primary_key).column_name;
    this.columns = rows.map((item) => item.column_name);
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

  static find(primaryKey) {
    const text = `SELECT ${this.columns.join(',')} FROM ${this.tableName} WHERE ${this.primaryKey} = $1;`;

    return this.execute({ text, values: [ primaryKey ] }).then((rows) => rows.shift());
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
    const text = `SELECT ${this.columns.join(',')} FROM ${this.tableName} WHERE ${condition};`;

    return this.execute({ text, values });
  }
}

module.exports = {
  Pool,
  Model,
};
