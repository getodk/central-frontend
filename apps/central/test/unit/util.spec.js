import { sumUnderThreshold } from '../../src/util/util';

describe('util/util', () => {
  it('should sum the numbers under threshold', () => {
    sumUnderThreshold([3, 4, 2, 5, 10, 4], 3).should.be.eql(17);
  });
});
