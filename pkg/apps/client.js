const client = require('commander');

client
  .description('Start App')
  .version('0.0.1')
  .description('Start App')
  .usage('start-app -a <app-name>')
  // global and required params
  .requiredOption('-a, --app [appName]', 'App Name')
  .requiredOption('-t, --type [appType]', 'App Type <api, cron, subsriber>')
  // api based app params
  .option('--mode [mode]', '[api] Load API with a specific modifier. ex: CLI')
  // subscriber based app params
  .option(
    '--topic [topic]',
    '[subscriber] The Topic from where to collect events',
  )
  .option(
    '--ns [ns]',
    '[subscriber] The Topic "namespace" where to collect events from',
  )
  .option(
    '-v [version]',
    '[subscriber] The Topic "version" where to collect events from',
  )
  .option(
    '--channel [channel]',
    '[subscriber] Channel/Queue to be used to process messages',
  )
  // ticker/cron based app params
  .option('-d, --dryRun', 'dry run')
  .option('--single', '[cron] Run Cron App one single time')
  .option('--verbose', 'display verbose logs')
  // extra overridable configuration parameters through json file
  .option(
    '--configFile <path to JSON config>',
    'Add extra params to you app via JSON file',
  )
  .parse(process.argv);

module.exports = client;
