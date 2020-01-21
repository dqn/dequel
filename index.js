'use strict';

const { Pool } = require('pg');

class Model {
  static define(pool, attributes) {
    this.pool = pool;
    this.attributes = attributes;
  }
}

module.exports = {
  Pool,
  Model,
};
