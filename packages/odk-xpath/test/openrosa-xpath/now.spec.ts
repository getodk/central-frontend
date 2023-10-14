import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

describe('#now()', () => {
  let testContext: TestContext;

  beforeEach(() => {
    testContext = createTestContext();
  });

  // ODK spec says:
  // > Deviates from XForms 1.0 in that it returns the current date and time
  // > including timezone offset (i.e. not normalized to UTC) as described
  // > under the dateTime datatype.
  it('should return a timestamp for this instant', () => {
    // this check might fail if run at precisely midnight ;-)

    // given
    const now = new Date();
    const today = `${now.getFullYear()}-${(1+now.getMonth()).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

    // when
    const result = testContext.evaluate('now()', null, XPathResult.STRING_TYPE).stringValue;

    expect(result.split('T')[0]).to.equal(today);

    // assert timezone is included
    expect(result).toMatch(/-07:00$/);
  });
});
