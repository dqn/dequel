'use strict';

const { Pool } = require('pg');
const pluralize = require('pluralize');

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

function makeOnConflictSQL({ onConflict, conflictColumns, updateColumns }) {
  const prefix = `ON CONFLICT (${conflictColumns.join(',')})`;

  switch (onConflict) {
    case 'update':
      const updateSql = updateColumns
        .map((column) => `${column} = EXCLUDED.${column}`)
        .join(',');
      return `${prefix} DO UPDATE SET ${updateSql}`;

    case 'nothing':
      return `${prefix} DO NOTHING`;

    default:
      return '';
  }
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
    ;
  `;

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

    this.tableName = options.tableName || pluralize(this.name.toLowerCase());

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

  static select(columns, clause = '', ...values) {
    if (typeof columns !== 'string') {
      if (Array.isArray(columns)) {
        columns = columns.join(',');
      } else {
        columns = this.allColumns;
      }
    }

    const text = `SELECT ${columns} FROM ${this.tableName} ${clause};`;

    return this.execute({ text, values });
  }

  static delete(clause = '', ...values) {
    const text = `DELETE FROM ${this.tableName} ${clause};`;

    return this.execute({ text, values });
  }

  static count(condition = 'TRUE', ...values) {
    const clause = `WHERE ${condition}`;

    return this.select('COUNT(*)', clause, ...values).then((rows) => Number(rows.shift().count));
  }

  static where(condition, ...values) {
    const clause = `WHERE ${condition}`;

    return this.select(null, clause, ...values);
  }

  static find(condition, ...values) {
    const clause = `WHERE ${condition} LIMIT 1`;

    return this.select(null, clause, ...values).then((rows) => rows.shift());
  }

  static take() {
    return this.find('TRUE');
  }

  static all() {
    return this.where('TRUE');
  }

  static create(params = {}, options = {}) {
    const { bindParams, columns, values } = makeInsertParams(this.columns, params);

    const onConflictSQL = makeOnConflictSQL({
      conflictColumns: [ this.primaryKey ],
      updateColumns: columns,
      ...options,
    });

    const text = `
      INSERT INTO ${this.tableName} (${this.allColumns})
      VALUES (${bindParams.join(',')})
      ${onConflictSQL}
      RETURNING ${this.allColumns};
    `;

    return this.execute({ text, values }).then((rows) => rows.shift());
  }

  static update(params, condition = 'TRUE', ...values) {
    values.push(...Object.values(params));
    const bindOffset = values.length;

    const columnsSQL = Object
      .keys(params)
      .map((column, index) => `${column} = $${bindOffset + index}`)
      .join(',');

    const text = `
      UPDATE ${this.tableName} SET ${columnsSQL}
      WHERE ${condition}
      RETURNING ${this.allColumns};
    `;

    return this.execute({ text, values });
  }

  save() {
    return this.constructor.create(this, { onConflict: 'update' });
  }

  destroy() {
    const primaryKey = this.constructor.primaryKey;
    return this.constructor.delete(`WHERE ${primaryKey} = $1`, this[primaryKey]);
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
