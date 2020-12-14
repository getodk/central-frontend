import sinon from 'sinon';

import SubmissionFieldDropdown from '../../../src/components/submission/field-dropdown.vue';
import SubmissionList from '../../../src/components/submission/list.vue';
import SubmissionTable from '../../../src/components/submission/table.vue';

import Field from '../../../src/presenters/field';
import Form from '../../../src/presenters/form';
import store from '../../../src/store';

import testData from '../../data';
import { mockHttp } from '../../util/http';
import { mount } from '../../util/lifecycle';
import { trigger } from '../../util/event';

const { repeat, group, string } = testData.fields;
const strings = (min, max) => {
  const result = new Array(max - min + 1);
  for (let i = 0; i < result.length; i += 1)
    result[i] = string(`/s${min + i}`);
  return result;
};

const present = (field) => new Field(field);

const commitFields = (fields) => {
  store.commit('setData', {
    key: 'fields',
    value: fields[0] instanceof Field ? fields : fields.map(present)
  });
};

const loadSubmissionList = (attachToDocument = false) => {
  const form = testData.extendedForms.last();
  return mockHttp()
    .mount(SubmissionList, {
      propsData: {
        baseUrl: '/v1/projects/1/forms/f',
        formVersion: new Form(form)
      },
      requestData: { keys: [] },
      attachToDocument
    })
    .respondWithData(() => form._fields)
    .respondWithData(testData.submissionOData);
};

describe('SubmissionFieldDropdown', () => {
  it('renders a checkbox for each selectable field', () => {
    commitFields([repeat('/r'), string('/r/s1'), string('/s2'), string('/s3')]);
    const dropdown = mount(SubmissionFieldDropdown, {
      propsData: { value: [] }
    });
    const labels = dropdown.find('.checkbox span');
    labels.length.should.equal(2);
    labels[0].text().should.equal('s2');
    labels[1].text().should.equal('s3');
  });

  it('adds a title attribute for checkbox that includes group name', () => {
    commitFields([group('/g'), string('/g/s1')]);
    const dropdown = mount(SubmissionFieldDropdown, {
      propsData: { value: [] }
    });
    const span = dropdown.first('.checkbox span');
    span.text().should.equal('s1');
    span.getAttribute('title').should.equal('g-s1');
  });

  describe('checked boxes', () => {
    it('checks boxes based on the value prop', () => {
      const fields = strings(1, 2).map(present);
      commitFields(fields);
      const dropdown = mount(SubmissionFieldDropdown, {
        propsData: { value: [fields[0]] }
      });
      const checkboxes = dropdown.find('input[type="checkbox"]');
      checkboxes[0].element.checked.should.be.true();
      checkboxes[1].element.checked.should.be.false();
    });

    it('updates the checkboxes after the value prop changes', async () => {
      const fields = strings(1, 2).map(present);
      commitFields(fields);
      const dropdown = mount(SubmissionFieldDropdown, {
        propsData: { value: [fields[0]] }
      });
      const checkboxes = dropdown.find('input[type="checkbox"]');
      checkboxes[0].element.checked.should.be.true();
      checkboxes[1].element.checked.should.be.false();
      dropdown.setProps({ value: [fields[1]] });
      await dropdown.vm.$nextTick();
      checkboxes[0].element.checked.should.be.false();
      checkboxes[1].element.checked.should.be.true();
    });
  });

  describe('after the dropdown is hidden', () => {
    it('emits an input event if the selection has changed', async () => {
      commitFields([string('/s1')]);
      const dropdown = mount(SubmissionFieldDropdown, {
        propsData: { value: [] },
        attachToDocument: true
      });
      const $emit = sinon.fake();
      sinon.replace(dropdown.vm, '$emit', $emit);
      await trigger.click(dropdown, 'select');
      await trigger.check(dropdown, 'input[type="checkbox"]');
      await trigger.click(dropdown, 'select');
      $emit.calledWith('input').should.be.true();
      const value = $emit.getCall(0).args[1];
      value.length.should.equal(1);
      value[0].path.should.equal('/s1');
    });

    it('does not emit an input event if selection has not changed', async () => {
      commitFields([string('/s1')]);
      const dropdown = mount(SubmissionFieldDropdown, {
        propsData: { value: [] },
        attachToDocument: true
      });
      const $emit = sinon.fake();
      sinon.replace(dropdown.vm, '$emit', $emit);
      await trigger.click(dropdown, 'select');
      await trigger.check(dropdown, 'input[type="checkbox"]');
      await trigger.uncheck(dropdown, 'input[type="checkbox"]');
      await trigger.click(dropdown, 'select');
      $emit.called.should.be.false();
    });
  });

  it('disables an unchecked box after 100 fields have been selected', () => {
    const fields = strings(1, 101).map(present);
    commitFields(fields);
    const dropdown = mount(SubmissionFieldDropdown, {
      propsData: { value: fields.slice(0, 100) }
    });
    const disabled = dropdown.find('.checkbox.disabled');
    disabled.length.should.equal(1);
    const span = disabled[0].first('span');
    span.text().should.equal('s101');
    disabled[0].first('input').hasAttribute('disabled').should.be.true();
    const label = disabled[0].first('label');
    label.getAttribute('title').should.equal('Cannot select more than 100 columns.');
    span.hasAttribute('title').should.be.false();
  });

  describe('placeholder', () => {
    it('shows the number of selectable fields', () => {
      commitFields([repeat('/r'), string('/r/s1'), string('/s2')]);
      const dropdown = mount(SubmissionFieldDropdown, {
        propsData: { value: [] }
      });
      dropdown.first('option').text().should.endWith(' of 1');
    });

    it('shows the number of selected fields', () => {
      const fields = strings(1, 2).map(present);
      commitFields(fields);
      const dropdown = mount(SubmissionFieldDropdown, {
        propsData: { value: [fields[0]] }
      });
      dropdown.first('option').text().should.equal('1 of 2');
    });

    it('does not update after a checkbox is checked', async () => {
      commitFields([string('/s1')]);
      const dropdown = mount(SubmissionFieldDropdown, {
        propsData: { value: [] }
      });
      await trigger.check(dropdown, 'input[type="checkbox"]');
      dropdown.first('option').text().should.equal('0 of 1');
    });

    it('updates after the value prop changes', async () => {
      const fields = [new Field(string('/s1'))];
      commitFields(fields);
      const dropdown = mount(SubmissionFieldDropdown, {
        propsData: { value: [] }
      });
      dropdown.setProps({ value: fields });
      await dropdown.vm.$nextTick();
      dropdown.first('option').text().should.equal('1 of 1');
    });
  });

  describe('search', () => {
    it('adds a class for a field the matches the search', async () => {
      commitFields(strings(1, 2));
      const dropdown = mount(SubmissionFieldDropdown, {
        propsData: { value: [] }
      });
      dropdown.find('.search-match').length.should.equal(2);
      await trigger.input(dropdown, '.search input', '1');
      const matches = dropdown.find('.search-match');
      matches.length.should.equal(1);
      matches[0].first('span').text().should.equal('s1');
    });

    it('searches the group name', async () => {
      commitFields([group('/g'), string('/g/s1'), string('/s2')]);
      const dropdown = mount(SubmissionFieldDropdown, {
        propsData: { value: [] }
      });
      await trigger.input(dropdown, '.search input', 'g');
      const matches = dropdown.find('.search-match');
      matches.length.should.equal(1);
      matches[0].first('span').text().should.equal('s1');
    });

    it('shows a message if there are no matches', async () => {
      commitFields([string('/s1')]);
      const dropdown = mount(SubmissionFieldDropdown, {
        propsData: { value: [] },
        attachToDocument: true
      });
      await trigger.click(dropdown, 'select');
      const li = dropdown.find('.dropdown-menu ul li');
      li.length.should.equal(2);
      li[0].should.be.visible(true);
      li[1].should.be.hidden(true);
      await trigger.input(dropdown, '.search input', 'foo');
      li[0].should.be.hidden(true);
      li[1].should.be.visible(true);
    });

    it('resets after the dropdown is hidden', async () => {
      commitFields([string('/s1')]);
      const dropdown = mount(SubmissionFieldDropdown, {
        propsData: { value: [] },
        attachToDocument: true
      });
      await trigger.click(dropdown, 'select');
      await trigger.input(dropdown, '.search input', '1');
      await trigger.click(dropdown, 'select');
      dropdown.first('.search input').element.value.should.equal('');
    });

    describe('.close button', async () => {
      it('shows the button after input', async () => {
        commitFields([string('/s1')]);
        const dropdown = mount(SubmissionFieldDropdown, {
          propsData: { value: [] }
        });
        const button = dropdown.first('.close');
        button.should.be.hidden();
        await trigger.input(dropdown, '.search input', '1');
        button.should.be.visible();
      });

      describe('after the button is clicked', () => {
        it('resets the search', async () => {
          commitFields([string('/s1')]);
          const dropdown = mount(SubmissionFieldDropdown, {
            propsData: { value: [] }
          });
          await trigger.input(dropdown, '.search input', '1');
          await trigger.click(dropdown, '.close');
          dropdown.first('.search input').element.value.should.equal('');
        });

        it('focuses the input', async () => {
          commitFields([string('/s1')]);
          const dropdown = mount(SubmissionFieldDropdown, {
            propsData: { value: [] },
            attachToDocument: true
          });
          await trigger.click(dropdown, 'select');
          await trigger.input(dropdown, '.search input', '1');
          await trigger.click(dropdown, '.close');
          dropdown.first('.search input').should.be.focused();
        });
      });
    });
  });

  describe('select all', () => {
    it('checks all checkboxes', async () => {
      commitFields(strings(1, 2));
      const dropdown = mount(SubmissionFieldDropdown, {
        propsData: { value: [] }
      });
      await trigger.click(dropdown, '.toggle-all a');
      for (const checkbox of dropdown.find('input[type="checkbox"]'))
        checkbox.element.checked.should.be.true();
    });

    it('only checks search results', async () => {
      commitFields(strings(1, 2));
      const dropdown = mount(SubmissionFieldDropdown, {
        propsData: { value: [] }
      });
      await trigger.input(dropdown, '.search input', '1');
      await trigger.click(dropdown, '.toggle-all a');
      const checkboxes = dropdown.find('input[type="checkbox"]');
      checkboxes[0].element.checked.should.be.true();
      checkboxes[1].element.checked.should.be.false();
    });

    it('disables an unchecked box if 100 checkboxes become checked', async () => {
      commitFields([...strings(1, 100), string('/x')]);
      const dropdown = mount(SubmissionFieldDropdown, {
        propsData: { value: [] }
      });
      await trigger.input(dropdown, '.search input', 's');
      await trigger.click(dropdown, '.toggle-all a');
      dropdown.find('.checkbox')[100].hasClass('disabled').should.be.true();
    });

    it('is disabled if 100 checkboxes are checked', () => {
      const fields = strings(1, 101).map(present);
      commitFields(fields);
      const dropdown = mount(SubmissionFieldDropdown, {
        propsData: { value: fields.slice(0, 100) },
        requestData: { fields }
      });
      dropdown.first('.toggle-all a').hasClass('disabled').should.be.true();
    });

    it('is disabled if selecting all would check more than 100 checkboxes', async () => {
      const fields = strings(1, 101).map(present);
      commitFields(fields);
      const dropdown = mount(SubmissionFieldDropdown, {
        propsData: { value: fields.slice(0, 99) }
      });
      const checkboxes = dropdown.find('input[type="checkbox"]');
      await trigger.uncheck(checkboxes[9]);
      await trigger.check(checkboxes[100]);
      await trigger.input(dropdown, '.search input', '10');
      dropdown.first('.toggle-all a').hasClass('disabled').should.be.true();
    });
  });

  describe('select none', () => {
    it('unchecks all checkboxes', async () => {
      const fields = strings(1, 2).map(present);
      commitFields(fields);
      const dropdown = mount(SubmissionFieldDropdown, {
        propsData: { value: fields }
      });
      await trigger.click(dropdown.find('.toggle-all a')[1]);
      for (const checkbox of dropdown.find('input[type="checkbox"]'))
        checkbox.element.checked.should.be.false();
    });

    it('only unchecks search results', async () => {
      const fields = strings(1, 2).map(present);
      commitFields(fields);
      const dropdown = mount(SubmissionFieldDropdown, {
        propsData: { value: fields }
      });
      await trigger.input(dropdown, '.search input', '1');
      await trigger.click(dropdown.find('.toggle-all a')[1]);
      const checkboxes = dropdown.find('input[type="checkbox"]');
      checkboxes[0].element.checked.should.be.false();
      checkboxes[1].element.checked.should.be.true();
    });

    it('re-enables a disabled checkbox', async () => {
      const fields = strings(1, 101).map(present);
      commitFields(fields);
      const dropdown = mount(SubmissionFieldDropdown, {
        propsData: { value: fields.slice(0, 100) }
      });
      const last = dropdown.find('.checkbox')[100];
      last.hasClass('disabled').should.be.true();
      await trigger.click(dropdown.find('.toggle-all a')[1]);
      last.hasClass('disabled').should.be.false();
    });
  });

  it('is not rendered if there are 11 selectable fields', async () => {
    testData.extendedForms.createPast(1, {
      fields: [...strings(1, 11), repeat('/r'), string('/r/s12')],
      submissions: 1
    });
    testData.extendedSubmissions.createPast(1);
    const component = await loadSubmissionList();
    component.find(SubmissionFieldDropdown).length.should.equal(0);
    component.first(SubmissionTable).getProp('fields').length.should.equal(11);
  });

  it('initially selects first 10 if there are 12 selectable fields', async () => {
    testData.extendedForms.createPast(1, {
      fields: [repeat('/r'), string('/r/s1'), ...strings(2, 13)],
      submissions: 1
    });
    testData.extendedSubmissions.createPast(1);
    const component = await loadSubmissionList();
    const selected = component.first(SubmissionFieldDropdown).getProp('value');
    selected.map(field => field.path).should.eql([
      '/s2', '/s3', '/s4', '/s5', '/s6',
      '/s7', '/s8', '/s9', '/s10', '/s11'
    ]);
    component.first(SubmissionTable).getProp('fields').should.equal(selected);
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
      const dropdown = component.first(SubmissionFieldDropdown);
      await trigger.click(dropdown, 'select');
      await trigger.uncheck(dropdown, 'input[type="checkbox"]');
      await trigger.click(dropdown, 'select');
    };

    it('sends a request for submissions', () =>
      loadSubmissionList(true)
        .complete()
        .request(uncheckFirst)
        .beforeEachResponse((_, { url }) => {
          url.should.containEql('.svc/Submissions');
        })
        .respondWithData(testData.submissionOData));

    it('re-renders the table with the selected fields', () =>
      loadSubmissionList(true)
        .complete()
        .request(uncheckFirst)
        .beforeEachResponse(component => {
          component.find(SubmissionTable).length.should.equal(0);
        })
        .respondWithData(testData.submissionOData)
        .afterResponse(component => {
          const table = component.first(SubmissionTable);
          table.getProp('fields').length.should.equal(9);
        }));
  });
});
