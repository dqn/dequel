'use strict';

const dequel = require('..');

const fs = require('fs');

class Test extends dequel.Model {}

const pool = new dequel.Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'dequel',
  port: 54320,
});

async function initialize() {
  const path = `${__dirname}/sql/test_data.sql`;
  const sql = fs.readFileSync(path).toString();

  await pool.query(sql);

  Test.init(pool);
}

beforeAll(() => {
  return initialize();
});

afterAll(() => {
  return pool.end();
});

test('take', async () => {
  const record = await Test.take();

  expect(record).toBeDefined();
});

test('count', async () => {
  const count = await Test.count();

  expect(count).toBe(1);
});

test('create', async () => {
  await Test.create({
    test_text: 'xxx',
    test_bigint: 42,
    test_boolean: true,
    test_jsonb: { foo: 'bar' },
    test_text_array: [ 'aaa', 'bbb', 'ccc' ],
    test_timestamptz: new Date(),
  });
  const count = await Test.count();

  expect(count).toBe(2);
});

test('where', async () => {
  const rows = await Test.where('id = $1', 1);

  expect(rows.length).toBe(1);
});
