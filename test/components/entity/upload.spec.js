import { DateTime } from 'luxon';
import { T } from 'ramda';

import EntityFilters from '../../../src/components/entity/filters.vue';
import EntityUpload from '../../../src/components/entity/upload.vue';
import EntityUploadDataError from '../../../src/components/entity/upload/data-error.vue';
import EntityUploadHeaderErrors from '../../../src/components/entity/upload/header-errors.vue';
import EntityUploadPopup from '../../../src/components/entity/upload/popup.vue';
import EntityUploadTable from '../../../src/components/entity/upload/table.vue';
import EntityUploadWarnings from '../../../src/components/entity/upload/warnings.vue';
import OdataLoadingMessage from '../../../src/components/odata-loading-message.vue';

import { relativeUrl } from '../../util/request';

import testData from '../../data';
import { mockHttp, load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { setFiles } from '../../util/trigger';
import { waitUntil } from '../../util/util';

const showModal = () => {
  const dataset = testData.extendedDatasets.last();
  return mockHttp()
    .mount(EntityUpload, {
      container: {
        requestData: { dataset }
      }
    })
    .request(modal => modal.setProps({ state: true }))
    .modify(series => (dataset.entities !== 0
      ? series.respondWithData(() => testData.entityOData(5, 0, true))
      : series));
};
const parseFilterTime = (filter) => {
  const match = filter.match(/^__system\/createdAt le (.+)/);
  return match == null
    ? NaN
    : DateTime.fromISO(match[1]).toMillis();
};
const createCSV = (text = 'label\ndogwood') => new File([text], 'my_data.csv');
const selectFile = async (modal, file = createCSV()) => {
  await setFiles(modal.get('input'), [file]);
  return waitUntil(() => !modal.vm.parsing);
};
const getTables = (modal) => {
  const tables = modal.findAllComponents(EntityUploadTable);
  tables.length.should.equal(2);
  return tables;
};

describe('EntityUpload', () => {
  it('toggles the modal', () => {
    mockLogin();
    testData.extendedDatasets.createPast(1);
    return load('/projects/1/entity-lists/trees/entities', { root: false })
      .testModalToggles({
        modal: EntityUpload,
        show: '#dataset-entities-upload-button',
        hide: '.modal-actions .btn-link'
      });
  });

  it('does not render the upload button for a project viewer', async () => {
    mockLogin({ role: 'none' });
    testData.extendedProjects.createPast(1, { role: 'viewer', datasets: 1 });
    testData.extendedDatasets.createPast(1);
    const component = await load('/projects/1/entity-lists/trees/entities', {
      root: false
    });
    const button = component.find('#dataset-entities-upload-button');
    button.exists().should.be.false;
  });

  describe('request for server data', () => {
    it('sends the correct request', () => {
      testData.extendedDatasets.createPast(1, { name: 'á', entities: 1 });
      testData.extendedEntities.createPast(1);
      return showModal().testRequests([{
        url: ({ pathname, searchParams: params }) => {
          pathname.should.equal('/v1/projects/1/datasets/%C3%A1.svc/Entities');
          const millis = parseFilterTime(params.get('$filter'));
          (Date.now() - millis).should.be.below(2000);
          params.get('$top').should.equal('5');
          params.get('$skip').should.equal('0');
          params.get('$count').should.equal('true');
        }
      }]);
    });

    it('does not send a request if there are no entities', () => {
      testData.extendedDatasets.createPast(1);
      return showModal().testNoRequest();
    });

    it('sends a new request if the modal is hidden, then shown again', () => {
      testData.extendedEntities.createPast(1);
      let firstTime;
      return showModal()
        .beforeEachResponse((_, { url }) => {
          const params = relativeUrl(url).searchParams;
          firstTime = parseFilterTime(params.get('$filter'));
        })
        .complete()
        .request(async (modal) => {
          await modal.setProps({ state: false });
          await modal.setProps({ state: true });
        })
        .respondWithData(() => testData.entityOData(5, 0, true))
        .testRequests([{
          url: ({ pathname, searchParams: params }) => {
            pathname.should.equal('/v1/projects/1/datasets/trees.svc/Entities');
            const millis = parseFilterTime(params.get('$filter'));
            millis.should.be.above(firstTime);
            (Date.now() - millis).should.be.below(2000);
          }
        }]);
    });
  });

  describe('after a file is selected', () => {
    beforeEach(() => {
      testData.extendedDatasets.createPast(1);
    });

    it('shows the pop-up', async () => {
      const modal = await showModal();
      await selectFile(modal);
      const popup = modal.getComponent(EntityUploadPopup);
      popup.props().filename.should.equal('my_data.csv');
      popup.props().count.should.equal(1);
    });

    it('hides the drop zone', async () => {
      const modal = await showModal();
      const dropZone = modal.get('#entity-upload-file-select');
      dropZone.should.be.visible();
      await selectFile(modal);
      dropZone.should.be.hidden();
    });

    it('enables the append button', async () => {
      const modal = await showModal();
      const button = modal.get('.modal-actions .btn-primary');
      button.attributes('aria-disabled').should.equal('true');
      await selectFile(modal);
      button.attributes('aria-disabled').should.equal('false');
    });
  });

  describe('header errors', () => {
    beforeEach(() => {
      testData.extendedDatasets.createPast(1, {
        properties: [{ name: 'height' }]
      });
    });

    it('shows errors', async () => {
      const modal = await showModal();
      await selectFile(modal, createCSV('foo,,foo\n1,2,3'));
      modal.getComponent(EntityUploadHeaderErrors).props().should.eql({
        filename: 'my_data.csv',
        header: 'foo,,foo',
        delimiter: ',',
        invalidQuotes: false,
        missingLabel: true,
        missingProperty: true,
        unknownProperty: true,
        duplicateColumn: true,
        emptyColumn: true
      });
    });

    it('uses the delimiter from the file', async () => {
      const modal = await showModal();
      const csv = createCSV('label;height;circumference\ndogwood;1;2');
      await selectFile(modal, csv);
      modal.getComponent(EntityUploadHeaderErrors).props().delimiter.should.equal(';');
    });
  });

  describe('binary file', () => {
    beforeEach(() => {
      testData.extendedDatasets.createPast(1);
    });

    it('shows an alert for a null character in the header', async () => {
      const modal = await showModal();
      await selectFile(modal, createCSV('f\0o'));
      modal.should.alert('danger', 'The file “my_data.csv” is not a valid .csv file. It cannot be read.');
      modal.findComponent(EntityUploadHeaderErrors).exists().should.be.false;
    });

    it('hides the alert after a valid file is selected', async () => {
      const modal = await showModal();
      await selectFile(modal, createCSV('f\0o'));
      await selectFile(modal);
      modal.should.not.alert();
      modal.findComponent(EntityUploadPopup).exists().should.be.true;
    });

    // This is not necessarily the ideal behavior. Showing an alert would be
    // more consistent with what happens for a null character in the header.
    // This test documents the current expected behavior.
    it('renders EntityUploadDataError for a null character after header', async () => {
      const modal = await showModal();
      await selectFile(modal, createCSV('label\nf\0o'));
      const { message } = modal.getComponent(EntityUploadDataError).props();
      message.should.equal('The file “my_data.csv” is not a valid .csv file. It cannot be read.');
      modal.should.not.alert();
    });
  });

  describe('warnings', () => {
    beforeEach(() => {
      testData.extendedDatasets.createPast(1, {
        properties: [{ name: 'height' }]
      });
    });

    it('shows warnings', async () => {
      const modal = await showModal();
      const csv = createCSV('label,height\nx\ny\n"12345,67890",""');
      await selectFile(modal, csv);
      modal.getComponent(EntityUploadWarnings).props().should.eql({
        raggedRows: [[1, 2]],
        largeCell: 3
      });
      modal.getComponent(EntityUploadPopup).props().warnings.should.equal(2);
    });

    it('does not show warnings if there is a data error', async () => {
      const modal = await showModal();
      await selectFile(modal, createCSV('label,height\nx\ny,""\n"",1'));
      const error = modal.getComponent(EntityUploadDataError).props().message;
      error.should.startWith('There is a problem on row 4');
      modal.findComponent(EntityUploadWarnings).exists().should.be.false;
    });

    it('shows rows to which a warning applies after they are selected', async () => {
      const modal = await showModal();
      const data = [
        ['1', ''],
        ['2', '2'],
        ['3', '3'],
        ['4', '4'],
        ['5', '5'],
        ['6', '6'],
        ['7', '7'],
        ['8', '8'],
        ['9'],
        ['10'],
        ['11'],
        ['12', '12']
      ];
      const dataString = data.map(row => row.join(',')).join('\n');
      await selectFile(modal, createCSV(`label,height\n${dataString}`));
      const warnings = modal.getComponent(EntityUploadWarnings);
      warnings.props().raggedRows.should.eql([[9, 11]]);
      const table = getTables(modal)[1];
      table.props().rowIndex.should.equal(0);
      should.not.exist(table.props().highlighted);
      const a = modal.get('.entity-upload-warning a');
      a.text().should.equal('9–11');
      await a.trigger('click');
      table.props().rowIndex.should.equal(5);
      table.props().highlighted.should.eql([8, 10]);
    });

    it('does not highlight rows after a new file is selected', async () => {
      const modal = await showModal();
      const csvString = 'label,height\nx\ny\nz,""';
      await selectFile(modal, createCSV(csvString));
      const a = modal.get('.entity-upload-warning a');
      a.text().should.equal('1–2');
      await a.trigger('click');
      getTables(modal)[1].props().highlighted.should.eql([0, 1]);
      await modal.get('#entity-upload-popup .btn-link').trigger('click');
      await selectFile(modal, createCSV(csvString));
      should.not.exist(getTables(modal)[1].props().highlighted);
    });
  });

  it('resets after the clear button is clicked', async () => {
    testData.extendedDatasets.createPast(1);
    const modal = await showModal();
    await selectFile(modal, createCSV('label\nx\n"12345,67890"'));
    const popup = modal.getComponent(EntityUploadPopup);
    popup.props().warnings.should.equal(1);
    await popup.get('.btn-link').trigger('click');
    modal.findComponent(EntityUploadPopup).exists().should.be.false;
    modal.findComponent(EntityUploadWarnings).exists().should.be.false;
    modal.get('#entity-upload-file-select').should.be.visible();
    const button = modal.get('.modal-actions .btn-primary');
    button.attributes('aria-disabled').should.equal('true');
  });

  it('resets after the modal is hidden', async () => {
    testData.extendedDatasets.createPast(1);
    const modal = await showModal();
    await selectFile(modal, createCSV('label\nx\n"12345,67890"'));
    modal.findComponent(EntityUploadWarnings).exists().should.be.true;
    await modal.setProps({ state: false });
    await modal.setProps({ state: true });
    modal.findComponent(EntityUploadPopup).exists().should.be.false;
    modal.findComponent(EntityUploadWarnings).exists().should.be.false;
    modal.get('#entity-upload-file-select').should.be.visible();
    const button = modal.get('.modal-actions .btn-primary');
    button.attributes('aria-disabled').should.equal('true');
  });

  it('sends the correct upload request', () => {
    testData.extendedDatasets.createPast(1, { name: 'á' });
    return showModal()
      .complete()
      .request(async (modal) => {
        await selectFile(modal);
        return modal.get('.modal-actions .btn-primary').trigger('click');
      })
      .respondWithProblem()
      .testRequests([{
        method: 'POST',
        url: '/v1/projects/1/datasets/%C3%A1/entities',
        data: {
          source: { name: 'my_data.csv', size: 13 },
          entities: [{ label: 'dogwood' }]
        }
      }]);
  });

  it('implements some standard button things', () => {
    testData.extendedDatasets.createPast(1);
    return showModal()
      .afterResponses(selectFile)
      .testStandardButton({
        button: '.modal-actions .btn-primary',
        disabled: ['.modal-actions .btn-link'],
        modal: true,
        spinner: false
      });
  });

  it('shows a backdrop during the request', () => {
    testData.extendedDatasets.createPast(1);
    return showModal()
      .afterResponses(modal => {
        modal.find('.backdrop').exists().should.be.false;
      })
      .request(async (modal) => {
        await selectFile(modal);
        return modal.get('.modal-actions .btn-primary').trigger('click');
      })
      .beforeAnyResponse(modal => {
        modal.find('.backdrop').exists().should.be.true;
      })
      .respondWithProblem()
      .afterResponse(modal => {
        modal.find('.backdrop').exists().should.be.false;
      });
  });

  describe('after a successful upload', () => {
    const upload = (query = '') => {
      mockLogin();
      testData.extendedDatasets.createPast(1);
      return load(`/projects/1/entity-lists/trees/entities${query}`)
        .complete()
        .request(async (component) => {
          await component.get('#dataset-entities-upload-button').trigger('click');
          const modal = component.getComponent(EntityUpload);
          await selectFile(modal);
          return modal.get('.modal-actions .btn-primary').trigger('click');
        })
        .respondWithSuccess()
        .respondIf(T, ({ url }) => {
          testData.extendedEntities.createPast(1);
          return url.includes('.svc')
            ? testData.entityOData()
            : testData.entityGeojson();
        });
    };

    it('hides the modal', async () => {
      const component = await upload();
      component.getComponent(EntityUpload).props().state.should.be.false;
    });

    it('shows a success alert', async () => {
      const component = await upload();
      component.should.alert('success', 'Your Entities have been successfully uploaded.');
    });

    it('sends a new request for OData', () =>
      upload().testRequests([
        null,
        {
          url: ({ pathname, searchParams }) => {
            pathname.should.be.eql('/v1/projects/1/datasets/trees.svc/Entities');
            searchParams.get('$filter').should.match(/__system\/createdAt le \S+ and \(__system\/deletedAt eq null or __system\/deletedAt gt \S+\)/);
            searchParams.get('$top').should.be.eql('250');
            searchParams.get('$count').should.be.eql('true');
          }
        }
      ]));

    it('sends a new request for GeoJSON', () =>
      upload('?map=true').testRequests([
        null,
        { url: '/v1/projects/1/datasets/trees/entities.geojson' }
      ]));

    it('renders correctly during the request', () =>
      upload().beforeEachResponse((component, _, i) => {
        if (i === 0) return;
        component.get('#entity-table').should.be.hidden();
        const props = component.getComponent(OdataLoadingMessage).props();
        props.state.should.be.true;
        props.totalCount.should.equal(1);
      }));

    it('resets the filter', () =>
      upload('?conflict=true').beforeEachResponse((app, { url }, i) => {
        if (i === 0) return;
        // There should be only snapshot $filter query parameter.
        const { pathname, searchParams } = relativeUrl(url);
        pathname.should.be.eql('/v1/projects/1/datasets/trees.svc/Entities');
        searchParams.get('$filter').should.match(/__system\/createdAt le \S+ and \(__system\/deletedAt eq null or __system\/deletedAt gt \S+\)/);
        searchParams.get('$top').should.be.eql('250');
        searchParams.get('$count').should.be.eql('true');

        app.getComponent(OdataLoadingMessage).props().filter.should.be.false;
        const filters = app.getComponent(EntityFilters).props();
        filters.conflict.should.eql([true, false]);
      }));

    it('resets the search', () =>
      upload('?search=john').beforeEachResponse((app, { url }, i) => {
        if (i === 0) return;
        // There should be only snapshot $filter query parameter.
        const { pathname, searchParams } = relativeUrl(url);
        pathname.should.be.eql('/v1/projects/1/datasets/trees.svc/Entities');
        searchParams.get('$filter').should.match(/__system\/createdAt le \S+ and \(__system\/deletedAt eq null or __system\/deletedAt gt \S+\)/);
        searchParams.get('$top').should.be.eql('250');
        searchParams.get('$count').should.be.eql('true');
        expect(searchParams.get('$search')).to.be.null;

        app.getComponent(OdataLoadingMessage).props().filter.should.be.false;
      }));
  });
});
