import { Temporal } from '@js-temporal/polyfill';
import { NumberFunction } from '../../evaluator/functions/NumberFunction.ts';
import { StringFunction } from '../../evaluator/functions/StringFunction.ts'
import { EvaluationContext } from '../../context/EvaluationContext.ts';
import { FunctionImplementation } from '../../evaluator/functions/FunctionImplementation.ts';
import { DateTimeContext } from '../../lib/datetime/DateTimeContext.ts';
import { DAY_MILLISECONDS } from '../../lib/datetime/constants.ts';
import { DateTimeLikeEvaluation } from '../../evaluations/DateTimeLikeEvaluation.ts';
import type { Evaluation } from '../../evaluations/Evaluation.ts';
import { StringEvaluation } from '../../evaluations/StringEvaluation.ts';

export const today = new FunctionImplementation([], (context) => {
  const dateTimeContext = new DateTimeContext(context);
  const now = dateTimeContext.now();

  const today = now.with({
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
    microsecond: 0,
    nanosecond: 0,
  });

  return new DateTimeLikeEvaluation(dateTimeContext, today);
});

export const now = new FunctionImplementation([], (context) => {
  const dateTimeContext = new DateTimeContext(context);

  return new DateTimeLikeEvaluation(dateTimeContext, dateTimeContext.now());
});

type DateTimeFormatFunction = (dateTime: Temporal.ZonedDateTime) => string;
type DateFormatterRecord = Record<`%${string}`, DateTimeFormatFunction>;

const shortMonths = [
  ,
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const shortDays = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
];

const dateFormatters = {
  /**
   * 4-digit year
   */
  '%Y': (dateTime: Temporal.ZonedDateTime): string => {
    return String(dateTime.year).padStart(4, '0');
  },

  /**
   * 2-digit year
   */
  '%y': (dateTime: Temporal.ZonedDateTime): string => {
    return dateFormatters['%Y'](dateTime).slice(2);
  },

  /**
   * 0-padded month
   */
  '%m': (dateTime: Temporal.ZonedDateTime): string => {
    return String(dateTime.month).padStart(2, '0');
  },

  /**
   * numeric month
   */
  '%n': (dateTime: Temporal.ZonedDateTime): string => {
    return String(dateTime.month);
  },

  /**
   * short text month (Jan, Feb, etc)*
   */
  '%b': (dateTime: Temporal.ZonedDateTime): string => {
    return shortMonths[dateTime.month] ?? '';
  },

  /**
   * 0-padded day of month
   */
  '%d': (dateTime: Temporal.ZonedDateTime): string => {
    return String(dateTime.day).padStart(2, '0');
  },

  /**
   * day of month
   */
  '%e': (dateTime: Temporal.ZonedDateTime): string => {
    return String(dateTime.day);
  },

  /**
   * short text day (Sun, Mon, etc).*
   */
  '%a': (dateTime: Temporal.ZonedDateTime): string => {
    return shortDays[dateTime.dayOfWeek] ?? '';
  },
} as const satisfies DateFormatterRecord;

type DateFormatters = typeof dateFormatters;

const timeFormatters = {
  /**
   * 0-padded hour (24-hr time)
   */
  '%H': (dateTime: Temporal.ZonedDateTime): string => {
    return String(dateTime.hour).padStart(2, '0');
  },

  /**
   * hour (24-hr time)
   */
  '%h': (dateTime: Temporal.ZonedDateTime): string => {
    return String(dateTime.hour);
  },

  /**
   * 0-padded minute
   */
  '%M': (dateTime: Temporal.ZonedDateTime): string => {
    return String(dateTime.minute).padStart(2, '0');
  },

  /**
   * 0-padded second
   */
  '%S': (dateTime: Temporal.ZonedDateTime): string => {
    return String(dateTime.second).padStart(2, '0');
  },

  /**
   * 0-padded millisecond ticks.*
   */
  '%3': (dateTime: Temporal.ZonedDateTime): string => {
    return String(dateTime.millisecond).padStart(3, '0');
  },
} as const satisfies DateFormatterRecord;

type TimeFormatters = typeof timeFormatters;

const dateTimeFormatters = {
  ...dateFormatters,
  ...timeFormatters,
} as const;

type DateTimeFormatters =
  | DateFormatters
  | (
      & DateFormatters
      & TimeFormatters
    )
  ;

const formatter = (formatters: DateTimeFormatters) => {
  const identifierPattern = new RegExp(
    `${Object.keys(formatters).join('|')}`,
    'g'
  );

  return (format: string, value: Temporal.ZonedDateTime) => {
    return format.replaceAll(identifierPattern, (key) => {
      return formatters[key as keyof typeof formatters](value);
    });
  }
};

const dateFormatter = formatter(dateFormatters);

export const formatDate = new StringFunction([
  { arityType: 'required', typeHint: 'string' },
  { arityType: 'required', typeHint: 'string' },
], (context, [expression, formatExpression]) => {
  const format = formatExpression!.evaluate(context).toString();
  const dateTimeContext = new DateTimeContext(context);
  const value = expression!.evaluate(context).toString();
  // TODO: in general, don't use try/catch, or isolate from other logic if
  // necessary to use (try/catch tends to have major JIT performance impact).
  try {
    const dateTime = dateTimeContext.getDateTime(value);

    return dateFormatter(format, dateTime);
  } catch {
    return '';
  }
}, {
  localName: 'format-date',
});

const dateTimeFormatter = formatter(dateTimeFormatters);

export const formatDateTime = new StringFunction([
  { arityType: 'required', typeHint: 'string' },
  { arityType: 'required', typeHint: 'string' },
], (context, [expression, formatExpression]) => {
  const format = formatExpression!.evaluate(context).toString();
  const dateTimeContext = new DateTimeContext(context);
  const value = expression!.evaluate(context).toString();
  // TODO (try/catch)
  try {
    const dateTime = dateTimeContext.getDateTime(value);

    return dateTimeFormatter(format, dateTime);
  } catch {
    return '';
  }
}, {
  localName: 'format-date-time',
});

const evaluateDateTime = (
  context: EvaluationContext,
  evaluation: Evaluation
): Temporal.ZonedDateTime => {
  const dateTimeContext = new DateTimeContext(context);

  switch (evaluation.type) {
    case 'NUMBER': {
      const days = evaluation.toNumber();
      const milliseconds = days * DAY_MILLISECONDS;

      return dateTimeContext.getDateTime(milliseconds);
    }

    case 'STRING': {
      return dateTimeContext.getDateTime(evaluation.toString());
    }

    default:
      throw 'todo';
  }
}

const DATE_OR_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[-+]\d{2}:\d{2})?)?/;

export const date = new FunctionImplementation([
  // TODO: spec says variadic?!
  { arityType: 'required' },
], (context, [expression]) => {
  const dateTimeContext = new DateTimeContext(context);
  const results = expression!.evaluate(context);

  switch (results.type) {
    case 'BOOLEAN':
      return new StringEvaluation('');

    case 'STRING':
      const string = results.toString();

      if (string === '') {
        return new StringEvaluation(string);
      }

      if (!DATE_OR_DATE_TIME_PATTERN.test(string)) {
        return new StringEvaluation('');
      }

      break;

    case 'NUMBER':
      break;

    default:
      throw '';
  }

  const dateTime = evaluateDateTime(context, results);

  return new DateTimeLikeEvaluation(dateTimeContext, dateTime);
});

export const decimalDateTime = new NumberFunction([
  { arityType: 'required' },
], (context, [expression]) => {
  const results = expression!.evaluate(context);
  const dateTime = evaluateDateTime(context, results);

  return dateTime.epochMilliseconds / DAY_MILLISECONDS;
}, {
  localName: 'decimal-date-time',
});

export const decimalTime = new NumberFunction([
  { arityType: 'required' },
], (context, [expression]) => {
  const string = expression!.evaluate(context).toString();

  if (true) {
    try {
      Temporal.PlainTime.from(string);
    } catch {
      return NaN;
    }
  }

  if (/\d{2}:\d{2}(\:\d{2})?(\.\d+)?(Z|[-+]\d{2}:\d{2})?$/.test(string)) {
    const dateTimeContext = new DateTimeContext(context);
    const dateTimeString = `1970-01-01T${string}`;

    let dateTime: Temporal.ZonedDateTime;

    try {
      dateTime = dateTimeContext.getDateTime(dateTimeString);
    } catch {
      return NaN;
    }

    const { epochMilliseconds } = dateTime.toPlainDateTime()
      .with({
        year: 1970,
        month: 1,
        day: 1,
      })
      .toZonedDateTime('utc');

    return epochMilliseconds / DAY_MILLISECONDS;
  }

  return NaN;
}, {
  localName: 'decimal-time',
});
