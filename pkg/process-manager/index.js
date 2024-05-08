const logger = require('@optionq/logger')('process-manager');
const Promise = require('bluebird');
const _ = require('lodash');

function deferred() {
  const deferred = {};

  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return deferred;
}

function reflect(thenable, args) {
  return Promise.try(() => thenable(...args)).then(_.noop, _.identity);
}

class ProcessManager {
  constructor() {
    this.errors = [];
    this.forceShutdown = deferred();
    this.hooks = [];
    this.running = [];
    this.terminating = false;
    this.timeout = 30000;
  }

  addHook({ type, handler, name = 'a handler' }) {
    this.hooks.push({
      handler,
      name,
      timeoutError: new Promise.TimeoutError(
        `${name} took too long to complete ${type} hook`,
      ),
      type,
    });

    logger.info(`New handler added for hook ${type}`);
  }

  configure({ timeout } = {}) {
    this.timeout = Number(timeout) || this.timeout;
  }

  exit() {
    if (this.errors.length > 0) {
      logger.error(...this.errors);

      // Output console to error in case no `DEBUG` namespace has been set.
      // This mimicks the default node behaviour of not silencing errors.
      if (!process.env.DEBUG) {
        console.error(...this.errors);
      }

      return process.exit(1);
    }

    process.exit();
  }

  hook(type, ...args) {
    const hooks = _.filter(this.hooks, { type });
    const promises = _.map(hooks, ({ handler }) => reflect(handler, args));

    return Promise.all(promises)
      .timeout(this.timeout, type)
      .catch(Promise.TimeoutError, () => {
        for (let i = 0; i < hooks.length; ++i) {
          if (promises[_.parseInt(i)].isPending()) {
            this.errors.push(hooks[_.parseInt(i)].timeoutError);

            logger.info(
              `Timeout: ${hooks[_.parseInt(i)].name} took
              too long to complete ${type} hook`,
            );
          }
        }
      })
      .then(errors => this.errors.push(..._.compact(errors)));
  }

  loop(fn, { interval = 0 } = {}) {
    return (async () => {
      while (!this.terminating) {
        await this.run(fn, { exit: false });

        if (!this.terminating) {
          await Promise.delay(interval);
        }
      }
    })();
  }

  on(fn) {
    return (...args) => this.run(fn, { args, exit: false });
  }

  once(fn) {
    return this.run(fn);
  }

  run(fn, { args = [], exit = true } = {}) {
    if (this.terminating) {
      return;
    }

    const id = Symbol();
    const chain = reflect(fn, args).then(error => {
      _.remove(this.running, { id });

      if (error || exit) {
        this.shutdown({ error });
      }
    });

    chain.id = id;

    this.running.push(chain);

    return chain;
  }

  shutdown({ error, force = false } = {}) {
    if (error) {
      this.errors.push(error);
    }

    if (force) {
      this.forceShutdown.reject();
    }

    if (this.terminating) {
      return;
    }

    this.terminating = true;

    logger.info('Starting shutdown');

    const gracefulShutdown = Promise.all(this.running)
      .then(() => logger.info('All running instances have stopped'))
      .then(() => this.hook('drain'))
      .then(() =>
        logger.info(
          `${_.filter(this.hooks, { type: 'drain' }).length} server(s) drained`,
        ),
      )
      .then(() => this.hook('disconnect'))
      .then(() =>
        logger.info(
          `${
            _.filter(this.hooks, { type: 'disconnect' }).length
          } service(s) disconnected`,
        ),
      )
      .then(() => this.hook('exit', this.errors));

    Promise.race([gracefulShutdown, this.forceShutdown.promise])
      .catch(() => logger.info('Forced shutdown, skipped waiting'))
      .then(() => this.exit());
  }
}

const processManager = new ProcessManager();

process.on('exit', code => {
  logger.info(`Exiting with status ${code}`);
});

process.on('unhandledRejection', error => {
  logger.info('Caught rejection', error);

  processManager.shutdown({ error });
});

process.on('uncaughtException', error => {
  logger.info('Caught exception', error);

  processManager.shutdown({ error });
});

process.on('SIGINT', () => {
  logger.info('Caught SIGINT');

  processManager.shutdown({ force: processManager.terminating });
});

process.on('SIGTERM', () => {
  logger.info('Caught SIGTERM');

  processManager.shutdown();
});

logger.info('Process manager initialized');

module.exports = processManager;
