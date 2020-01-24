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
  test('table name', () => {
    expect(Test.tableName).toBe('tests');
  });

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

describe('select', () => {
  test('columns array', async () => {
    const records = await Test.select([ 'id', 'test_bigint' ]);

    for (const row of records) {
      expect(row).toEqual(new Test({
        id: expect.anything(),
        test_bigint: expect.anything(),
      }));
    }
  });

  test('columns null', async () => {
    const records = await Test.select(null);

    for (const row of records) {
      expect(row).toEqual(new Test({
        id: expect.anything(),
        test_text: expect.anything(),
        test_bigint: expect.anything(),
        test_boolean: expect.anything(),
        test_jsonb: expect.anything(),
        test_text_array: expect.anything(),
        test_timestamptz: expect.anything(),
      }));
    }
  });

  test('columns *', async () => {
    const records = await Test.select('*');

    for (const row of records) {
      expect(row).toEqual(new Test({
        id: expect.anything(),
        test_text: expect.anything(),
        test_bigint: expect.anything(),
        test_boolean: expect.anything(),
        test_jsonb: expect.anything(),
        test_text_array: expect.anything(),
        test_timestamptz: expect.anything(),
      }));
    }
  });

  test('clause and values', async () => {
    await Promise.all([
      new Test({ test_bigint: 23 }).save(),
      new Test({ test_bigint: 23 }).save(),
      new Test({ test_bigint: 42 }).save(),
    ]);

    const records = await Test.select(null, 'WHERE test_bigint = $1', 23);

    for (const row of records) {
      expect(row).toEqual(new Test({
        id: expect.anything(),
        test_text: expect.anything(),
        test_bigint: '23',
        test_boolean: expect.anything(),
        test_jsonb: expect.anything(),
        test_text_array: expect.anything(),
        test_timestamptz: expect.anything(),
      }));
    }
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
    await Test.insert();

    expect(await Test.count()).toBe(count + 1);
  });

  test('count with condition', async () => {
    const count = await Test.count('id = $1', 0);

    expect(count).toBe(0);
  });
});

describe('insert', () => {
  test('insert', async () => {
    const params = {
      test_text: 'xxx',
      test_bigint: 23,
      test_boolean: true,
      test_jsonb: { foo: 'bar' },
      test_text_array: [ 'aaa', 'bbb', 'ccc' ],
      test_timestamptz: new Date(),
    };

    const record = await Test.insert(params);

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

    const record = await Test.insert(params);

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

  test('conflict nothing 1', async () => {
    const count = await Test.count();
    await Test.insert({ id: 1 }, { onConflict: 'nothing' });

    expect(await Test.count()).toBe(count);
  });

  test('conflict nothing 2', async () => {
    const count = await Test.count();
    await Test.insert({ id: 2 }, { onConflict: 'nothing' });

    expect(await Test.count()).toBe(count + 1);
  });

  test('conflict update 1', async () => {
    const count = await Test.count();
    const params = {
      id: 1,
      test_text: 'test of conflict update 1',
    };

    await Test.insert(params, { onConflict: 'update' });

    expect(await Test.count()).toBe(count);
    expect(await Test.find('id = $1', 1)).toEqual(new Test({
      id: '1',
      test_text: 'test of conflict update 1',
      test_bigint: '42',
      test_boolean: true,
      test_jsonb: { foo: 'bar' },
      test_text_array: [ 'Node.js', 'PostgreSQL', 'dequel' ],
      test_timestamptz: expect.anything(),
    }));
  });

  test('conflict update 2', async () => {
    const count = await Test.count();
    await Test.insert({ id: 2 }, { onConflict: 'update' });

    expect(await Test.count()).toBe(count + 1);
  });
});

describe('update', () => {
  test('update all', async () => {
    await Promise.all([
      Test.insert(),
      Test.insert(),
      Test.insert(),
      Test.insert(),
      Test.insert(),
    ]);

    await Test.update({
      test_text: 'test of update update all',
    });

    const records = await Test.select('test_text');

    for (const record of records) {
      expect(record).toEqual({ test_text: 'test of update update all' });
    }
  });

  test('returned records', async () => {
    await Promise.all([
      Test.insert(),
      Test.insert(),
      Test.insert(),
    ]);

    const records = await Test.update({
      test_text: 'test of update returned records',
    });
    const count = await Test.count('test_text = $1', 'test of update returned records');

    expect(records.length).toBe(count);

    for (const record of records) {
      expect(record).toEqual({
        id: expect.anything(),
        test_text: 'test of update returned records',
        test_bigint: expect.anything(),
        test_boolean: expect.anything(),
        test_jsonb: expect.anything(),
        test_text_array: expect.anything(),
        test_timestamptz: expect.anything(),
      });
    }
  });

  test('update with condition', async () => {
    await Promise.all([
      Test.insert({ test_text: 'A' }),
      Test.insert({ test_text: 'A' }),
      Test.insert({ test_text: 'A' }),
      Test.insert({ test_text: 'B' }),
      Test.insert({ test_text: 'B' }),
    ]);

    await Test.update({ test_text: 'C' }, 'test_text = $1', 'A');

    expect(await Test.count('test_text = $1', 'A')).toBe(0);
    expect(await Test.count('test_text = $1', 'B')).toBe(2);
    expect(await Test.count('test_text = $1', 'C')).toBe(3);
  });
});

describe('where', () => {
  test('where', async () => {
    await Promise.all([
      Test.insert({ test_bigint: 1 }),
      Test.insert({ test_bigint: 23 }),
      Test.insert({ test_bigint: 23 }),
      Test.insert({ test_bigint: 42 }),
    ]);

    const records = await Test.where('test_bigint = $1', 23);

    expect(records.length).toBe(2);
  });
});

describe('find', () => {
  test('find', async () => {
    const insertd = await Test.insert({ test_text: 'test of find' });
    const found = await Test.find('id = $1', insertd.id);

    expect(found.test_text).toBe('test of find');
  });
});

describe('all', () => {
  test('all', async () => {
    const count = await Test.count();
    await Promise.all([
      Test.insert(),
      Test.insert(),
      Test.insert(),
      Test.insert(),
      Test.insert(),
    ]);

    const allRecords = await Test.all();

    expect(allRecords.length).toBe(count + 5);
  });
});

describe('delete', () => {
  test('delete', async () => {
    await Promise.all([
      Test.insert(),
      Test.insert(),
      Test.insert(),
      Test.insert(),
      Test.insert(),
    ]);

    await Test.delete('id <> $1', 1);

    expect(await Test.count()).toBe(1);
  });

  test('delete cascade', async () => {
    await Promise.all([
      Test.insert(),
      Test.insert(),
      Test.insert(),
      Test.insert(),
      Test.insert(),
    ]);

    await Test.delete();

    expect(await Test.count()).toBe(0);
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

  test('insert', async () => {
    const record = new Test({
      test_text: 'test of save insert',
      test_bigint: 123,
      test_boolean: true,
    });
    await record.save();

    const found = await Test.find('id = $1', 2);

    expect(found).toEqual(new Test({
      id: expect.anything(),
      test_text: 'test of save insert',
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

    const found = await Test.find('id = $1', 1);

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

describe('destroy', () => {
  test('destroy', async () => {
    const record = await Test.find('id = $1', 1);
    await record.destroy();

    expect(await Test.find('id = $1', 1)).toBeUndefined();
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

    await Test.insert(params);
    const found = await Test.find('id = $1', 2);

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
