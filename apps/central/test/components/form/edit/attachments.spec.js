import FormEditSection from '../../../../src/components/form/edit/section.vue';

import testData from '../../../data';
import { dragAndDrop } from '../../../util/trigger';
import { load } from '../../../util/http';
import { mockLogin } from '../../../util/session';

describe('FormEditAttachments', () => {
  beforeEach(mockLogin);

  describe('subtitle', () => {
    it('shows the correct text if there is a missing attachment', async () => {
      testData.extendedForms.createPast(1, { draft: true });
      testData.standardFormAttachments
        .createPast(1, { blobExists: true })
        .createPast(1, { datasetExists: true })
        .createPast(1, { blobExists: false, datasetExists: false });
      const app = await load('/projects/1/forms/f/draft');
      const subtitle = app.get('#form-edit-attachments .form-edit-section-subtitle').text();
      subtitle.should.equal('1 missing attachment');
    });

    it('shows the correct text if all attachments have been uploaded', async () => {
      testData.extendedForms.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(2);
      const app = await load('/projects/1/forms/f/draft');
      const subtitle = app.get('#form-edit-attachments .form-edit-section-subtitle').text();
      subtitle.should.equal('2 attachments');
    });
  });

  it('shows the correct text if there are no attachments', async () => {
    testData.extendedForms.createPast(1, { draft: true });
    const app = await load('/projects/1/forms/f/draft');
    const p = app.get('#form-edit-attachments .form-edit-section-body p');
    p.text().should.startWith('This definition requires no attachments,');
  });

  it('shows a warning if there is a missing attachment', async () => {
    testData.extendedForms.createPast(1, { draft: true });
    testData.standardFormAttachments.createPast(1, { blobExists: false });
    const app = await load('/projects/1/forms/f/draft');
    const section = app.get('#form-edit-attachments').getComponent(FormEditSection);
    section.props().warning.should.be.true;
  });

  describe('tag', () => {
    const testCases = [
      {
        text: '1 new attachment',
        published: [],
        draft: [{ name: 'foo' }]
      },
      {
        text: '2 new attachments',
        published: [{ name: 'foo' }],
        draft: [{ name: 'foo' }, { name: 'bar' }, { name: 'baz' }]
      },
      {
        text: '1 changed attachment',
        published: [{ name: 'foo', hash: '1' }],
        draft: [{ name: 'foo', hash: '2' }]
      },
      {
        text: '1 changed attachment',
        published: [{ name: 'foo', hash: null }],
        draft: [{ name: 'foo', hash: '1' }]
      },
      {
        text: '1 changed attachment',
        published: [{ name: 'foo', hash: '1' }],
        draft: [{ name: 'foo', hash: null }]
      },
      {
        text: '1 changed attachment',
        published: [{ name: 'foo', blobExists: false, datasetExists: false }],
        draft: [{ name: 'foo', datasetExists: true }]
      },
      {
        text: '1 changed attachment',
        published: [{ name: 'foo', datasetExists: true }],
        draft: [{ name: 'foo', blobExists: false, datasetExists: false }]
      },
      {
        text: '1 changed attachment',
        published: [{ name: 'foo', blobExists: true }],
        draft: [{ name: 'foo', datasetExists: true }]
      },
      {
        text: '2 changed attachments',
        published: [
          { name: 'foo', hash: '1' },
          { name: 'bar', hash: '2' },
          { name: 'baz', hash: '3' }
        ],
        draft: [
          { name: 'foo', hash: '1' },
          { name: 'bar', hash: '4' },
          { name: 'baz', hash: '5' }
        ]
      },
      {
        text: '1 new attachment and 1 changed attachment',
        published: [{ name: 'foo', hash: '1' }],
        draft: [{ name: 'foo', hash: '2' }, { name: 'bar' }]
      },
      {
        text: '',
        published: [{ name: 'foo' }],
        draft: [{ name: 'foo' }]
      },
      {
        text: '',
        published: [],
        draft: []
      },
      {
        text: '',
        published: [{ name: 'foo' }],
        draft: []
      },
      {
        text: '',
        published: [{ name: 'foo' }, { name: 'bar' }],
        draft: [{ name: 'foo' }]
      }
    ];
    for (const [i, testCase] of testCases.entries()) {
      it(`shows the correct text for case ${i} (expected: '${testCase.text}')`, async () => {
        testData.extendedForms.createPast(1);
        testData.extendedFormVersions.createPast(1, { draft: true });
        for (const options of testCase.published)
          testData.standardFormAttachments.createPast(1, options);
        const publishedAttachments = testData.standardFormAttachments.sorted();
        testData.standardFormAttachments.splice(0);
        for (const options of testCase.draft)
          testData.standardFormAttachments.createPast(1, options);
        const app = await load('/projects/1/forms/f/draft', {}, {
          publishedAttachments: () => publishedAttachments
        });
        const tag = app.get('#form-edit-attachments .form-edit-section-tag').text();
        if (testCase.text === '')
          tag.should.equal('');
        else
          tag.should.startWith(`${testCase.text} since `);
      });
    }

    it('is not shown if the form is a draft', async () => {
      testData.extendedForms.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(1);
      const app = await load('/projects/1/forms/f/draft');
      const tag = app.get('#form-edit-attachments .form-edit-section-tag').text();
      tag.should.equal('');
    });

    it('updates the tag after a file is uploaded', async () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(1, {
        name: 'foo',
        blobExists: false
      });
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(app => dragAndDrop(
          app.get('.form-attachment-row'),
          [new File([''], 'foo')]
        ))
        .respondWithData(() => testData.standardFormAttachments.update(0, {
          blobExists: true,
          exists: true,
          hash: '1'
        }))
        .afterResponse(app => {
          const tag = app.get('#form-edit-attachments .form-edit-section-tag').text();
          tag.should.startWith('1 changed attachment since ');
        });
    });

    it('updates the tag after linking to an entity list', async () => {
      testData.extendedProjects.createPast(1, { forms: 1, datasets: 1 });
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(1, {
        type: 'file',
        name: 'trees.csv',
        blobExists: false
      });
      testData.extendedDatasets.createPast(1, { name: 'trees' });
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(async (component) => {
          await component.get('.form-attachment-row .btn-link-dataset').trigger('click');
          return component.get('#form-attachment-link-dataset .btn-link-dataset').trigger('click');
        })
        .respondWithData(() => testData.standardFormAttachments.update(0, {
          datasetExists: true,
          exists: true
        }))
        .afterResponse(app => {
          const tag = app.get('#form-edit-attachments .form-edit-section-tag').text();
          tag.should.startWith('1 changed attachment since ');
        });
    });
  });
});
