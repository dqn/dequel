'use strict';

const dequel = require('..');

const fs = require('fs');

class Test extends dequel.Model {
  static columns = [
    'id',
    'test_text',
    'test_bigint',
    'test_boolean',
    'test_jsonb',
    'test_text_array',
    'test_timestamptz',
  ];
  static primaryKey = 'id';
}

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

afterAll(() => {
  return pool.end();
});

beforeEach(() => {
  return initialize();
});

describe('take', () => {
  test('take test data', async () => {
    const record = await Test.take();

    expect(record).toEqual(new Test({
      id: '1',
      test_text: 'hello',
      test_bigint: '42',
      test_boolean: true,
      test_jsonb: { foo: 'bar' },
      test_text_array: [ 'Node.js', 'PostgreSQL', 'dequel' ],
      test_timestamptz: expect.anything(),
    }));
  });
});

describe('count', () => {
  test('count', async () => {
    const count = await Test.count();

    expect(count).toBe(1);
  });

  test('increment count', async () => {
    const count = await Test.count();
    await Test.create();

    expect(await Test.count()).toBe(count + 1);
  });
});

describe('create', () => {
  test('create', async () => {
    const params = {
      test_text: 'xxx',
      test_bigint: 23,
      test_boolean: true,
      test_jsonb: { foo: 'bar' },
      test_text_array: [ 'aaa', 'bbb', 'ccc' ],
      test_timestamptz: new Date(),
    };

    const record = await Test.create(params);

    expect(record).toEqual(new Test({
      id: '2',
      test_text: 'xxx',
      test_bigint: '23',
      test_boolean: true,
      test_jsonb: { foo: 'bar' },
      test_text_array: [ 'aaa', 'bbb', 'ccc' ],
      test_timestamptz: expect.anything(),
    }));
  });
});

describe('where', () => {
  test('where', async () => {
    await Promise.all([
      Test.create({ test_bigint: 1 }),
      Test.create({ test_bigint: 23 }),
      Test.create({ test_bigint: 23 }),
      Test.create({ test_bigint: 42 }),
    ]);

    const rows = await Test.where('test_bigint = $1', 23);

    expect(rows.length).toBe(2);
  });
});
