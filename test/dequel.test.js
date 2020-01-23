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

  await Test.initialize(pool);
}

afterAll(() => {
  return pool.end();
});

beforeEach(() => {
  return initialize();
});

describe('table', () => {
  test('columns', () => {
    expect(Test.columns).toEqual([
      'id',
      'test_text',
      'test_bigint',
      'test_boolean',
      'test_jsonb',
      'test_text_array',
      'test_timestamptz',
    ]);
  });

  test('primary key', () => {
    expect(Test.primaryKey).toEqual('id');
  });
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

  test('default', async () => {
    const params = {
      test_bigint: 42,
      test_jsonb: { foo: 'bar' },
    };

    const record = await Test.create(params);

    expect(record).toEqual(new Test({
      id: '2',
      test_text: '',
      test_bigint: '42',
      test_boolean: false,
      test_jsonb: { foo: 'bar' },
      test_text_array: [],
      test_timestamptz: -Infinity,
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

describe('find', () => {
  test('find', async () => {
    const created = await Test.create({ test_text: 'test of find' });
    const found = await Test.find(created.id);

    expect(found.test_text).toBe('test of find');
  });
});

describe('save', () => {
  test('save', async () => {
    const record = new Test({
      test_text: 'test of save save',
    });
    const saved = await record.save();

    expect(saved).toEqual(new Test({
      id: expect.anything(),
      test_text: 'test of save save',
      test_bigint: expect.anything(),
      test_boolean: expect.anything(),
      test_jsonb: expect.anything(),
      test_text_array: expect.anything(),
      test_timestamptz: expect.anything(),
    }));
  });

  test('create', async () => {
    const record = new Test({
      test_text: 'test of save create',
      test_bigint: 123,
      test_boolean: true,
    });
    await record.save();

    const found = await Test.find(2);

    expect(found).toEqual(new Test({
      id: expect.anything(),
      test_text: 'test of save create',
      test_bigint: '123',
      test_boolean: true,
      test_jsonb: expect.anything(),
      test_text_array: expect.anything(),
      test_timestamptz: expect.anything(),
    }));
  });

  test('update', async () => {
    const record = new Test({
      id: 1,
      test_text: 'test of save update',
      test_bigint: 456,
      test_boolean: false,
      test_jsonb: { fizz: 'bazz' },
      test_text_array: [ 'wan', 'nyan' ],
    });
    await record.save();

    const found = await Test.find(1);

    expect(found).toEqual(new Test({
      id: '1',
      test_text: 'test of save update',
      test_bigint: '456',
      test_boolean: false,
      test_jsonb: { fizz: 'bazz' },
      test_text_array: [ 'wan', 'nyan' ],
      test_timestamptz: expect.anything(),
    }));
  });
});

describe('toObject', () => {
  test('toObject', async () => {
    const params = {
      test_text: 'xxx',
      test_bigint: 23,
      test_boolean: true,
      test_jsonb: { foo: 'bar' },
      test_text_array: [ 'aaa', 'bbb', 'ccc' ],
      test_timestamptz: new Date(),
    };

    await Test.create(params);
    const found = await Test.find(2);

    expect(found.toObject()).toEqual({
      id: '2',
      test_text: 'xxx',
      test_bigint: '23',
      test_boolean: true,
      test_jsonb: { foo: 'bar' },
      test_text_array: [ 'aaa', 'bbb', 'ccc' ],
      test_timestamptz: expect.anything(),
    });
  });
});
