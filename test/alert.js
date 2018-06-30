// ComponentAlert is not the default export of lib/alert.js, so for consistency,
// MockComponentAlert is not the default export here.
// eslint-disable-next-line import/prefer-default-export
export class MockComponentAlert {
  _getError() { return new Error('alert is a mock and does not have data'); }
  get state() { throw this._getError(); }
  get type() { throw this._getError(); }
  get message() { throw this._getError(); }
  get at() { throw this._getError(); }

  success() {}
  info() {}
  warning() {}
  danger() {}

  blank() {}
}
