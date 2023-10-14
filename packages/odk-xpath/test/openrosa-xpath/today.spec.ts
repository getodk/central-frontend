import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

describe('#today()', () => {
  let testContext: TestContext;

  beforeEach(() => {
    testContext = createTestContext();
  });

  // TODO: mock date, randomize. This test is otherwise testing an implementation
  // of the behavior under test!
  it('should return today\'s date', () => {
    // given
    const date = new Date();
    const today = date.getFullYear() + '-' + `${date.getMonth()+1}`.padStart(2, '0') + '-' + `${date.getDate()}`.padStart(2, '0');

    // expect
    testContext.assertStringValue('today()', today);
  });
});
