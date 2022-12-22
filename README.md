# Serverless Eventbridge Scheduler Plugin

Serverless plugin to use Eventbridge Scheduler to schedule Lambda functions instead of Cloudwatch and Eventbridge Rules

## Installation

```bashrc
npm install --save-dev serverless-eventbridge-schedule
```

Or

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

## Configuration

Todo:- Will write more if someone actually ends up using this

## Why?

* It's new
* It supports timezones out of the box and I wanna see it finally solve the Daylight Savings problem
* Star and raise issues if you end up using this and want the full document which I promised myself I would write
