const { unimplemented } = require('./utils');
const _ = require('lodash');
const { DateTime } = require('luxon');

class TaskBasedApp {
  constructor(ctx, options = {}) {
    this.ctx = ctx;
    this.dryRun = options.dryRun || false;
    this.isBatch = options.isBatch || false;

    this.tasks = options.tasks;
  }

  async executeTask() {
    this.ctx.logger.info(
      `Starting ${this.ctx.getAppName()} at ${DateTime.local().toISO()}`,
    );

    await Promise.all(
      _.map(this.tasks, async task => {
        this.ctx.logger.info(`Start cleanup ${task.name}`);

        await this.execute(task);

        this.ctx.logger.info(`Ended clenup ${task.name}`);
      }),
    );

    this.ctx.logger.info(
      `Starting ${this.ctx.getAppName()} at ${DateTime.local().toISO()}`,
    );

    return 1;
  }

  fetch() {
    unimplemented(2);
  }

  apply() {
    unimplemented(2);
  }

  async execute(task) {
    const data = await this.fetch(task);

    if (this.isBatch) {
      return await this.apply(data);
    }

    return await Promise.all(
      _.map(data, async item => {
        return await this.apply(item);
      }),
    );
  }
}

module.exports = TaskBasedApp;
