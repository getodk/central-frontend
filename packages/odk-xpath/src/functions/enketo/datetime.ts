import { FunctionAlias } from '../../evaluator/functions/FunctionAlias.ts';
import { date, formatDateTime } from '../xforms/datetime.ts';

export const dateTime = new FunctionAlias(date, {
  localName: 'date-time',
});

export const formatDate = new FunctionAlias(formatDateTime, {
  localName: 'format-date',
});
