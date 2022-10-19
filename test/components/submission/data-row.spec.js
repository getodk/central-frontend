import { Settings } from 'luxon';

import SubmissionDataRow from '../../../src/components/submission/data-row.vue';

import useFields from '../../../src/request-data/fields';

import createTestContainer from '../../util/container';
import testData from '../../data';
import { mount } from '../../util/lifecycle';
import { setLuxon } from '../../util/date-time';
import { testRequestData } from '../../util/request-data';

const mountComponent = (props = undefined) => {
  const container = createTestContainer({
    requestData: testRequestData([useFields], {
      fields: testData.extendedForms.last()._fields
    })
  });
  const { fields } = container.requestData.localResources;
  return mount(SubmissionDataRow, {
    props: {
      projectId: '1',
      xmlFormId: 'f',
      draft: false,
      submission: testData.submissionOData().value[0],
      fields: fields.data,
      ...props
    },
    container
  });
};

describe('SubmissionDataRow', () => {
  it('shows an empty string if the value of a field does not exist', () => {
    testData.extendedForms.createPast(1, {
      fields: [testData.fields.string('/s')],
      submissions: 1
    });
    testData.extendedSubmissions.createPast(1, { s: null });
    const td = mountComponent().get('td');
    td.text().should.equal('');
    should.not.exist(td.attributes().title);
  });

  it('correctly formats a string value', () => {
    testData.extendedForms.createPast(1, {
      fields: [testData.fields.string('/s')],
      submissions: 1
    });
    testData.extendedSubmissions.createPast(1, { s: 'foo' });
    const td = mountComponent().get('td');
    td.text().should.equal('foo');
    td.attributes().title.should.equal('foo');
    td.classes().length.should.equal(0);
  });

  describe('int values', () => {
    it('adds the int-field class', () => {
      testData.extendedForms.createPast(1, {
        fields: [testData.fields.int('/i')],
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1, { i: 1000 });
      mountComponent().get('td').classes('int-field').should.be.true();
    });

    it('correct formats the value', () => {
      testData.extendedForms.createPast(1, {
        fields: [testData.fields.int('/i')],
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1, { i: 1000 });
      const td = mountComponent().get('td');
      td.text().should.equal('1,000');
      td.attributes().title.should.equal('1,000');
    });
  });

  describe('decimal values', () => {
    it('adds the decimal-field class', () => {
      testData.extendedForms.createPast(1, {
        fields: [testData.fields.decimal('/d')],
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1);
      mountComponent().get('td').classes('decimal-field').should.be.true();
    });

    // Array of test cases, where each case is an array with the following
    // structure:
    // [raw value, expected formatted value]
    const cases = [
      [1, '1'],
      [1234, '1,234'],
      [1.2, '1.2'],
      [-1.2, '-1.2'],
      [1234.5678901234, '1,234.5678901234'],
      [-1234.567890123, '-1,234.567890123'],
      [0.0000000000001, '0.0000000000001'],
      [-0.000000000001, '-0.000000000001'],
      // More than 15 characters
      [1000000000000000, '1,000,000,000,000,000'],
      [-100000000000000, '-100,000,000,000,000'],
      [10000000000000.1, '10,000,000,000,000.1'],
      [-1000000000000.1, '-1,000,000,000,000.1'],
      [1234.56789012345, '1,234.5678901235'],
      [-1234.5678901234, '-1,234.567890123'],
      [0.00000000000001, '0'],
      [-0.0000000000001, '-0']
    ];

    for (const [rawValue, formattedValue] of cases) {
      it(`correctly formats ${rawValue}`, () => {
        testData.extendedForms.createPast(1, {
          fields: [testData.fields.decimal('/d')],
          submissions: 1
        });
        testData.extendedSubmissions.createPast(1, { d: rawValue });
        const td = mountComponent().get('td');
        td.text().should.equal(formattedValue);
        td.attributes().title.should.equal(formattedValue);
      });
    }
  });

  describe('date values', () => {
    // Each test case is an array with the following structure:
    // [raw value, expected formatted value]
    const cases = [
      ['2018-01-01', '2018/01/01'],
      // If we end up needing to support time zones, we should check that the
      // existing code accounts for DST.
      ['2018-01-01Z', 'Invalid DateTime'],
      ['2018-01-01+01:00', 'Invalid DateTime'],
      // A date value that is not ISO 8601
      ['2018/01/01', 'Invalid DateTime']
    ];

    for (const [rawValue, formattedValue] of cases) {
      it(`correctly formats ${rawValue}`, () => {
        testData.extendedForms.createPast(1, {
          fields: [testData.fields.date('/d')],
          submissions: 1
        });
        testData.extendedSubmissions.createPast(1, { d: rawValue });
        const td = mountComponent().get('td');
        td.text().should.equal(formattedValue);
        td.attributes().title.should.equal(formattedValue);
      });
    }
  });

  describe('time values', () => {
    const originalSettings = {};
    before(() => {
      originalSettings.defaultZoneName = Settings.defaultZoneName;
      originalSettings.now = Settings.now;
    });
    afterEach(() => {
      setLuxon(originalSettings);
    });

    /*
    Each test case is an array with the following structure:

    [
      default time zone (mocking the system time zone),
      ISO 8601 string to use as the current timestamp (mocking the system time),
      raw value,
      expected formatted value
    ]
    */
    const cases = [
      ['UTC+1', null, '01:02:03.567', '01:02:03'],
      ['UTC+1', null, '00:00:00Z', '00:00:00'],
      ['UTC+1', null, '02:00:00+02:00', '02:00:00'],
      ['UTC+1', null, '12 a.m.', 'Invalid DateTime'],
      // DST invalid time
      ['America/New_York', '2017-03-12', '02:30:00', '02:30:00'],
      ['America/New_York', '2017-03-12', '02:30:00Z', '02:30:00'],
      // DST ambiguous time
      ['America/New_York', '2017-11-05', '01:30:00', '01:30:00'],
      ['America/New_York', '2017-11-05', '01:30:00Z', '01:30:00']
    ];

    for (const [defaultZoneName, now, rawValue, formattedValue] of cases) {
      it(`correctly formats ${rawValue}`, () => {
        testData.extendedForms.createPast(1, {
          fields: [testData.fields.time('/t')],
          submissions: 1
        });
        testData.extendedSubmissions.createPast(1, { t: rawValue });

        setLuxon({ defaultZoneName });
        if (now != null) setLuxon({ now });

        const td = mountComponent().get('td');
        td.text().should.equal(formattedValue);
        td.attributes().title.should.equal(formattedValue);
      });
    }
  });

  describe('dateTime values', () => {
    const originalSettings = {};
    before(() => {
      originalSettings.defaultZoneName = Settings.defaultZoneName;
      originalSettings.now = Settings.now;
    });
    afterEach(() => {
      setLuxon(originalSettings);
    });

    /*
    Each test case is an array with the following structure:

    [
      default time zone (mocking the system time zone),
      ISO 8601 string to use as the current timestamp (mocking the system time),
      raw value,
      expected formatted value
    ]
    */
    const cases = [
      ['UTC+1', null, '2018-01-01T01:02:03.567', '2018/01/01 01:02:03'],
      ['UTC+1', null, '2018-01-01T00:00:00Z', '2018/01/01 01:00:00'],
      ['UTC+1', null, '2018-01-01T02:00:00+02:00', '2018/01/01 01:00:00'],
      ['UTC+1', null, '2018/01/01T00:00:00', 'Invalid DateTime'],
      // DST invalid time
      ['America/New_York', '2017-03-12', '2017-03-12T02:30:00', '2017/03/12 03:30:00'],
      ['America/New_York', '2017-03-12', '2017-03-12T02:30:00Z', '2017/03/11 21:30:00'],
      // DST ambiguous time
      ['America/New_York', '2017-11-05', '2017-11-05T01:30:00', '2017/11/05 01:30:00'],
      ['America/New_York', '2017-11-05', '2017-11-05T01:30:00Z', '2017/11/04 21:30:00']
    ];

    for (const [defaultZoneName, now, rawValue, formattedValue] of cases) {
      it(`correctly formats ${rawValue}`, () => {
        testData.extendedForms.createPast(1, {
          fields: [testData.fields.dateTime('/dt')],
          submissions: 1
        });
        testData.extendedSubmissions.createPast(1, { dt: rawValue });

        setLuxon({ defaultZoneName });
        if (now != null) setLuxon({ now });

        const td = mountComponent().get('td');
        td.text().should.equal(formattedValue);
        td.attributes().title.should.equal(formattedValue);
      });
    }
  });

  it('adds the geopoint-field class for a geopoint value', () => {
    testData.extendedForms.createPast(1, {
      fields: [testData.fields.geopoint('/g')],
      submissions: 1
    });
    testData.extendedSubmissions.createPast(1);
    mountComponent().get('td').classes('geopoint-field').should.be.true();
  });

  describe('binary field', () => {
    it("correctly renders a field of type 'binary'", () => {
      testData.extendedForms.createPast(1, {
        fields: [testData.fields.binary('/b')],
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1, {
        instanceId: 'a b',
        b: 'c d.jpg'
      });
      const td = mountComponent().get('td');
      td.classes('binary-field').should.be.true();
      should.not.exist(td.attributes().title);
      const a = td.get('a');
      const { href } = a.attributes();
      href.should.equal('/v1/projects/1/forms/f/submissions/a%20b/attachments/c%20d.jpg');
      a.find('.icon-check').exists().should.be.true();
      a.find('.icon-download').exists().should.be.true();
    });

    it('correctly renders a binary field of unknown type', () => {
      testData.extendedForms.createPast(1, {
        fields: [
          { path: '/b', name: 'b', type: 'something_unknown', binary: true }
        ],
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1, {
        instanceId: 'foo',
        b: 'bar.jpg'
      });
      const td = mountComponent().get('td');
      td.classes('binary-field').should.be.true();
      const { href } = td.get('a').attributes();
      href.should.equal('/v1/projects/1/forms/f/submissions/foo/attachments/bar.jpg');
    });

    it('does not render a link if the value does not exist', () => {
      testData.extendedForms.createPast(1, {
        fields: [testData.fields.binary('/b')],
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1, { b: null });
      const td = mountComponent().get('td');
      td.find('a').exists().should.be.false();
      td.text().should.equal('');
    });
  });

  it('shows the instance ID', () => {
    testData.extendedForms.createPast(1, {
      fields: [testData.fields.int('/i')],
      submissions: 1
    });
    testData.extendedSubmissions.createPast(1, { instanceId: 'foo' });
    const td = mountComponent().findAll('td');
    td.length.should.equal(2);
    td[1].text().should.equal('foo');
    td[1].attributes().title.should.equal('foo');
  });

  it('renders a cell for each field', () => {
    testData.extendedForms.createPast(1, {
      fields: [testData.fields.string('/s1'), testData.fields.string('/s2')],
      submissions: 1
    });
    testData.extendedSubmissions.createPast(1, {
      instanceId: 'foo',
      s1: 'bar',
      s2: 'baz'
    });
    const text = mountComponent().findAll('td').map(td => td.text());
    text.should.eql(['bar', 'baz', 'foo']);
  });

  describe('encrypted submission', () => {
    it('renders correctly', () => {
      testData.extendedProjects.createPast(1, {
        key: testData.standardKeys.createPast(1).last(),
        forms: 1
      });
      testData.extendedForms.createPast(1, {
        fields: [testData.fields.string('/s1'), testData.fields.string('/s2')],
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1, { status: 'notDecrypted' });
      const row = mountComponent();
      row.classes('encrypted-submission').should.be.true();
      const td = row.findAll('td');
      td.length.should.equal(2);
      td[0].attributes().colspan.should.equal('2');
    });

    it('does not show the encryption message if no fields are selected', () => {
      testData.extendedProjects.createPast(1, {
        key: testData.standardKeys.createPast(1).last(),
        forms: 1
      });
      testData.extendedSubmissions.createPast(1, { status: 'notDecrypted' });
      const row = mountComponent({ fields: [] });
      const td = row.findAll('td');
      td.length.should.equal(1);
      should.not.exist(td[0].attributes().colspan);
    });
  });
});
