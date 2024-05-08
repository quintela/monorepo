const { version } = require('./package.json');
const logger = require('@optionq/logger');
const { throwIfInvalidUrl, throwIfMissing } = require('@optionq/utils');
const axios = require('axios');
const _ = require('lodash');
const qs = require('qs');

class HttpClient {
  constructor(name, endpoint, options = {}) {
    throwIfMissing(name, 'name');
    throwIfMissing(endpoint, 'endpoint');

    endpoint = _.replace(endpoint, /(.+)?(\/)$/, '$1');

    this.clientName = name;
    this.baseUrl = `${endpoint}`;

    throwIfInvalidUrl(this.baseUrl);
    const headers = {};

    if (options.auth) {
      headers.Authorization = `Basic ${this.basicAuthFor(
        options.auth.username,
        options.auth.password
      )}`;
    }

    this.ua = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `${_.camelCase(name)} Version/${version}`,
        ...headers,
      },
      timeout: 1000,
    });

    this.logger = logger(`${name}-client`);
  }

  basicAuthFor(username, password) {
    return Buffer.from(`${username}:${password}`, 'utf8').toString('base64');
  }

  async request({ method, route, data = {}, query = {} }) {
    const qstr = _.keys(query).length
      ? `?${qs.stringify(query, { arrayFormat: 'brackets' })}`
      : '';

    route = _.replace(route, /^(\/)(.+)?(\/)$/, '$2');
    const url = `${this.baseUrl}/${route}${qstr}`;

    this.logger.info(`Requesting data to ${url}`);

    const options = {
      data,
      method,
      url,
    };

    try {
      const response = await this.ua(options);

      return response.data;
    } catch ({ response }) {
      if (!response) {
        this.logger.error(`${this.clientName} does not respond.`);
        throw new Error(`${this.clientName} does not respond.`);
      }

      this.logger.error(response, response.data.message);
      throw new Error(response.data.message);
    }
  }

  get({ route, query }) {
    return this.request({
      method: 'GET',
      query,
      route,
    });
  }

  post({ route, data, query }) {
    return this.request({
      data,
      method: 'POST',
      query,
      route,
    });
  }

  delete({ route, data, query }) {
    return this.request({
      /* TODO remove */
      data,
      method: 'DELETE',
      query,
      route,
    });
  }

  head({ route, query }) {
    return this.request({
      method: 'HEAD',
      query,
      route,
    });
  }

  put({ route, data, query }) {
    return this.request({
      data,
      method: 'PUT',
      query,
      route,
    });
  }
}

module.exports = HttpClient;
