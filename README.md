[![NPM](https://nodei.co/npm/serverless-s3-remover.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/serverless-s3-remover/)
[![NPM](https://nodei.co/npm-dl/serverless-s3-remover.png?height=2)](https://nodei.co/npm/serverless-s3-remover/)
# serverless-s3-remover
plugin for serverless to empty S3 buckets before stack removal

# Usage
Run next command.
```bash
$ npm install serverless-s3-remover
```

Add the following to your serverless.yml:
```yaml
plugins:
  - serverless-s3-remover

custom:
  remover:
     buckets:
       - my-bucket-1
       - my-bucket-2
```

You can specify any number of S3 `bucket`s that you want.

Now you can empty all S3 buckets by running:
```bash
$ sls s3remove
```

# When removing
This plugin automatically empties S3 buckets before removing the serverless stack.
```sh
$ sls remove
```

# Using Prompt
You can use prompt before deleting any S3 buckets.

```yaml
custom:
  remover:
    prompt: true # default value is `false`
    buckets:
      - remover-bucket-a
      - remover-bucket-b
```

![terminal.png](https://user-images.githubusercontent.com/57114/31264298-0896f1ec-aaa3-11e7-9a8e-86e3c3f34e23.png)

# Populating the configuration object before using it
```yaml
custom:
  boolean:
    true: true
    false: false
  remover:
    prompt: ${self:custom.boolean.${opt:s3-remover-prompt, 'true'}}
```

 Please use the command line argument ```--s3-remover-prompt false``` to disable the prompt feature.
