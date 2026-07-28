import { OPENROSA_XFORMS_PREFIX } from '@getodk/common/constants/xmlns';
import type { InstanceValueContext } from '../instance/internal-api/InstanceValueContext';
import type { AttributeContext } from '../instance/internal-api/AttributeContext';
import type { InstanceDefaults } from '../client';

type ValueContext = AttributeContext | InstanceValueContext;

const PROTECTED_META_FIELDS = [
  'instanceID',
  'instanceName',
  'timeStart',
  'timeEnd',
  'today',
  'userID',
  'deviceID',
  'deprecatedID',
  'email',
  'phoneNumber',
  'audit',
];

const isProtectedMetaProperty = (refWithoutRoot: string): boolean => {
  return !!PROTECTED_META_FIELDS.find((field) => {
    return refWithoutRoot === `${OPENROSA_XFORMS_PREFIX}:meta/${OPENROSA_XFORMS_PREFIX}:${field}`;
  });
};

export const getInstanceDefaultValue = (
  defaults: InstanceDefaults,
  context: ValueContext
): string | undefined => {
  if (!defaults || context.contextNode.nodeType === 'attribute') {
    return;
  }
  const ref = context.contextReference();
  const positionOfSecondSlash = ref.indexOf('/', 1);
  const refWithoutRoot = ref.slice(positionOfSecondSlash + 1);
  if (isProtectedMetaProperty(refWithoutRoot)) {
    return;
  }
  return defaults[ref] ?? (refWithoutRoot && defaults[refWithoutRoot]) ?? undefined;
};
