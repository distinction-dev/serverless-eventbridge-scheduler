import { FromSchema } from "json-schema-to-ts";

export const RATE_PATTERN =
  "^rate\\((?:1 (?:minute|hour|day)|(?:1\\d+|[2-9]\\d*) (?:minute|hour|day)s)\\)$";
export const CRON_PATTERN = "^cron\\(\\S+ \\S+ \\S+ \\S+ \\S+ \\S+\\)$";
export const SCHEDULE_PATTERN: `${typeof RATE_PATTERN}|${typeof CRON_PATTERN}` = `${RATE_PATTERN}|${CRON_PATTERN}`;

export const SchedulerObjectSchema = {
  type: "object",
  properties: {
    rate: {
      type: "array",
      minItems: 1,
      items: {
        type: "string",
        pattern: SCHEDULE_PATTERN,
      },
    },
    enabled: { type: "boolean" },
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
          oneOf: [
            {
              properties: {
                body: { type: "string", maxLength: 8192 },
              },
              required: ["body"],
              additionalProperties: false,
            },
            {
              not: {
                required: ["body"],
              },
            },
          ],
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
