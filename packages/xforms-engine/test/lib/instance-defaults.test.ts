import { describe, expect, it } from 'vitest';
import { getInstanceDefaultValue } from '../../src/lib/instance-defaults.ts';
import type { InstanceValueContext } from '../../src/instance/internal-api/InstanceValueContext.ts';
import type { AttributeContext } from '../../src/instance/internal-api/AttributeContext.ts';

describe('Instance defaults', () => {
  it('returns undefined when no defaults configured', () => {
    const defaults = {};
    const context = {
      contextReference: () => '/root/data',
      contextNode: { nodeType: 'input' },
    } as InstanceValueContext;
    const actual = getInstanceDefaultValue(defaults, context);
    expect(actual).toBeUndefined();
  });

  it('returns undefined when no defaults match', () => {
    const defaults = { '/root/notmatch': 'something' };
    const context = {
      contextReference: () => '/root/data',
      contextNode: { nodeType: 'input' },
    } as InstanceValueContext;
    const actual = getInstanceDefaultValue(defaults, context);
    expect(actual).toBeUndefined();
  });

  it('returns undefined when called on attribute', () => {
    const defaults = { '/root/data/@id': 'something' };
    const context = {
      contextReference: () => '/root/data/@id',
      contextNode: { nodeType: 'attribute' },
    } as AttributeContext;
    const actual = getInstanceDefaultValue(defaults, context);
    expect(actual).toBeUndefined();
  });

  describe('returns undefined when called on protected meta fields', () => {
    [
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
    ].forEach((field) => {
      it(field, () => {
        const ref = `/root/orx:meta/orx:${field}`;
        const defaults: Record<string, string> = {};
        defaults[ref] = 'something';
        const context = {
          contextReference: () => ref,
          contextNode: { nodeType: 'input' },
        } as InstanceValueContext;
        const actual = getInstanceDefaultValue(defaults, context);
        expect(actual).toBeUndefined();
      });
    });
  });

  it('returns value when full path matches', () => {
    const defaults = { '/root/name': 'something' };
    const context = {
      contextReference: () => '/root/name',
      contextNode: { nodeType: 'input' },
    } as InstanceValueContext;
    const actual = getInstanceDefaultValue(defaults, context);
    expect(actual).toEqual('something');
  });

  it('returns value when short path matches', () => {
    const defaults = { name: 'something' };
    const context = {
      contextReference: () => '/root/name',
      contextNode: { nodeType: 'input' },
    } as InstanceValueContext;
    const actual = getInstanceDefaultValue(defaults, context);
    expect(actual).toEqual('something');
  });
});
