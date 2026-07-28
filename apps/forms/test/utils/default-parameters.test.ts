import { describe, expect, it } from 'vitest';
import { getDefaultParameters } from '../../src/utils/default-parameters';

describe('Default parameters', () => {

  it('handles no query parameters', () => {
    const given = {};
    expect(getDefaultParameters(given)).toEqual({});
  });

  it('ignores query parameters that do not match', () => {
    const given = { 'st': 'key' };
    expect(getDefaultParameters(given)).toEqual({});
  });

  it('ignores query parameters with empty path', () => {
    const given = { 'd[]': 'key' };
    expect(getDefaultParameters(given)).toEqual({});
  });

  it('ignores query parameters with empty value', () => {
    const given = { 'd[/root/path]': '' };
    expect(getDefaultParameters(given)).toEqual({});
  });

  it('ignores query parameters with array value', () => {
    const given = { 'd[/root/path]': [ 'a','b' ] };
    expect(getDefaultParameters(given)).toEqual({});
  });

  it('returns single query parameter', () => {
    const given = { 'd[/root/path]': 'a' };
    expect(getDefaultParameters(given)).toEqual({
      '/root/path': 'a'
    });
  });

  it('returns multiple query parameter', () => {
    const given = {
      'd[/root/path]': 'a',
      'd[shortform]': 'b',
      'd[/root/path/that/is/deep]': 'c'
    };
    expect(getDefaultParameters(given)).toEqual({
      '/root/path': 'a',
      'shortform': 'b',
      '/root/path/that/is/deep': 'c',
    });
  });

  it('returns values with special characters', () => {
    const given = { 'd[/root/path]': 'a ?[]= something' };
    expect(getDefaultParameters(given)).toEqual({
      '/root/path': 'a ?[]= something'
    });
  });
});
