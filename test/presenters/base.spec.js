import { presenterClass } from '../../src/presenters/base';

class Point extends presenterClass(['x', 'y']) {}

describe('presenterClass()', () => {
  it('returns each known property', () => {
    const point = new Point({ x: 0, y: 1 });
    point.x.should.equal(0);
    point.y.should.equal(1);
  });

  it('does not return an unknown property', () => {
    const point = new Point({ x: 0, y: 1, z: 2 });
    should.not.exist(point.z);
  });

  it('returns the object', () => {
    const data = { x: 0, y: 1 };
    new Point(data).object.should.equal(data);
  });
});
