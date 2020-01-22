'use strict';

const dequel = require('..');

const fs = require('fs');

class User extends dequel.Model {
}

class Test extends dequel.Model {
}

function makePool() {
  return new dequel.Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'dequel',
    port: 54320,
  });
}

function initDB(pool) {
  const path = `${__dirname}/sql/test_data.sql`;
  const sql = fs.readFileSync(path).toString();

  return pool.query(sql);
}

async function main() {
  const pool = makePool();

  await initDB(pool);

  Test.define(pool);

  console.log(await Test.take());
  console.log(await Test.create({
    test_text: 'xxx',
    test_bigint: 42,
    test_boolean: true,
    test_jsonb: { foo: 'bar' },
    test_text_array: [ 'aaa', 'bbb', 'ccc' ],
    test_timestamptz: new Date(),
  }));

  console.log(await Test.take());

  pool.end();
}

if (require.main === module) {
  main().catch(console.error);
}
