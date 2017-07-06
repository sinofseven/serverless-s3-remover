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
    const service = this.serverless.service;
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
          })
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
            }
            return new Promise((resolve) => { resolve(param); });
          }
        });
      };
      return list();
    };
    const executeRemove = (param) => {
      return this.provider.request('S3', 'deleteObjects', param, this.options.stage, this.options.region);
    }
    this.log("make buckets empty");
    for(const bucket of buckets) {
      getAllKeys(bucket).then(executeRemove).then(() => {
        this.log(`success: ${bucket} is empty.`);
      }).catch(() => {
        this.log(`faild: ${bucket} may not be empty.`);
      });
    }


  }
}

module.exports = Remover;
