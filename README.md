# Serverless Eventbridge Scheduler Plugin

Serverless plugin to use Eventbridge Scheduler to schedule Lambda functions instead of Cloudwatch and Eventbridge Rules

> This plugin was created for us to slowly start transitioning some our workloads away Eventbridge rules into the new and shiny Eventbridge scheduler

## Installation

```bashrc
yarn add -D serverless-eventbridge-schedule
```

### Add to serverless plugins

```yaml
plugins:
  - serverless-eventbridge-schedule
```

## Usage

```yaml
functions:
  hello:
    # ...function definition
    events:
      - evSchedule:
          rate: cron(* * * * ? *)
```

This will create a new event bridge schedule which will trigger your lambda and move you away from event bridge rules

## Why?

* It's new
* It supports timezones out of the box and I wanna see it finally solve the Daylight Savings problem
* Star and raise issues if you end up using this and want the full document which I promised myself I would write

## Configuration

The configuration is fairly similar to how schedules work as event sources. The following config will attach a schedule event and causes the function `crawl` to be called every 2 hours. The configuration allows you to attach multiple schedules to the same function. You can either use the `rate` or `cron` syntax. Take a look at the [AWS schedule syntax documentation](http://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html) for more details.

```yaml
functions:
  crawl:
    handler: crawl
    events:
      - schedule: rate(2 hours)
      - schedule: cron(0 12 * * ? *)
```

## Enabling / Disabling

**Note:** `eVschedule` events are enabled by default.

This will create and attach a schedule event for the `aggregate` function which is disabled. If enabled it will call
the `aggregate` function every 10 minutes.

```yaml
functions:
  aggregate:
    handler: statistics.handler
    events:
      - schedule:
          rate: rate(10 minutes)
          enabled: false
          input:
            key1: value1
            key2: value2
            stageParams:
              stage: dev
      - schedule:
          rate: cron(0 12 * * ? *)
          enabled: false
          inputPath: '$.stageVariables'
      - schedule:
          rate: rate(2 hours)
          enabled: true
          inputTransformer:
            inputPathsMap:
              eventTime: '$.time'
            inputTemplate: '{"time": <eventTime>, "key1": "value1"}'
```

## Specify Name and Description

Name and Description can be specified for a schedule event. These are not required properties.

```yaml
events:
  - schedule:
      name: your-scheduled-rate-event-name
      description: 'your scheduled rate event description'
      rate: rate(2 hours)
```

## Specify multiple schedule expressions

An array of schedule expressions (i.e. using either `rate` or `cron` syntax) can be specified, in order to avoid repeating other configuration variables.
This is specially useful in situations in which there's no other way than using multiple cron expressions to schedule a function.

This will trigger the function at certain times on weekdays and on different times on weekends, using the same input:

```yaml
functions:
  foo:
    handler: foo.handler
    events:
      - schedule:
          rate:
            - cron(0 0/4 ? * MON-FRI *)
            - cron(0 2 ? * SAT-SUN *)
          input:
            key1: value1
            key2: value2
```

### What's different then?

Input process is a bit different with Eventbridge scheduler, there's no way to specify an inputPath or an inputTransformer
