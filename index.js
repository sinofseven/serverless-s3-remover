'use strict';

const chalk = require('chalk');
const prompt = require('prompt');
const messagePrefix = 'S3 Remover: ';

class Remover {
  constructor (serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider =  this.serverless.getProvider('aws');

    let config = this.serverless.service.custom.remover;
    this.config = Object.assign({}, {
      prompt: false,
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
    const self = this;
    const buckets = self.config.buckets;

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
        return self.provider.request('S3', 'listObjectsV2', param, self.options.stage, self.options.region).then((result) => {
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
      return self.provider.request('S3', 'deleteObjects', param, self.options.stage, self.options.region);
    };

    return new Promise((resolve) => {
      if (!self.config.prompt) {
        let promisses = [];
        for (const b of buckets) {
          promisses.push(getAllKeys(b).then(executeRemove).then(() => {
            const message = `Success: ${b} is empty.`;
            self.log(message);
            self.serverless.cli.consoleLog(`${messagePrefix}${chalk.yellow(message)}`);
          }).catch(() => {
            const message = `Faild: ${b} may not be empty.`;
            self.log(message);
            self.serverless.cli.consoleLog(`${messagePrefix}${chalk.yellow(message)}`);
          }));
        }
        return Promise.all(promisses).then(resolve);
      }
      prompt.message = messagePrefix;
      prompt.delimiter = '';
      prompt.start();
      const schema = {properties: {}};
      buckets.forEach((b) => {
        schema.properties[b] = {
          message: `Make ${b} empty. Are you sure? [yes/no]:`,
          validator: /(yes|no)/,
          required: true,
          warning: 'Must respond yes or no'
        };
      });
      prompt.get(schema, (err, result) => {
        let promisses = [];
        for (const b of buckets) {
          if (result[b].match(/^y/)) {
            promisses.push(getAllKeys(b).then(executeRemove).then(() => {
              const message = `Success: ${b} is empty.`;
              self.log(message);
              self.serverless.cli.consoleLog(`${messagePrefix}${chalk.yellow(message)}`);
            }).catch(() => {
              const message = `Faild: ${b} may not be empty.`;
              self.log(message);
              self.serverless.cli.consoleLog(`${messagePrefix}${chalk.yellow(message)}`);
            }));
          } else {
            promisses.push(Promise.resolve().then(() => {
              const message = `Remove cancelled: ${b}`;
              self.log(message);
              self.serverless.cli.consoleLog(`${messagePrefix}${chalk.yellow(message)}`);
            }));
          }
        }
        Promise.all(promisses).then(resolve);
      });
    });
  }
}

module.exports = Remover;
