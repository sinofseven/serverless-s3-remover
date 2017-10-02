'use strict';

const chalk = require('chalk');
const messagePrefix = 'S3 Remover: ';

class Remover {
  constructor (serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider =  this.serverless.getProvider('aws');

    let config = this.serverless.service.custom.remover;
    this.config = Object.assign({}, {
      buckets: []
    }, config);

    this.commands = {
      s3remove: {
        usage: 'Remove all files in S3 buckets',
        lifecycleEvents: [
          'remove'
        ],
        options: {
          verbose: {
            usage: 'Increase verbosity',
            shortcut: 'v'
          }
        }
      }
    };

    this.hooks = {
      'before:remove:remove': () => Promise.resolve().then(this.remove.bind(this)),
      's3remove:remove': () => Promise.resolve().then(this.remove.bind(this))
    };
  }

  log(message) {
    if (this.options.verbose) {
      this.serverless.cli.log(message);
    }
  }

  remove() {
    const buckets = this.config.buckets;

    const getAllKeys = (bucket) => {
      const get = (src = {}) => {
        const data = src.data;
        const keys = src.keys || [];
        const param = {
          Bucket: bucket
        };
        if (data) {
          param.ContinuationToken = data.NextContinuationToken;
        }
        return this.provider.request('S3', 'listObjectsV2', param, this.options.stage, this.options.region).then((result) => {
          return new Promise((resolve) => {
            resolve({data: result, keys: keys.concat(result.Contents.map((item) => {return item.Key;}))});
          });
        });
      };
      const list = (src = {}) => {
        return get(src).then((result) => {
          if (result.data.IsTruncated) {
            return list(result);
          } else {
            const keys = result.keys;
            const objects = keys.map((item) => {return {Key: item};});
            const param = {
              Bucket: bucket,
              Delete: {
                Objects: objects
              }
            };
            return new Promise((resolve) => { resolve(param); });
          }
        });
      };
      return list();
    };
    const executeRemove = (param) => {
      return this.provider.request('S3', 'deleteObjects', param, this.options.stage, this.options.region);
    };
    const startMessage = 'Make buckets empty.';
    this.log(startMessage);
    this.serverless.cli.consoleLog(`${messagePrefix}${chalk.yellow(startMessage)}`);
    for(const bucket of buckets) {
      getAllKeys(bucket).then(executeRemove).then(() => {
        const message = `Success: ${bucket} is empty.`;
        this.log(message);
        this.serverless.cli.consoleLog(`${messagePrefix}${chalk.yellow(message)}`);
      }).catch(() => {
        const message = `Faild: ${bucket} may not be empty.`;
        this.log(message);
        this.serverless.cli.consoleLog(`${messagePrefix}${chalk.yellow(message)}`);
      });
    }
  }
}

module.exports = Remover;
