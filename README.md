# dequel

[![npm version](https://img.shields.io/npm/v/dequel.svg)](https://www.npmjs.com/package/dequel)
[![Build Status](https://travis-ci.com/dqn/dequel.svg?branch=master)](https://travis-ci.com/dqn/dequel)
[![codecov](https://codecov.io/gh/dqn/dequel/branch/master/graph/badge.svg)](https://codecov.io/gh/dqn/dequel)
![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)

Simple ORM for PostgreSQL

## Installation

```bash
$ npm install --save dequel
```

## Usage

```js
const dequel = require('dequel');

class Product extends dequel.Model {}

const pool = new dequel.Pool({
  user: 'POSTGRES_USER',
  host: 'POSTGRES_HOST',
  database: 'POSTGRES_DB',
  password: 'POSTGRES_PASSWORD',
  port: 5432,
});

(async () => {
  // Guess table name and find table columns and primary key from information schema
  await Product.initialize(pool);

  console.log(Product.tableName); // => products
  console.log(Product.columns); // => [ 'id', 'name', 'price' ]
  console.log(Product.primaryKey); // => id

  const record = await Product.find('id = $1', 1);
  console.log(record); // Product { id: '1', name: 'dequel', price: '2000' }
})();
```

You can also set table config manually.

```js
await Product.initialize(pool, {
  tableName: 'awesome_products'
});

// You can set columns and primary key. But not recommended
Product.columns = [ 'uuid', 'name', 'price' ];
Product.primaryKey = 'uuid';
```

## API

### static methods

#### Model.select([columns[, clause[, ...values]]])

- `columns`: `string` | `string[]`
- `clause`: `string`
- `values`: `any`
- Returns: `Promise<Model[]>`

```js
const records = await Product.select('*');

for (const record of records) {
  console.log(record.name);
}

// All columns, all records
Product.select();
Product.select(null);

// Specified columns
Product.select([ 'id', 'name' ]);
Product.select('id, name');

// With clause
Product.select(null, 'WHERE price < $1', 500);
Product.select(null, 'WHERE price < $1 ORDER BY price', 500);
```

#### Model.insert([params[, options]])

- `params`: `Object`
- `options`: `Object`
  - `onConflict`: `'update'` | `'nothing'`
- Returns: `Promise<Model>`

```js
const record = await Product.insert({
  name: 'foo',
  price: 300,
});
console.log(record.name);

// With default values
Product.insert();

// With options
Product.insert({ id: 1 }, { onConflict: 'update' });
Product.insert({ id: 1 }, { onConflict: 'nothing' });
```

#### Model.update(params[, condition[, ...values]])

- `params`: `Object`
- `condition`: `string`
- `values`: `any`
- Returns: `Promise<Model[]>`

```js
const records = await Product.update({ price: 0 }, 'name = $1', 'dequel');

for (const record of records) {
  console.log(record.price);
}

// Update all
Product.update({ price: 0 });
```

#### Model.delete([condition[, ...values]])

- `condition`: `string`
- `values`: `any`
- Returns: `Promise<void>`

```js
await Product.delete('id = $1', 1);

// Delete cascade
Product.delete();
```

#### Model.all()

- Returns: `Promise<Model[]>`

```js
// All records
const records = await Product.all();

for (const record of records) {
  console.log(record.name);
}
```

#### Model.take()

- Returns: `Promise<Model>`

```js
// A record
const record = await Product.take();
console.log(record.name);
```

#### Model.where(condition[, ...values])

- `condition`: `string`
- `values`: `any`
- Returns: `Promise<Model[]>`

```js
// All records that match the conditions
const records = await Product.where('id = $1', 1);

for (const record of records) {
  console.log(record.name);
}
```

#### Model.find(condition[, ...values])

- `condition`: `string`
- `values`: `any`
- Returns: `Promise<Model>`

```js
// First records that match the conditions
const record = await Product.find('id = $1', 1);

console.log(record.name);
```

#### Model.count([condition[, ...values]])

- `condition`: `string`
- `values`: `any`
- Returns: `Promise<number>`

```js
// Count records
const record = await Product.count();
console.log(record.name);

// With conditions
Product.count('name = $1', 'dequel');
```

#### Model.execute(query)

- `query`: `string` | `Object`
  - `text`: `string`
  - `values`: `any[]`
- Returns: `Promise<Model[]>`

```js
// Execute query
const records = await Product.execute('SELECT SUM(price) FROM products;');

// With bind params
Product.execute({
  text: 'SELECT name FROM products WHERE id = $1;',
  values: [ 1 ],
});
```

### prototype methods

#### model.save()

Update if instance has primary key, insert otherwise.

- Returns: `Promise<Model>`

```js
const record = new Product({ name: 'piyo' });
await record.save();

const record = await Product.find('id = $1', 1);
record.name = 'nyan';
await record.save();
```

#### model.destroy()

- Returns: `Promise<void>`

```js
const record = await Product.find('id = $1', 1);
await record.destroy();
```

#### model.toObject()

- Returns: `Object`

```js
const record = await Product.find('id = $1', 1);
console.log(record.toObject());
```

## License

MIT
