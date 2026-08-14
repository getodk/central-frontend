import { describe, expect, it } from 'vitest';
import { getDefaultParameters } from '../../src/utils/default-parameters';

describe('Default parameters', () => {

  it('handles no query parameters', () => {
    const given = {};
    expect(getDefaultParameters(given, 'new')).toEqual({});
  });

  it('ignores query parameters that do not match', () => {
    const given = { 'st': 'key' };
    expect(getDefaultParameters(given, 'new')).toEqual({});
  });

  it('ignores query parameters with empty path', () => {
    const given = { 'd[]': 'key' };
    expect(getDefaultParameters(given, 'new')).toEqual({});
  });

  it('ignores query parameters with empty value', () => {
    const given = { 'd[/root/path]': '' };
    expect(getDefaultParameters(given, 'new')).toEqual({});
  });

  it('ignores query parameters with array value', () => {
    const given = { 'd[/root/path]': [ 'a','b' ] };
    expect(getDefaultParameters(given, 'new')).toEqual({});
  });

  it('ignores query parameters when editing', () => {
    const given = { 'd[/root/path]': 'a' };
    expect(getDefaultParameters(given, 'edit')).toEqual({});
  });

  it('returns single query parameter', () => {
    const given = { 'd[/root/path]': 'a' };
    expect(getDefaultParameters(given, 'new')).toEqual({
      '/root/path': 'a'
    });
  });

  it('returns multiple query parameter', () => {
    const given = {
      'd[/root/path]': 'a',
      'd[shortform]': 'b',
      'd[/root/path/that/is/deep]': 'c'
    };
    expect(getDefaultParameters(given, 'new')).toEqual({
      '/root/path': 'a',
      'shortform': 'b',
      '/root/path/that/is/deep': 'c',
    });
  });

  it('returns keys with special characters', () => {
    const given = { 'd[/root/path[0][2]]': 'a' };
    expect(getDefaultParameters(given, 'new')).toEqual({
      '/root/path[0][2]': 'a'
    });
  });

  it('returns values with special characters', () => {
    const given = { 'd[/root/path]': 'a ?[]= something' };
    expect(getDefaultParameters(given, 'new')).toEqual({
      '/root/path': 'a ?[]= something'
    });
  });
});
