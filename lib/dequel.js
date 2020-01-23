'use strict';

const { Pool } = require('pg');

function makeInsertParams(tableColumns, params) {
  const bindParams = [];
  const columns = [];
  const values = [];
  let index = 1;

  for (const column of tableColumns) {
    if (params[column] === void 0) {
      bindParams.push('DEFAULT');
    } else {
      bindParams.push(`$${index++}`);
      columns.push(column);
      values.push(params[column]);
    }
  }

  return { bindParams, columns, values };
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

  static get allColumns() {
    return this.columns.join(',') || '*';
  }

  static execute(query) {
    return this.pool.query(query).then((item) => item.rows.map(row => new this(row)));
  }

  static select(options = {}) {
    const columns = options.columns ? options.columns.join(',') : this.allColumns;
    const clause = options.clause || '';
    const values = options.values || [];

    const text = `SELECT ${columns} FROM ${this.tableName} ${clause};`;

    return this.execute({ text, values });
  }

  static count() {
    const columns = [ 'COUNT(*)' ];

    return this.select({ columns }).then((rows) => Number(rows.shift().count));
  }

  static where(condition, ...values) {
    const clause = `WHERE ${condition}`;

    return this.select({ clause, values });
  }

  static find(condition, ...values) {
    const clause = `WHERE ${condition} LIMIT 1`;

    return this.select({ clause, values }).then((rows) => rows.shift());
  }

  static take() {
    return this.find('TRUE');
  }

  static create(params = {}) {
    const { bindParams, values } = makeInsertParams(this.columns, params);
    const text = `INSERT INTO ${this.tableName} (${this.allColumns}) VALUES (${bindParams.join(',')}) RETURNING ${this.allColumns};`;

    return this.execute({ text, values }).then((rows) => rows.shift());
  }

  save() {
    const { bindParams, columns, values } = makeInsertParams(this.constructor.columns, this);
    const onConflictSQL = columns.map((column) => `${column} = EXCLUDED.${column}`).join(',');

    const text = `
      INSERT INTO ${this.constructor.tableName} (${this.constructor.allColumns})
      VALUES (${bindParams.join(',')})
      ON CONFLICT (${this.constructor.primaryKey})
      DO UPDATE SET ${onConflictSQL}
      RETURNING ${this.constructor.allColumns};`;

    return this.constructor.execute({ text, values }).then((rows) => rows.shift());
  }

  toObject() {
    return this.constructor.columns.reduce((obj, column) =>
      (this[column] === void 0) ? obj : (obj[column] = this[column], obj)
    , {});
  }
}

module.exports = {
  Pool,
  Model,
};
