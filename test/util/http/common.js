// Common tests for a series of request-response cycles

// Tests that no request is sent.
export function testNoRequest(callback = undefined) {
  return callback != null
    ? this.request(callback).complete()
    : this.complete();
}
