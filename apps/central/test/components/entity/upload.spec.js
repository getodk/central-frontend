import { DateTime } from 'luxon';
import { T } from 'ramda';

import EntityFilters from '../../../src/components/entity/filters.vue';
import EntityUpload from '../../../src/components/entity/upload.vue';
import EntityUploadErrors from '../../../src/components/entity/upload/errors.vue';
import EntityUploadExtraProperties from '../../../src/components/entity/upload/extra-properties.vue';
import EntityUploadFileSelect from '../../../src/components/entity/upload/file-select.vue';
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
  await setFiles(modal.get('input[type="file"]'), [file]);
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

    it('shows an error if there are duplicate column headers', async () => {
      const modal = await showModal();
      const csv = createCSV('label,label,height,height,height\ndogwood,dogwood,1,1,1');
      await selectFile(modal, csv);
      const errors = modal.getComponent(EntityUploadErrors).props();
      errors.duplicateColumns.should.eql(['label', 'height']);
    });

    it('shows multiple errors', async () => {
      const modal = await showModal();
      await selectFile(modal, createCSV('foo,,foo\n1,2,3'));
      const errors = modal.getComponent(EntityUploadErrors).props();
      errors.should.include({
        delimiter: ',',
        count: 3,
        invalidQuotes: false,
        missingLabel: true,
        emptyColumn: true
      });
      errors.duplicateColumns.should.eql(['foo']);
    });

    it('uses the delimiter from the file', async () => {
      const modal = await showModal();
      const csv = createCSV('height;circumference\n1;2');
      await selectFile(modal, csv);
      modal.getComponent(EntityUploadErrors).props().delimiter.should.equal(';');
    });
  });

  it('shows an error with the data below the header', async () => {
    testData.extendedDatasets.createPast(1, {
      properties: [{ name: 'height' }]
    });
    const modal = await showModal();
    await selectFile(modal, createCSV('label,height\n,1'));
    const errors = modal.getComponent(EntityUploadErrors).props();
    errors.dataError.should.equal('There is a problem on row 2 of the file: Missing label.');
    errors.count.should.equal(1);
  });

  describe('binary file', () => {
    beforeEach(() => {
      testData.extendedDatasets.createPast(1);
    });

    it('shows an alert for a null character in the header', async () => {
      const modal = await showModal();
      await selectFile(modal, createCSV('f\0o'));
      modal.should.alert('danger', 'The file “my_data.csv” is not a valid .csv file. It cannot be read.');
      modal.findComponent(EntityUploadErrors).exists().should.be.false;
    });

    it('hides the alert after a valid file is selected', async () => {
      const modal = await showModal();
      await selectFile(modal, createCSV('f\0o'));
      await selectFile(modal);
      modal.should.not.alert();
      const button = modal.get('.modal-actions .btn-primary');
      button.attributes('aria-disabled').should.equal('false');
    });

    // This is not necessarily the ideal behavior. Showing an alert would be
    // more consistent with what happens for a null character in the header.
    // This test documents the current expected behavior.
    it('renders EntityUploadErrors for a null character after header', async () => {
      const modal = await showModal();
      await selectFile(modal, createCSV('label\nf\0o'));
      const { dataError } = modal.getComponent(EntityUploadErrors).props();
      dataError.should.equal('The file “my_data.csv” is not a valid .csv file. It cannot be read.');
      modal.should.not.alert();
    });
  });

  describe('warnings', () => {
    beforeEach(() => {
      testData.extendedDatasets.createPast(1, {
        properties: [{ name: 'height' }]
      });
    });

    it('shows warnings about the data below the header', async () => {
      const modal = await showModal();
      const csv = createCSV('label,height\nx\ny\n"12345,67890",""');
      await selectFile(modal, csv);
      const warnings = modal.getComponent(EntityUploadWarnings).props();
      warnings.count.should.equal(2);
      warnings.raggedRows.should.eql([[1, 2]]);
      warnings.largeCell.should.equal(3);
    });

    it('shows warnings about both the header and the data', async () => {
      const modal = await showModal();
      const csv = createCSV('label,__id,height\ndogwood,e1\nelm,e2,""');
      await selectFile(modal, csv);
      const warnings = modal.getComponent(EntityUploadWarnings).props();
      warnings.count.should.equal(2);
      warnings.systemProperties.should.eql(['__id']);
      warnings.raggedRows.should.eql([[1, 1]]);
    });

    it('shows both errors and warnings about the header', async () => {
      const modal = await showModal();
      await selectFile(modal, createCSV('height,__id\n1,e'));
      const errors = modal.getComponent(EntityUploadErrors).props();
      errors.missingLabel.should.be.true;
      const warnings = modal.getComponent(EntityUploadWarnings).props();
      warnings.systemProperties.should.eql(['__id']);
    });

    it('does not show data warnings if there is a data error', async () => {
      testData.extendedDatasets.createPast(1, {
        properties: [{ name: 'height' }, { name: 'circumference' }]
      });
      const modal = await showModal();

      // First, select a CSV that triggers warnings about both the column header
      // and the data, but does not trigger errors.
      const warningsCSV = 'label,height\nx\ny,""';
      await selectFile(modal, createCSV(warningsCSV));
      modal.findComponent(EntityUploadErrors).exists().should.be.false;
      const initialWarnings = modal.getComponent(EntityUploadWarnings).props();
      initialWarnings.count.should.equal(2);
      initialWarnings.missingProperties.should.eql(['circumference']);
      initialWarnings.raggedRows.should.eql([[1, 1]]);

      // Next, select a similar CSV that also has an error in the data (a
      // missing label).
      await selectFile(modal, createCSV(`${warningsCSV}\n"",1`));

      // This time, we see an error.
      const { dataError } = modal.getComponent(EntityUploadErrors).props();
      dataError.should.startWith('There is a problem on row 4');

      // There's a warning about the column header, but no warning about the
      // data.
      const warnings = modal.getComponent(EntityUploadWarnings).props();
      warnings.count.should.equal(1);
      warnings.missingProperties.should.eql(['circumference']);
      should.not.exist(warnings.raggedRows);
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
      const a = modal.get('.entity-upload-alert a');
      a.text().should.equal('9–11');
      await a.trigger('click');
      table.props().rowIndex.should.equal(5);
      table.props().highlighted.should.eql([8, 10]);
    });

    it('does not highlight rows after a new file is selected', async () => {
      const modal = await showModal();
      const csvString = 'label,height\nx\ny\nz,""';
      await selectFile(modal, createCSV(csvString));
      const a = modal.get('.entity-upload-alert a');
      a.text().should.equal('1–2');
      await a.trigger('click');
      getTables(modal)[1].props().highlighted.should.eql([0, 1]);
      await selectFile(modal, createCSV(csvString));
      should.not.exist(getTables(modal)[1].props().highlighted);
    });
  });

  it('resets errors and warnings after a new file is selected', async () => {
    testData.extendedDatasets.createPast(1, {
      properties: [{ name: 'height' }]
    });
    const modal = await showModal();
    const button = modal.get('.modal-actions .btn-primary');

    const problemCSV = createCSV('label,label\ndogwood,dogwood');
    await selectFile(modal, problemCSV);
    modal.findComponent(EntityUploadErrors).exists().should.be.true;
    modal.findComponent(EntityUploadWarnings).exists().should.be.true;
    button.attributes('aria-disabled').should.equal('true');

    await selectFile(modal, createCSV('label,height\ndogwood,1'));
    modal.findComponent(EntityUploadErrors).exists().should.be.false;
    modal.findComponent(EntityUploadWarnings).exists().should.be.false;
    button.attributes('aria-disabled').should.equal('false');

    await selectFile(modal, problemCSV);
    button.attributes('aria-disabled').should.equal('true');
  });

  it('resets after the modal is hidden', async () => {
    testData.extendedDatasets.createPast(1, {
      properties: [{ name: 'height' }]
    });
    const modal = await showModal();
    await selectFile(modal, createCSV('label\nx\n"12345,67890"'));
    const button = modal.get('.modal-actions .btn-primary');

    modal.findComponent(EntityUploadWarnings).exists().should.be.true;
    button.attributes('aria-disabled').should.equal('false');

    await modal.setProps({ state: false });
    await modal.setProps({ state: true });

    modal.findComponent(EntityUploadWarnings).exists().should.be.false;
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

  it('renders correctly during the request', () => {
    testData.extendedDatasets.createPast(1);
    return showModal()
      .afterResponses(modal => {
        modal.getComponent(EntityUploadFileSelect).props().disabled.should.be.false;
        modal.find('.backdrop').exists().should.be.false;
        modal.findComponent(EntityUploadPopup).exists().should.be.false;
      })
      .request(async (modal) => {
        await selectFile(modal);
        return modal.get('.modal-actions .btn-primary').trigger('click');
      })
      .beforeAnyResponse(modal => {
        modal.getComponent(EntityUploadFileSelect).props().disabled.should.be.true;
        modal.find('.backdrop').exists().should.be.true;

        const popup = modal.getComponent(EntityUploadPopup);
        popup.props().filename.should.equal('my_data.csv');
        popup.props().count.should.equal(1);
      })
      .respondWithProblem()
      .afterResponse(modal => {
        modal.getComponent(EntityUploadFileSelect).props().disabled.should.be.false;
        modal.find('.backdrop').exists().should.be.false;
        modal.findComponent(EntityUploadPopup).exists().should.be.false;
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
            expect(searchParams.get('$filter')).to.be.null;
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
        const { pathname, searchParams } = relativeUrl(url);
        pathname.should.be.eql('/v1/projects/1/datasets/trees.svc/Entities');
        expect(searchParams.get('$filter')).to.be.null;
        searchParams.get('$top').should.be.eql('250');
        searchParams.get('$count').should.be.eql('true');

        app.getComponent(OdataLoadingMessage).props().filter.should.be.false;
        const filters = app.getComponent(EntityFilters).props();
        filters.conflict.should.eql([true, false]);
      }));

    it('resets the search', () =>
      upload('?search=john').beforeEachResponse((app, { url }, i) => {
        if (i === 0) return;
        const { pathname, searchParams } = relativeUrl(url);
        pathname.should.be.eql('/v1/projects/1/datasets/trees.svc/Entities');
        expect(searchParams.get('$filter')).to.be.null;
        searchParams.get('$top').should.be.eql('250');
        searchParams.get('$count').should.be.eql('true');
        expect(searchParams.get('$search')).to.be.null;

        app.getComponent(OdataLoadingMessage).props().filter.should.be.false;
      }));
  });

  it('allows upload despite missing properties', () => {
    testData.extendedDatasets.createPast(1, {
      properties: [{ name: 'height' }, { name: 'circumference' }]
    });
    return showModal()
      .complete()
      .request(async (modal) => {
        await selectFile(modal, createCSV('label,height\ndogwood,1'));

        // A warning is shown.
        const warnings = modal.getComponent(EntityUploadWarnings).props();
        warnings.missingProperties.should.eql(['circumference']);

        return modal.get('.modal-actions .btn-primary').trigger('click');
      })
      .respondWithProblem()
      .testRequests([{
        method: 'POST',
        url: '/v1/projects/1/datasets/trees/entities',
        data: {
          source: { name: 'my_data.csv', size: 22 },
          entities: [{ label: 'dogwood', data: { height: '1' } }]
        }
      }]);
  });

  it('ignores system properties', () => {
    testData.extendedDatasets.createPast(1, {
      properties: [{ name: 'height' }]
    });
    return showModal()
      .complete()
      .request(async (modal) => {
        await selectFile(
          modal,
          createCSV('label,height,__id,__foo,name\ndogwood,1,e1,x,dogwood\nelm,,e2,y,elm')
        );

        // A warning is shown.
        const warnings = modal.getComponent(EntityUploadWarnings).props();
        warnings.systemProperties.should.eql(['__id', '__foo', 'name']);

        return modal.get('.modal-actions .btn-primary').trigger('click');
      })
      .respondWithProblem()
      .testRequests([{
        method: 'POST',
        url: '/v1/projects/1/datasets/trees/entities',
        data: {
          source: { name: 'my_data.csv', size: 65 },
          entities: [
            { label: 'dogwood', data: { height: '1' } },
            // If there were only system properties, no proper entity
            // properties, don't bother sending an empty `data` object.
            { label: 'elm' }
          ]
        }
      }]);
  });

  it('ignores columns that are not valid property names', () => {
    testData.extendedDatasets.createPast(1, {
      name: 'people',
      properties: [{ name: 'height' }]
    });
    return showModal()
      .complete()
      .request(async (modal) => {
        await selectFile(
          modal,
          createCSV('label,height,LABEL,First name,phone#\nAlice,123,Alice,Alice,456\nChelsea,,Chelsea,Chelsea,789')
        );

        // A warning is shown.
        const warnings = modal.getComponent(EntityUploadWarnings).props();
        warnings.invalidProperties.should.eql(['LABEL', 'First name', 'phone#']);

        return modal.get('.modal-actions .btn-primary').trigger('click');
      })
      .respondWithProblem()
      .testRequests([{
        method: 'POST',
        url: '/v1/projects/1/datasets/people/entities',
        data: {
          source: { name: 'my_data.csv', size: 91 },
          entities: [
            { label: 'Alice', data: { height: '123' } },
            // There were no valid entity properties, so don't bother sending an
            // empty `data` object.
            { label: 'Chelsea' }
          ]
        }
      }]);
  });

  it('ignores columns that only differ from properties on letter case', () => {
    testData.extendedDatasets.createPast(1, {
      properties: [{ name: 'height' }, { name: 'circumference' }, { name: 'species' }]
    });
    return showModal()
      .complete()
      .request(async (modal) => {
        await selectFile(
          modal,
          createCSV('label,height,CIRCUMFERENCE,Species\ndogwood,1,2,dogwood\nelm,,3,elm')
        );

        // A warning is shown.
        const warnings = modal.getComponent(EntityUploadWarnings).props();
        warnings.caseMismatch.should.eql([
          { column: 'CIRCUMFERENCE', property: 'circumference' },
          { column: 'Species', property: 'species' }
        ]);

        return modal.get('.modal-actions .btn-primary').trigger('click');
      })
      .respondWithProblem()
      .testRequests([{
        method: 'POST',
        url: '/v1/projects/1/datasets/trees/entities',
        data: {
          source: { name: 'my_data.csv', size: 65 },
          entities: [
            { label: 'dogwood', data: { height: '1' } },
            { label: 'elm' }
          ]
        }
      }]);
  });

  describe('extra properties', () => {
    beforeEach(() => {
      testData.extendedDatasets.createPast(1, {
        properties: [{ name: 'height' }]
      });
    });

    const extraCSV = createCSV('label,height,circumference,species\ndogwood,1,2,dogwood\nelm');
    const toggleExtra = (modal, name, checked = true) => {
      const input = modal.get(`#entity-upload-extra-properties input[value="${name}"]`);
      input.element.checked.should.equal(!checked);
      return input.setChecked(checked);
    };

    it('shows a warning if there are extra properties', async () => {
      const modal = await showModal();
      await selectFile(modal, extraCSV);
      const warnings = modal.getComponent(EntityUploadWarnings).props();
      warnings.extraProperties.should.eql(['circumference', 'species']);
      const extraComponent = modal.getComponent(EntityUploadExtraProperties);
      expect(extraComponent.props().properties).to.eql(['circumference', 'species']);
    });

    it('shows selected properties in the table', async () => {
      const modal = await showModal();
      await selectFile(modal, extraCSV);

      const tables = modal.findAllComponents(EntityUploadTable);
      tables.length.should.equal(2);
      const table = tables[1];
      table.props().extraProperties.should.eql([]);

      const input = modal.get('#entity-upload-extra-properties .checkbox:nth-child(2) input');
      await input.setChecked();
      table.props().extraProperties.should.eql(['circumference']);

      await input.setChecked(false);
      table.props().extraProperties.should.eql([]);
    });

    it('remembers the property selection until the modal is hidden', async () => {
      const modal = await showModal();
      const getSelected = () => {
        const { selected } = modal.getComponent(EntityUploadExtraProperties).props();
        return [...selected];
      };
      const getChecked = () => {
        const checked = modal.findAll('#entity-upload-extra-properties .checkbox:has(input:checked)');
        return checked.map(div => div.text());
      };
      const getTableExtra = () => {
        const tables = modal.findAllComponents(EntityUploadTable);
        tables.length.should.equal(2);
        return tables[1].props().extraProperties ?? [];
      };

      await selectFile(modal, extraCSV);
      await toggleExtra(modal, 'circumference');

      // Select a .csv file with a `circumference` property like extraCSV, but
      // without `species`.
      await selectFile(modal, createCSV('label,circumference\ndogwood,1'));
      // The selection of `circumference` should be remembered.
      getSelected().should.eql(['circumference']);
      getChecked().should.eql(['circumference']);
      getTableExtra().should.eql(['circumference']);

      // A .csv file without `circumference` or `species`, but instead two other
      // extra properties: `foo` and `bar`.
      const foobarCSV = createCSV('label,height,foo,bar\ndogwood,1,x,y');
      await selectFile(modal, foobarCSV);
      // Under the hood, the selection of `circumference` should still be
      // remembered.
      getSelected().should.eql(['circumference']);
      // However, the selection is not visible in the UI.
      getChecked().should.eql([]);
      getTableExtra().should.eql([]);
      await toggleExtra(modal, 'foo');

      // Select extraCSV again. We should see that the selection of
      // `circumference` has been remembered. The selection of `foo` should be
      // remembered under the hood.
      await selectFile(modal, extraCSV);
      getSelected().should.eql(['circumference', 'foo']);
      getChecked().should.eql(['circumference']);
      getTableExtra().should.eql(['circumference']);

      // Select foobarCSV again. We should see that the selection of `foo` has
      // been remembered.
      await selectFile(modal, foobarCSV);
      getSelected().should.eql(['circumference', 'foo']);
      getChecked().should.eql(['foo']);
      getTableExtra().should.eql(['foo']);
      await toggleExtra(modal, 'foo', false);

      // Select foobarCSV again (after temporarily swapping it out). We should
      // see that the deselection of `foo` has been remembered.
      await selectFile(modal, extraCSV);
      await selectFile(modal, foobarCSV);
      // Under the hood, the selection of `circumference` should still be
      // remembered.
      getSelected().should.eql(['circumference']);
      getChecked().should.eql([]);
      getTableExtra().should.eql([]);

      // Hide the modal.
      await modal.setProps({ state: false });
      await modal.setProps({ state: true });

      await selectFile(modal, extraCSV);
      // The selection of `circumference` should no longer be remembered.
      getSelected().should.eql([]);
      getChecked().should.eql([]);
      getTableExtra().should.eql([]);
    });

    it('does not send properties that were not selected', () =>
      showModal()
        .complete()
        .request(async (modal) => {
          await selectFile(modal, extraCSV);
          return modal.get('.modal-actions .btn-primary').trigger('click');
        })
        .respondWithProblem()
        .testRequests([{
          method: 'POST',
          url: '/v1/projects/1/datasets/trees/entities',
          data: {
            source: { name: 'my_data.csv', size: 58 },
            entities: [
              { label: 'dogwood', data: { height: '1' } },
              // Don't bother sending an empty `data` object.
              { label: 'elm' }
            ]
          }
        }]));

    it('does not create properties that were selected, but are not in current CSV');
  });
});
