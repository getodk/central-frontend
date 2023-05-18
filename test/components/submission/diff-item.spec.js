import DiffItem from '../../../src/components/diff-item.vue';
import SubmissionDiffItem from '../../../src/components/submission/diff-item.vue';

import useFields from '../../../src/request-data/fields';

import testData from '../../data';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = (entry) => mount(SubmissionDiffItem, {
  props: {
    entry,
    projectId: '1',
    xmlFormId: testData.extendedForms.last().xmlFormId,
    instanceId: 'abcd',
    oldVersionId: 'v1',
    newVersionId: 'v2'
  },
  container: {
    requestData: testRequestData([useFields], {
      fields: testData.extendedForms.last()._fields
    })
  }
});

describe('SubmissionDiffItem', () => {
  beforeEach(() => {
    // The only info about a form that is needed to render
    // diffs is knowledge of which fields contain binary data
    testData.extendedForms.createPast(1, {
      xmlFormId: 'a',
      fields: [testData.fields.binary('/birds/bird/photo')]
    });
  });

  it('passes props to the DiffItem component', () => {
    const diff = {
      new: '17',
      old: '15',
      path: ['age']
    };
    const props = mountComponent(diff).getComponent(DiffItem).props();
    props.new.should.equal('17');
    props.old.should.equal('15');
    props.path.should.eql(['age']);
  });

  it('shows values as-is by default', () => {
    const diff = {
      new: '17',
      old: '15',
      path: ['age']
    };
    const component = mountComponent(diff);
    const dataOld = component.get('.data-old');
    dataOld.text().should.equal('15');
    // There should just be text, no child elements.
    dataOld.find('*').exists().should.be.false();
    const dataNew = component.get('.data-new');
    dataNew.text().should.equal('17');
    dataNew.find('*').exists().should.be.false();
  });

  it('shows media download links for binary files', () => {
    const diff = {
      new: 'new_file.jpg',
      old: 'old_file.jpg',
      path: ['birds', ['bird', 3], 'photo'] // (binary field with this path defined in beforeEach)
    };
    const component = mountComponent(diff);
    component.get('.data-old').text().should.equal('old_file.jpg');
    component.get('.data-old > a').attributes('href').should.equal('/v1/projects/1/forms/a/submissions/abcd/versions/v1/attachments/old_file.jpg');
    component.get('.data-new').text().should.equal('new_file.jpg');
    component.get('.data-new > a').attributes('href').should.equal('/v1/projects/1/forms/a/submissions/abcd/versions/v2/attachments/new_file.jpg');
  });

  it('shows media download links for binary files in repeat groups', () => {
    // When a repeat group changes between 0 and N elements (and the old or new diff value
    // is returned as an array), the flattenDiff algorithm has an issue where the path
    // can have an undefined in it, e.g. [[undefined, 0], 'photo'] for the following example.
    // This was affecting the binary file check and the binary link formation.
    const diff = {
      new: [
        {
          photo: 'new_file.jpg'
        }
      ],
      path: ['birds', 'bird']
    };
    const component = mountComponent(diff);
    component.get('.data-new').text().should.equal('new_file.jpg');
    component.get('.data-new > a').attributes('href').should.equal('/v1/projects/1/forms/a/submissions/abcd/versions/v2/attachments/new_file.jpg');
  });
});
