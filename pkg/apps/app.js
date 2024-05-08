const Ctx = require('./ctx');
const { promisify, unimplemented } = require('./utils');
const processManager = require('@optionq/process-manager');
const config = require('config');
const httpShutDown = require('http-shutdown');
const _ = require('lodash');
const moment = require('moment');
const opn = require('open');
const slugify = require('slugify');
const fs = require('fs');

class App {
  constructor(options, ctx) {
    const { configFile = '' } = options;
    const opts = this.loadConfig(configFile);

    const {
      app = '',
      dryRun = false,
      mode = '',
      single = false,
      type = '',
      verbose = false,
    } = { ...opts, ...options };

    if (!app) {
      throw new Error('Can\'t spawn on missing \'app\'');
    }

    if (!type) {
      throw new Error(`Can't spawn app of unknown 'type'`);
    }

    // create new Ctx instance
    if (!ctx || !(ctx instanceof Ctx)) {
      this.ctx = new Ctx(app, type, { ns: slugify(_.toLower(app)) });
    } else {
      this.ctx = ctx;
    }

    process.title = this.ctx.appName;

    switch (_.toLower(type)) {
      case 'api':
        this.startApiApp(mode, opts);
        break;
      case 'ticker':
        this.startCronApp({ ...opts, dryRun, single, verbose });
        break;
      default:
        throw new Error(`Can't spawn app of unknown 'type' ${type}`);
    }
  }

  throwIfMissing(param, name) {
    if (!param) {
      throw new Error(`Can't spawn on missing '${name}'`);
    }
  }

  getInstaces() {
    unimplemented(2);
  }

  appInstance() {
    const handler = this.getInstaces(this.ctx.getAppName());

    if (!handler) {
      throw new Error(`Unknown app '${this.ctx.getAppName()}'`);
    }

    return handler;
  }

  createServer(handler) {
    if (!config.has(`apps.${this.ctx.getAppName()}.listen`)) {
      throw new Error(
        `Missing 'apps.${this.ctx.getAppName()}.listen' on '${config.get(
          'environment',
        )}'`,
      );
    }

    const { NODE_APP_INSTANCE } = process.env;

    const { host, port } = config.get(`apps.${this.ctx.getAppName()}.listen`);

    const server = httpShutDown(
      handler(this.ctx).listen(port + Number(NODE_APP_INSTANCE || 0), host),
    );

    return { host, port, server };
  }

  setupServerProcess(server, opts) {
    const withCLIENT = _.toUpper(_.get(opts, 'mode')) === 'CLI';
    const isDev = !_.includes(
      ['production', 'staging', 'test'],
      _.toLower(config.get('environment')),
    );

    if (withCLIENT && isDev) {
      const { protocol } = config.get(`apps.${this.ctx.getAppName()}.listen`);

      server.on('listening', () => {
        setTimeout(() => {
          this.ctx.logger.info(
            `Spawning client at '${protocol}://${opts.host}/login'`,
          );
          opn(`${protocol}://${opts.host}:${opts.port}/login`);
        }, 3000);
      });
    }

    if (process.send) {
      server.once('listening', () => {
        process.send('ready');
      });
    }

    promisify(server);

    processManager.addHook({
      handler: () => {
        this.ctx.logger.info(
          `Closing '${_.capitalize(this.ctx.appName)} ${_.toUpper(
            this.ctx.type,
          )}'`,
        );

        promisify(server.shutdown);
      },
      name: `bx2-${_.toLower(this.ctx.getAppName())}-server`,
      type: 'drain',
    });

    return server;
  }

  spawnCron(appHandler, opts = {}) {
    const interval = moment
      .duration(
        _.get(opts, 'delay.value') || 5,
        _.get(opts, 'delay.unit') || 'minutes',
      )
      .asMilliseconds();

    processManager.loop(
      async () => {
        await appHandler.executeTask(opts);
      },
      { interval },
    );
  }

  spawnOnce(appHandler, opts = {}) {
    processManager.once(async () => {
      await appHandler.executeTask(opts);
    });
  }

  startApiApp(mode, opts) {
    const handler = this.appInstance();

    const { host, port, server } = this.createServer(handler);

    this.setupServerProcess(server, { ...opts, host, mode, port });

    this.ctx.logger.info(
      `[${config.get('environment')}]: Listening on ${host}:${port}`,
    );
  }

  startCronApp(opts) {
    const Ticker = this.appInstance();

    const app = new Ticker(this.ctx, opts);

    this.ctx.logger.info(
      `[${config.get('environment')}]: Starting ${this.ctx.appName}`,
    );

    if (opts.single) {
      this.spawnOnce(app);

      return 0;
    }

    this.spawnCron(app);

    return 0;
  }

  loadConfig(configFile) {
    if (!configFile) {
      return {};
    }

    const rawdata = fs.readFileSync(configFile);

    try {
      return JSON.parse(rawdata);
    } catch (e) {
      throw new Error('Unable to parse config file');
    }
  }
}

module.exports = App;
