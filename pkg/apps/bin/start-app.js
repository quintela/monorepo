#!/usr/bin/env node

const App = require('../app');
const cli = require('../client');
const logger = require('@optionq/logger')(cli.name);

const app = new App(cli);

logger.info(`Ending ${app.ctx.getAppName()}`);
