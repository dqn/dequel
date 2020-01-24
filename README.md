# dequel

[![Build Status](https://travis-ci.com/dqn/dequel.svg?branch=master)](https://travis-ci.com/dqn/dequel)

Simple ORM for PostgreSQL

## Installation

```bash
$ npm install dqn/dequel
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
  // Guess table name and find table columns and primary key from information schema.
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

// You can set columns and primary key. But not recommended.
Product.columns = [ 'uuid', 'name', 'price' ];
Product.primaryKey = 'uuid';
```

## API

### static methods

#### select

```js
// e.g.
const records = await Product.select('*');

for (const record of records) {
  console.log(record.name);
}

// All columns, all records.
Product.select();
Product.select(null);

// Specified columns.
Product.select([ 'id', 'name' ]);
Product.select('id, name');

// With clause.
Product.select(null, 'WHERE price < $1', 500);
Product.select(null, 'WHERE price < $1 ORDER BY price', 500);
```

#### insert

```js
// e.g.
const record = await Product.insert({
  name: 'foo',
  price: 300,
});

console.log(record.name);

// With defaults.
Product.insert();

// With options.
Product.insert({ id: 1 }, { onConflict: 'update' });
Product.insert({ id: 1 }, { onConflict: 'nothing' });
```

#### update

```js
// e.g.
const records = await Product.update({ price: 0 }, 'name = $1', 'dequel');

for (const record of records) {
  console.log(record.price);
}

// Update all
Product.update({ price: 0 });
```

#### delete

```js
// e.g.
await Product.delete('id = $1', 1);

// Delete cascade.
Product.delete();
```

#### all

```js
// Fetch All records.
const records = await Product.all();

for (const record of records) {
  console.log(record.name);
}
```

#### take

```js
// Take a record.
const record = await Product.take();

console.log(record.name);
```

#### where

```js
// All records that match the conditions
const records = await Product.where('id = $1', 1);

for (const record of records) {
  console.log(record.name);
}
```

#### find

```js
// First records that match the conditions
const record = await Product.find('id = $1', 1);

console.log(record.name);
```

#### count

```js
// Count records.
const record = await Product.count();

console.log(record.name);

// With conditions.
Product.count('name = $1', 'dequel');
```

#### execute

```js
// Execute any query.
const records = await Product.execute('SELECT SUM(price) FROM products;');

// With bind params.
Product.execute({
  text: 'SELECT name FROM products WHERE id = $1;',
  values: [ 1 ],
});
```

### prototype methods

#### save

Update if instance has primary key, insert otherwise.

```js
// e.g.
const record = new Product({ name: 'piyo' });
await record.save();

const record = await Product.find('id = $1', 1);
record.name = 'nyan';
await record.save();
```

#### destroy

```js
// e.g.
const record = await Product.find('id = $1', 1);
await record.destroy();
```

#### toObject

```js
// e.g.
const record = await Product.find('id = $1', 1);
console.log(record.toObject());
```
