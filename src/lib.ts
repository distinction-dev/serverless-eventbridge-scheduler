import { FromSchema } from "json-schema-to-ts";
import { TIME_ZONES } from "./timezone";

export const RATE_PATTERN =
  "^rate\\((?:1 (?:minute|hour|day)|(?:1\\d+|[2-9]\\d*) (?:minute|hour|day)s)\\)$";
export const CRON_PATTERN = "^cron\\(\\S+ \\S+ \\S+ \\S+ \\S+ \\S+\\)$";
export const SCHEDULE_PATTERN: `${typeof RATE_PATTERN}|${typeof CRON_PATTERN}` = `${RATE_PATTERN}|${CRON_PATTERN}`;

export const SchedulerObjectSchema = {
  type: "object",
  properties: {
    rate: {
      anyOf: [
        {
          type: "string",
          pattern: SCHEDULE_PATTERN,
        },
        {
          type: "array",
          items: {
            type: "string",
            pattern: SCHEDULE_PATTERN,
          },
        },
      ],
    },
    timezone: {
      type: "string",
      enum: TIME_ZONES,
    },
    enabled: { type: "boolean", default: true },
    name: {
      type: "string",
      minLength: 1,
      maxLength: 64,
      pattern: "[\\.\\-_A-Za-z0-9]+",
    },
    description: { type: "string", maxLength: 512 },
    input: {
      anyOf: [
        { type: "string", maxLength: 8192 },
        {
          type: "object",
        },
      ],
    },
    inputPath: { type: "string", maxLength: 256 },
    inputTransformer: {
      type: "object",
      properties: {
        inputTemplate: {
          type: "string",
          minLength: 1,
          maxLength: 8192,
        },
        inputPathsMap: { type: "object" },
      },
      required: ["inputTemplate"],
      additionalProperties: false,
    },
    flexibleTimeWindow: {
      oneOf: [
        {
          type: "object",
          properties: {
            mode: {
              type: "string",
              enum: ["OFF"],
              default: "OFF",
            },
          },
        },
        {
          type: "object",
          properties: {
            mode: {
              type: "string",
              enum: ["FLEXIBLE"],
              default: "FLEXIBLE",
            },
            maximum: {
              type: "number",
              minimum: 0,
            },
          },
        },
      ],
    },
  },
  required: ["rate"],
  additionalProperties: false,
} as const;

export const SchedulerInputEventSchema = {
  anyOf: [{ type: "string", pattern: SCHEDULE_PATTERN }, SchedulerObjectSchema],
} as const;

export type SchedulerInputEventSchemaType = FromSchema<
  typeof SchedulerInputEventSchema
>;
