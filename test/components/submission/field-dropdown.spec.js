import Multiselect from '../../../src/components/multiselect.vue';
import SubmissionDataRow from '../../../src/components/submission/data-row.vue';
import SubmissionFieldDropdown from '../../../src/components/submission/field-dropdown.vue';
import SubmissionTable from '../../../src/components/submission/table.vue';

import useFields from '../../../src/request-data/fields';

import testData from '../../data';
import { loadSubmissionList } from '../../util/submission';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = (options) =>
  mount(SubmissionFieldDropdown, mergeMountOptions(options, {
    props: { modelValue: [] },
    container: { requestData: testRequestData([useFields]) }
  }));

const { repeat, group, string } = testData.fields;
const strings = (min, max) => {
  const result = new Array(max - min + 1);
  for (let i = 0; i < result.length; i += 1)
    result[i] = string(`/s${min + i}`);
  return result;
};

describe('SubmissionFieldDropdown', () => {
  it('passes an option for each selectable field', () => {
    const component = mountComponent({
      container: {
        requestData: {
          fields: [repeat('/r'), string('/r/s1'), string('/s2'), string('/s3')]
        }
      }
    });
    const { options } = component.getComponent(Multiselect).props();
    const { fields } = component.vm.$container.requestData.localResources;
    const s2 = fields.find(field => field.name === 's2');
    const s3 = fields.find(field => field.name === 's3');
    options.should.eql([
      { value: s2, key: '/s2', text: 's2', title: 's2' },
      { value: s3, key: '/s3', text: 's3', title: 's3' }
    ]);
  });

  it('includes the group name in the option title', () => {
    const component = mountComponent({
      container: {
        requestData: { fields: [group('/g'), string('/g/s1')] }
      }
    });
    const { options } = component.getComponent(Multiselect).props();
    options[0].title.should.equal('g-s1');
  });

  it('shows a warning if more than 100 fields are selected', async () => {
    const component = mountComponent({
      props: { modelValue: [] },
      container: {
        requestData: { fields: strings(1, 101) }
      }
    });
    await component.get('select').trigger('click');
    const after = component.get('.after-list');
    after.text().should.equal('');
    await component.get('.select-all').trigger('click');
    after.text().should.equal('Selecting too many columns might slow down your computer.');
  });

  it('is not rendered if there are 11 selectable fields', async () => {
    testData.extendedForms.createPast(1, {
      fields: [...strings(1, 11), repeat('/r'), string('/r/s12')],
      submissions: 1
    });
    testData.extendedSubmissions.createPast(1);
    const component = await loadSubmissionList();
    component.findComponent(SubmissionFieldDropdown).exists().should.be.false();
    component.getComponent(SubmissionTable).props().fields.length.should.equal(11);
  });

  it('initially selects first 10 if there are 12 selectable fields', async () => {
    testData.extendedForms.createPast(1, {
      fields: [repeat('/r'), string('/r/s1'), ...strings(2, 13)],
      submissions: 1
    });
    testData.extendedSubmissions.createPast(1);
    const component = await loadSubmissionList();
    const selected = component.getComponent(SubmissionFieldDropdown).props().modelValue;
    selected.map(field => field.path).should.eql([
      '/s2', '/s3', '/s4', '/s5', '/s6',
      '/s7', '/s8', '/s9', '/s10', '/s11'
    ]);
    component.getComponent(SubmissionTable).props().fields.should.equal(selected);
  });

  describe('after the selection changes', () => {
    beforeEach(() => {
      testData.extendedForms.createPast(1, {
        fields: strings(1, 12),
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1);
    });

    const uncheckFirst = async (component) => {
      const dropdown = component.getComponent(SubmissionFieldDropdown);
      const select = dropdown.get('select');
      await select.trigger('click');
      await dropdown.get('input[type="checkbox"]').setValue(false);
      return select.trigger('click');
    };

    it('sends a request for submissions', () =>
      loadSubmissionList({ attachTo: document.body })
        .complete()
        .request(uncheckFirst)
        .beforeEachResponse((_, { url }) => {
          url.should.containEql('.svc/Submissions');
        })
        .respondWithData(testData.submissionOData));

    it('re-renders the table with the selected fields', () =>
      loadSubmissionList({ attachTo: document.body })
        .complete()
        .request(uncheckFirst)
        .beforeEachResponse(component => {
          component.findComponent(SubmissionDataRow).exists().should.be.false();
        })
        .respondWithData(testData.submissionOData)
        .afterResponse(component => {
          const table = component.getComponent(SubmissionTable);
          table.findComponent(SubmissionDataRow).exists().should.be.true();
          table.props().fields.length.should.equal(9);
        }));
  });
});
