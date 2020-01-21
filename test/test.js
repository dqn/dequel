'use strict';

const dequel = require('./../index');

const fs = require('fs');
const path = require('path');

class User extends dequel.Model {
}

async function main() {
  const pool = new dequel.Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'dequel',
    port: 54320,
  });

  const sql = fs.readFileSync(path.join(__dirname, './sql/test_data.sql')).toString();
  await pool.query(sql);

  const res = await pool.query(`SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'tests';`);
  console.log(res.rows.shift().count);

  pool.end();
}

if (require.main === module) {
  main().catch(console.error);
}
