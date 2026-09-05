import DlData from '../../../src/components/dl-data.vue';
import SubmissionAttachmentLink from '../../../src/components/submission/attachment-link.vue';
import SubmissionData from '../../../src/components/submission/data.vue';

import useFields from '../../../src/request-data/fields';
import useSubmission from '../../../src/request-data/submission';

import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockLogin } from '../../util/session';
import { testRequestData } from '../../util/request-data';

const mountOptions = (options = undefined) => {
  const form = testData.extendedForms.last();
  const submission = testData.submissionOData();
  return mergeMountOptions(options, {
    props: {
      projectId: '1',
      xmlFormId: form.xmlFormId,
      instanceId: testData.extendedSubmissions.last().instanceId
    },
    container: {
      requestData: testRequestData([useFields, useSubmission], {
        fields: form._fields,
        submission
      })
    }
  });
};

describe('SubmissionData', () => {
  beforeEach(() => {
    mockLogin();
    testData.extendedForms.createPast(1, {
      xmlFormId: 'a b',
      fields: [
        testData.fields.group('/names'),
        testData.fields.string('/names/first_name'),
        testData.fields.geopoint('/p1'),
        testData.fields.geopoint('/p2')
      ],
      submissions: 1
    });
    testData.extendedSubmissions.createPast(1, {
      instanceId: 'c d',
      reviewState: 'hasIssues',
      meta: { instanceName: 'Some instance' },
      names: { first_name: 'Someone' },
      p1: 'POINT (1 1)',
      p2: 'POINT (2 2)'
    });
  });

  it('shows form-field data', () => {
    const component = mount(SubmissionData, mountOptions());
    const pairs = component.findAllComponents(DlData);
    const names = pairs.map(pair => pair.get('dt .field-name').text());
    names.should.eql(['first_name', 'p1', 'p2']);

    const values = pairs.map(pair => pair.props().value);
    values.should.eql(['Someone', 'POINT (1 1)', 'POINT (2 2)']);
  });

  it('formats form-field data', () => {
    testData.extendedForms.createPast(1, {
      xmlFormId: 'f',
      fields: [
        testData.fields.int('/i1'),
        testData.fields.int('/i2'),
        testData.fields.binary('/b1'),
        testData.fields.binary('/b2'),
        testData.fields.geopoint('/p1')
      ]
    });
    testData.extendedSubmissions.createPast(1, {
      instanceId: 's',
      i1: 1000,
      i2: null,
      b1: 'foo.jpg',
      b2: null,
      p1: 'POINT (1 1)'
    });
    const component = mount(SubmissionData, mountOptions());
    const dd = component.findAll('.dl-data-dd');
    dd.length.should.equal(5);

    dd[0].text().should.equal('1,000');
    dd[1].text().should.equal('(empty)');

    dd[2].getComponent(SubmissionAttachmentLink).props().should.include({
      projectId: '1',
      xmlFormId: 'f',
      draft: false,
      instanceId: 's',
      attachmentName: 'foo.jpg',
      deleted: false
    });
    dd[2].text().should.equal('');

    dd[3].findComponent(SubmissionAttachmentLink).exists().should.be.false;
    dd[3].text().should.equal('(empty)');
  });

  it('shows a tooltip above name of form field with its full column header', async () => {
    const component = mount(SubmissionData, mountOptions());
    const name = component.getComponent(DlData).get('dt .field-name');
    name.text().should.equal('first_name');
    await name.should.have.tooltip('names-first_name');
  });

  it('shows checkmark for the mapped field', () => {
    const component = mount(SubmissionData, mountOptions({
      props: { mappedFieldPath: '/p1' }
    }));
    const pair = component.findAllComponents(DlData)[1];
    pair.find('.icon-check-circle').exists().should.be.true;
  });
});
