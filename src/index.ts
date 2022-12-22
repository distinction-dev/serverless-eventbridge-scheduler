import { FromSchema } from "json-schema-to-ts";
import Serverless from "serverless";
import Aws from "serverless/plugins/aws/provider/awsProvider";
import {
  SchedulerInputEventSchema,
  SchedulerInputEventSchemaType,
  SchedulerObjectSchema,
} from "./lib";
interface ServerlessPluginOptions {
  globalOptions?: boolean;
}
class EventBridgeSchedulerPlugin {
  serverless: Serverless;
  options: ServerlessPluginOptions;
  provider: Aws;
  hooks: {
    [x: string]: () => void;
  };

  constructor(serverless: Serverless, options: ServerlessPluginOptions) {
    this.serverless = serverless;
    this.options = options;
    this.provider = serverless.getProvider("aws");

    this.hooks = {
      "package:compileEvents": this.compileScheduledEvents.bind(this),
    };

    // Adding json schema for event
    this.serverless.configSchemaHandler.defineFunctionEvent(
      "aws",
      "evSchedule",
      SchedulerInputEventSchema
    );
  }

  compileScheduledEvents(): void {
    this.serverless.service.getAllFunctions().forEach(functionName => {
      const functionObj = this.serverless.service.getFunction(functionName);
      if (functionObj.events) {
        functionObj.events.forEach(event => {
          if (event.evSchedule) {
            const scheduleConf =
              event.evSchedule as SchedulerInputEventSchemaType;
            let scheduleExpressions: Array<string>;
            let scheduleStatus: "ENABLED" | "DISABLED" = "ENABLED";
            let scheduleInput: string | undefined;
            let scheduleName = this.provider.naming.getScheduleId(functionName);
            let baseScheduleObj:
              | FromSchema<typeof SchedulerObjectSchema>
              | undefined;
            if (typeof scheduleConf === "string") {
              scheduleExpressions = [scheduleConf];
            } else {
              baseScheduleObj = {
                ...scheduleConf,
              };
              // change the value of the status based on enabled flag on schedule
              scheduleStatus =
                scheduleConf.enabled === false ? "DISABLED" : "ENABLED";

              // setting the schedule expressions properly
              if (typeof scheduleConf.rate === "string") {
                scheduleExpressions = [scheduleConf.rate];
              } else {
                scheduleExpressions = scheduleConf.rate;
              }

              // parse the input properly
              if (scheduleConf.input) {
                if (typeof scheduleConf.input === "string") {
                  scheduleInput = scheduleConf.input;
                } else {
                  scheduleInput = JSON.stringify(scheduleConf.input);
                }
              }

              // parse the name
              if (scheduleConf.name) {
                scheduleName = scheduleConf.name;
              }
            }
            const lambdaLogicalId =
              this.provider.naming.getLambdaLogicalId(functionName);

            scheduleExpressions.forEach((schedule, scheduleNumber) => {
              const scheduleNumberInFunction =
                scheduleExpressions.length === 1 ? "" : `${scheduleNumber}`;
              const scheduleLogicalId = `${this.provider.naming.getNormalizedFunctionName(
                functionName
              )}EventbridgeSchedule${scheduleNumberInFunction}`;
              const schedulerRoleLogicalId = `${this.provider.naming.getNormalizedFunctionName(
                functionName
              )}SchedulerRole${scheduleNumberInFunction}`;
              this.serverless.service.provider.compiledCloudFormationTemplate.Resources =
                {
                  ...this.serverless.service.provider
                    .compiledCloudFormationTemplate.Resources,
                  [scheduleLogicalId]: {
                    Type: "AWS::Scheduler::Schedule",
                    Properties: {
                      Name: `${scheduleName}${scheduleNumberInFunction}`,
                      Description: baseScheduleObj?.description,
                      ScheduleExpression: schedule,
                      ScheduleExpressionTimezone: baseScheduleObj?.timezone,
                      State: scheduleStatus,
                      Target: {
                        Arn: {
                          "Fn::GetAtt": [lambdaLogicalId, "Arn"],
                        },
                        Input: scheduleInput,
                        RoleArn: {
                          "Fn::GetAtt": [schedulerRoleLogicalId, "Arn"],
                        },
                      },
                      FlexibleTimeWindow: {
                        Mode:
                          baseScheduleObj?.flexibleTimeWindow?.mode || "OFF",
                        MaximumWindowInMinutes:
                          baseScheduleObj?.flexibleTimeWindow?.maximum,
                      },
                    },
                  },
                  [schedulerRoleLogicalId]: {
                    Type: "AWS::IAM::Role",
                    Properties: {
                      RoleName: `${schedulerRoleLogicalId}-invoker-role`,
                      AssumeRolePolicyDocument: {
                        Statement: [
                          {
                            Action: ["sts:AssumeRole"],
                            Effect: "Allow",
                            Principal: {
                              Service: ["scheduler.amazonaws.com"],
                            },
                          },
                        ],
                        Version: "2012-10-17",
                      },
                      Policies: [
                        {
                          PolicyName: `${scheduleLogicalId}-policy`,
                          PolicyDocument: {
                            Statement: [
                              {
                                Action: ["lambda:InvokeFunction"],
                                Effect: "Allow",
                                Resource: [
                                  {
                                    "Fn::GetAtt": [lambdaLogicalId, "Arn"],
                                  },
                                ],
                              },
                            ],
                            Version: "2012-10-17",
                          },
                        },
                      ],
                    },
                  },
                };
            });
          }
        });
      }
    });
  }
}

module.exports = EventBridgeSchedulerPlugin;
