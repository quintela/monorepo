const logger = require('@optionq/logger');
const config = require('config');
const asJsonCanonical = require('fast-json-stable-stringify');
const _ = require('lodash');
const { v4: uuid } = require('uuid');

class Ctx {
  constructor(name, type, opts = {}) {
    this.name = _.toLower(name);
    this.type = _.toLower(type);
    this.appName = `${name}-${type}`;

    this.config = config;

    this.logger = logger(`${opts.ns}:${type}-${name}`, opts, {
      prefix: opts.prefix,
    });

    this.opts = opts;
  }

  getAppName() {
    return _.camelCase(this.appName);
  }

  serialize(obj) {
    return asJsonCanonical(obj);
  }

  deserialize(str) {
    return JSON.parse(str);
  }

  newUuid() {
    return uuid();
  }
}

module.exports = Ctx;
