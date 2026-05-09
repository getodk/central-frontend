import PasswordStrength from '../../src/components/password-strength.vue';

import { mount } from '../util/lifecycle';

describe('PasswordStrength', () => {
  const cases = [
    ['', 0],
    ['a', 1],
    ['aaaaaaa', 1],
    ['aaaaaaaa', 2],
    ['aaaaaaaaaa', 3],
    ['aaaaaaaaaaaa', 4],
    ['aaaaaaaaaaaaaa', 5]
  ];
  for (const [password, score] of cases) {
    it(`sets data-score to ${score} if the password is '${password}'`, () => {
      const component = mount(PasswordStrength, {
        props: { password }
      });
      const data = component.get('[data-score]').attributes('data-score');
      data.should.equal(score.toString());
    });
  }
});
