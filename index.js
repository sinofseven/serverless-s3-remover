'use strict';

class Remover {
  constructor (serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider =  this.serverless.getProvider('aws');

    let config = this.serverless.service.custom.remover;
    if (Array.isArray(config)){
      config = {buckets: config};
    }
    this.config = Object.assign({}, {
      auto: false,
      buckets: []
    }, config);

    this.commands = {
      s3remove: {
        usage: "remove all files in S3 buckets",
        lifecycleEvents: [
          'remove'
        ],
        options: {
          verbose: {
            usage: "Increase verbosity",
            shortcut: "v"
          }
        }
      }
    };

    this.hooks = {
      'before:remove': () => Promise.resolve().then(this.test.bind(this))
    };
  }

  test() {
    return new Promise((resolve) => {
      this.log("================ call ==================");
      resolve();
    })
  }

  log(message) {
    if (this.options.verbose) {
      this.serverless.cli.log(message);
    }
  }

  remove() {
    const service = this.serverless.service;
    let buckets = this.config.targes;

    return new Promise((resolve) => {
      buckets.forEach((bucket) => {
        this.provider.request('S3', '')
      });
    });
  }
}

module.exports = Remover;
