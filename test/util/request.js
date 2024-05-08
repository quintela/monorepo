const _ = require('lodash');
const { Test } = require('supertest');
const { join } = require('path');
const http = require('http');

module.exports = function(prefix) {
  return function(app) {
    if (_.isFunction(app)) {
      app = http.createServer(app);
    }

    const obj = {};

    http.METHODS
      .map(method => method.toLowerCase())
      .forEach(method => {
        obj[method] = url => new Test(app, method, join(prefix || '/', url));
      });

    // Support previous use of del.
    obj.del = obj.delete;

    return obj;
  };
};
