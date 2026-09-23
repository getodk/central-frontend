import {
  bind,
  body,
  group,
  head,
  html,
  input,
  instance,
  item,
  mainInstance,
  model,
  select1,
  t,
  title,
} from '@getodk/common/test-utils/xform-dsl/index.ts';
import type { ExpectStatic } from 'vitest';
import { describe, expect, it } from 'vitest';
import { intAnswer } from '../scenario/answer/ExpectedIntAnswer.ts';
import { stringAnswer } from '../scenario/answer/ExpectedStringAnswer.ts';
import { Scenario } from '../scenario/jr/Scenario.ts';

describe('TriggerableDagTest.java', () => {
  // order_of_the_DAG_is_ensured
  it('recomputes `calculate` expressions when their dependencies are updated', async () => {
    const scenario = await Scenario.init(
      'Some form',
      html(
        head(
          title('Some form'),
          model(
            mainInstance(t('data id="some-form"', t('a', '2'), t('b'), t('c'))),
            bind('/data/a').type('int'),
            bind('/data/b').type('int').calculate('/data/a * 3'),
            bind('/data/c').type('int').calculate('(/data/a + /data/b) * 5')
          )
        ),
        body(input('/data/a'))
      )
    );

    expect(scenario.answerOf('/data/a')).toEqualAnswer(intAnswer(2));
    expect(scenario.answerOf('/data/b')).toEqualAnswer(intAnswer(6));
    expect(scenario.answerOf('/data/c')).toEqualAnswer(intAnswer(40));

    scenario.answer('/data/a', 3);

    expect(scenario.answerOf('/data/a')).toEqualAnswer(intAnswer(3));
    expect(scenario.answerOf('/data/b')).toEqualAnswer(intAnswer(9));
    // Verify that c gets computed using the updated value of b.
    expect(scenario.answerOf('/data/c')).toEqualAnswer(intAnswer(60));
  });

  it('multiplication result is blank when an operand is blank', async () => {
    const scenario = await Scenario.init(
      'Calculate with blank operand',
      html(
        head(
          title('Calculate with blank operand'),
          model(
            mainInstance(t('data id="calculate-blank"', t('q1'), t('c1'), t('c2'))),
            bind('/data/q1').type('int'),
            bind('/data/c1').calculate('2 * /data/q1'),
            bind('/data/c2').calculate('/data/c1')
          )
        ),
        body(input('/data/q1'), input('/data/c2'))
      )
    );

    expect(scenario.answerOf('/data/c1').getValue()).toBe('');
    expect(scenario.answerOf('/data/c2').getValue()).toBe('');

    scenario.answer('/data/q1', 7);

    expect(scenario.answerOf('/data/c1')).toEqualAnswer(intAnswer(14));
    expect(scenario.answerOf('/data/c2')).toEqualAnswer(intAnswer(14));
  });

  it('addition result is blank when one operand is blank', async () => {
    const scenario = await Scenario.init(
      'Calculate with blank operand',
      html(
        head(
          title('Calculate with blank operand'),
          model(
            mainInstance(t('data id="calculate-blank"', t('a'), t('b'), t('a_plus_b'), t('disp'))),
            bind('/data/a').type('int'),
            bind('/data/b').type('int'),
            bind('/data/a_plus_b').calculate('/data/a + /data/b'),
            bind('/data/disp').calculate('/data/a_plus_b')
          )
        ),
        body(input('/data/a'), input('/data/b'), input('/data/disp'))
      )
    );

    expect(scenario.answerOf('/data/a_plus_b').getValue()).toBe('');
    expect(scenario.answerOf('/data/disp').getValue()).toBe('');

    scenario.answer('/data/a', 7);

    expect(scenario.answerOf('/data/a_plus_b').getValue()).toBe('');
    expect(scenario.answerOf('/data/disp').getValue()).toBe('');

    scenario.answer('/data/b', 3);

    expect(scenario.answerOf('/data/a_plus_b')).toEqualAnswer(intAnswer(10));
    expect(scenario.answerOf('/data/disp')).toEqualAnswer(intAnswer(10));
  });
});

describe('MultiplePredicateTest.java', () => {
  describe('[calculate] calculates', () => {
    /**
     * **PORTING NOTES**
     *
     * Typical `nullValue()` -> blank/empty string value check.
     */
    it('support[s] multiple predicates in one part of [the expression] path', async () => {
      const scenario = await Scenario.init(
        'Some form',
        html(
          head(
            title('Some form'),
            model(
              mainInstance(t('data id="some-form"', t('calc'), t('input'))),
              instance(
                'instance',
                t('item', t('value', 'A'), t('count', '2'), t('id', 'A2')),
                t('item', t('value', 'A'), t('count', '3'), t('id', 'A3')),
                t('item', t('value', 'B'), t('count', '2'), t('id', 'B2'))
              ),
              bind('/data/calc')
                .type('string')
                .calculate("instance('instance')/root/item[value = 'A'][count = /data/input]/id"),
              bind('/data/input').type('string')
            )
          ),
          body(input('/data/input'))
        )
      );

      scenario.answer('/data/input', '3');

      expect(scenario.answerOf('/data/calc').getValue()).toBe('A3');

      scenario.answer('/data/input', '2');

      expect(scenario.answerOf('/data/calc').getValue()).toBe('A2');

      scenario.answer('/data/input', '7');

      // assertThat(scenario.answerOf("/data/calc"), nullValue());
      expect(scenario.answerOf('/data/calc').getValue()).toBe('');
    });

    /**
     * **PORTING NOTES**
     *
     * - JavaRosa's use of `getValue` with a numeric assertion would require
     *   additional casting. Ported to use {@link ExpectStatic.toEqualAnswer}
     *   for similar semantics.
     *
     * - Following note is no longer applicable, but it is preserved (struck),
     *   to provide context for the next point which remains pertinent.
     *
     * - ~~Even when adjusting the `calculate` expression to escape `<`, this
     *   test will fail parsing the `calculate` expression itself. Evidently
     *   this is due to the unqualified name test `child`.~~
     *
     * - Note, in the above point, that the XPath syntax is referenced as
     *   "abbreviated child-axis steps". This is another current discrepancy in
     *   the `tree-sitter-xpath` grammar, albeit one without such form-breaking
     *   impact (which is why it hasn't been filed yet). Despite previous
     *   misreadings of the XPath grammar spec, `/@foo` and `/foo` are both
     *   considered steps with an `AbbreviatedAxisSpecifier` (whose grammar is
     *   "@?"). We should probably at least file this as an issue. Even though
     *   the distinction hasn't produced any meaningful consequences in our
     *   usage, correcting it would benefit any other potential users of
     *   `tree-sitter-xpath` once it's published.
     */
    it('support[s] multiple predicates in multiple parts of [the expression] path', async () => {
      const scenario = await Scenario.init(
        'Some form',
        html(
          head(
            title('Some form'),
            model(
              mainInstance(t('data id="some-form"', t('calc'), t('input'))),
              instance(
                'instance',
                t(
                  'item',
                  t('name', 'Bob Smith'),
                  t('yob', '1966'),
                  t('child', t('name', 'Sally Smith'), t('yob', '1988')),
                  t('child', t('name', 'Kwame Smith'), t('yob', '1990'))
                ),
                t(
                  'item',
                  t('name', 'Hu Xao'),
                  t('yob', '1972'),
                  t('child', t('name', 'Foo Bar'), t('yob', '1988')),
                  t('child', t('name', 'Foo2 Bar'), t('yob', '2008'))
                ),
                t(
                  'item',
                  t('name', 'Baz Quux'),
                  t('yob', '1968'),
                  t('child', t('name', 'Baz2 Quux'), t('yob', '1988')),
                  t('child', t('name', 'Baz3 Quux'), t('yob', '1988'))
                )
              ),
              bind('/data/calc')
                .type('string')
                .calculate("count(instance('instance')/root/item[yob < 1970]/child[yob = 1988])"),
              bind('/data/input').type('string')
            )
          ),
          body(input('/data/input'))
        )
      );

      // assertThat(scenario.answerOf("/data/calc").getValue(), equalTo(3));
      expect(scenario.answerOf('/data/calc')).toEqualAnswer(intAnswer(3));
    });
  });
});

describe('jr:itext function in calculate expressions', () => {
  it('should retrieve the correct itext value', async () => {
    const scenario = await Scenario.init(
      'Itext with calculation',
      html(
        head(
          title('Itext with calculation'),
          model(
            mainInstance(
              t('data id="dynamic-choices-predicates"', t('country'), t('city'), t('city_name'))
            ),

            t(
              'itext',
              t(
                'translation lang="default"',
                t('text id="static_instance-cities-0"', t('value', 'Montreal')),
                t('text id="static_instance-cities-1"', t('value', 'Marseille'))
              ),
              t(
                'translation lang="es"',
                t('text id="static_instance-cities-0"', t('value', 'Montréal')),
                t('text id="static_instance-cities-1"', t('value', 'Marsella'))
              )
            ),

            t(
              'instance id="cities"',
              t(
                'root',
                t(
                  'item',
                  t('itextId', 'static_instance-cities-0'),
                  t('name', 'montreal'),
                  t('country', 'canada')
                ),
                t(
                  'item',
                  t('itextId', 'static_instance-cities-1'),
                  t('name', 'marseille'),
                  t('country', 'france')
                )
              )
            ),
            bind('/data/country').type('string'),
            bind('/data/city_name')
              .type('string')
              .calculate(
                "if(/data/country ='canada', jr:itext(instance('cities')/root/item[name='montreal']/itextId), jr:itext(instance('cities')/root/item[name='marseille']/itextId))"
              )
          )
        ),
        body(select1('/data/country', item('canada', 'Canada'), item('france', 'France')))
      )
    );

    scenario.answer('/data/country', 'france');
    expect(scenario.answerOf('/data/city_name')).toEqualAnswer(stringAnswer('Marseille'));

    scenario.answer('/data/country', 'canada');
    expect(scenario.answerOf('/data/city_name')).toEqualAnswer(stringAnswer('Montreal'));

    scenario.setLanguage('es');

    scenario.answer('/data/country', 'france');
    expect(scenario.answerOf('/data/city_name')).toEqualAnswer(stringAnswer('Marsella'));

    scenario.answer('/data/country', 'canada');
    expect(scenario.answerOf('/data/city_name')).toEqualAnswer(stringAnswer('Montréal'));
  });
});

describe('calculate depending on a group node', () => {
  // ref: https://github.com/getodk/web-forms/issues/178
  it('recomputes when any child of the referenced group changes', async () => {
    const scenario = await Scenario.init(
      'Group dependency',
      html(
        head(
          title('Group dependency'),
          model(
            mainInstance(
              t('data id="group-dependency"', t('g1', t('t1'), t('t2')), t('group_text'))
            ),
            bind('/data/g1/t1').type('string'),
            bind('/data/g1/t2').type('string'),
            // string(/data/g1) is the text of all its descendants joined
            bind('/data/group_text').type('string').calculate('/data/g1')
          )
        ),
        body(group('/data/g1', input('/data/g1/t1'), input('/data/g1/t2')))
      )
    );

    scenario.answer('/data/g1/t1', 'first');
    expect(scenario.answerOf('/data/group_text')).toEqualAnswer(stringAnswer('first'));

    scenario.answer('/data/g1/t2', 'second');
    expect(scenario.answerOf('/data/group_text')).toEqualAnswer(stringAnswer('firstsecond'));

    scenario.answer('/data/g1/t1', 'changed');
    expect(scenario.answerOf('/data/group_text')).toEqualAnswer(stringAnswer('changedsecond'));
  });
});
