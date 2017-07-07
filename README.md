[![NPM](https://nodei.co/npm/serverless-s3-remover.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/serverless-s3-remover/)
[![NPM](https://nodei.co/npm-dl/serverless-s3-remover.png?height=2)](https://nodei.co/npm/serverless-s3-remover/)
# serverless-s3-remover
plugin for serverless to make buckets empty before remove

# Usage
Run next command.
```bash
$ npm install serverless-s3-remover
```

Add to your serverless.yml
```yaml
plugins:
  - serverless-s3-remover

custom:
  remover:
     buckets:
       - my-bucket-1
       - my-bucket-2
```

You can specify any number of `bucket`s that you want.

Now you can make all buckets empty by running:
```bash
$ sls s3remove
```

# When removing
When removing serverless stack, this plugin automatically make buckets empty  before removing stack.
```sh
$ sls remove
```
