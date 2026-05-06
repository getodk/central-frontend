import sinon from 'sinon';
import { markRaw } from 'vue';

import DatasetLink from '../../src/components/dataset/link.vue';
import EntityLink from '../../src/components/entity/link.vue';
import SubmissionLink from '../../src/components/submission/link.vue';
import Popover from '../../src/components/popover.vue';

import TestUtilHoverCards from '../util/components/hover-cards.vue';

import testData from '../data';
import { mockHttp } from '../util/http';
import { mockRouter } from '../util/router';

const mountOptions = (anchorComponent, anchorProps = undefined) => ({
  props: { anchorComponent: markRaw(anchorComponent), anchorProps },
  container: { router: mockRouter('/') },
  attachTo: document.body
});
const getAnchor = (component) =>
  component.get('#anchor-container > :first-child');
const getSubtitle = () => {
  const subtitle = document.querySelector('.popover .hover-card-subtitle');
  if (subtitle == null) throw new Error('subtitle not found');
  return subtitle.textContent;
};
const hover = (clock) => async (component) => {
  await getAnchor(component).trigger('mouseenter');
  clock.tick(350);
};

// These tests test both the HoverCards component and the useHoverCard()
// composable.
describe('HoverCards', () => {
  it('shows a hover card of type submission', () => {
    const clock = sinon.useFakeTimers();
    const form = testData.standardForms
      .createPast(1, { xmlFormId: 'a b' })
      .last();
    const submission = testData.standardSubmissions
      .createPast(1, { instanceId: 'c d' })
      .last();
    return mockHttp()
      .mount(TestUtilHoverCards, mountOptions(
        SubmissionLink,
        { projectId: 1, xmlFormId: 'a b', submission }
      ))
      .request(hover(clock))
      .respondWithData(() => form)
      .respondWithData(testData.submissionOData)
      .testRequests([
        { url: '/v1/projects/1/forms/a%20b' },
        {
          url: ({ pathname, searchParams }) => {
            pathname.should.equal("/v1/projects/1/forms/a%20b.svc/Submissions('c%20d')");
            searchParams.get('$select').should.equal('__id,__system,meta');
          }
        }
      ])
      .afterResponses(async (component) => {
        getSubtitle().should.equal('Submission');
        const { target } = component.getComponent(Popover).props();
        target.should.equal(getAnchor(component).element);
      });
  });

  it('shows a hover card of type dataset', () => {
    const clock = sinon.useFakeTimers();
    const dataset = testData.extendedDatasets
      .createPast(1, { name: 'a b' })
      .last();
    return mockHttp()
      .mount(TestUtilHoverCards, mountOptions(
        DatasetLink,
        { projectId: 1, name: 'a b' }
      ))
      .request(hover(clock))
      .respondWithData(() => dataset)
      .testRequests([{ url: '/v1/projects/1/datasets/a%20b', extended: true }])
      .afterResponses(async (component) => {
        getSubtitle().should.equal('Entity List');
        const { target } = component.getComponent(Popover).props();
        target.should.equal(getAnchor(component).element);
      });
  });

  it('shows a hover card of type entity', () => {
    const clock = sinon.useFakeTimers();
    const dataset = testData.extendedDatasets
      .createPast(1, { name: 'a b', entities: 1 })
      .last();
    const entity = testData.standardEntities
      .createPast(1, { uuid: 'e' })
      .last();
    return mockHttp()
      .mount(TestUtilHoverCards, mountOptions(
        EntityLink,
        { projectId: 1, dataset: 'a b', entity }
      ))
      .request(hover(clock))
      .respondWithData(() => dataset)
      .respondWithData(() => entity)
      .testRequests([
        { url: '/v1/projects/1/datasets/a%20b' },
        { url: '/v1/projects/1/datasets/a%20b/entities/e' }
      ])
      .afterResponses(async (component) => {
        getSubtitle().should.equal('Entity');
        const { target } = component.getComponent(Popover).props();
        target.should.equal(getAnchor(component).element);
      });
  });

  it('hides the hover card on mouseleave', () => {
    const clock = sinon.useFakeTimers();
    const entity = testData.standardEntities.createPast(1).last();
    return mockHttp()
      .mount(TestUtilHoverCards, mountOptions(
        EntityLink,
        { projectId: 1, dataset: 'trees', entity }
      ))
      .request(hover(clock))
      .respondWithData(() => testData.extendedDatasets.last())
      .respondWithData(() => entity)
      .afterResponses(async (component) => {
        should.exist(document.querySelector('.popover'));
        await getAnchor(component).trigger('mouseleave');
        should.not.exist(document.querySelector('.popover'));
      });
  });

  it('does not show a hover card if mouseleave quickly follows mouseenter', () => {
    const clock = sinon.useFakeTimers();
    const entity = testData.standardEntities.createPast(1).last();
    return mockHttp()
      .mount(TestUtilHoverCards, mountOptions(
        EntityLink,
        { projectId: 1, dataset: 'trees', entity }
      ))
      .testNoRequest(async (component) => {
        const anchor = getAnchor(component);
        await anchor.trigger('mouseenter');
        clock.tick(300);
        await anchor.trigger('mouseleave');
        clock.tick(100);
      })
      .afterResponses(() => {
        should.not.exist(document.querySelector('.popover'));
      });
  });

  it('handles an error response', () => {
    const clock = sinon.useFakeTimers();
    const entity = testData.standardEntities.createPast(1).last();
    return mockHttp()
      .mount(TestUtilHoverCards, mountOptions(
        EntityLink,
        { projectId: 1, dataset: 'trees', entity }
      ))
      .request(hover(clock))
      .respondWithData(() => testData.extendedDatasets.last())
      .respondWithProblem()
      .afterResponses(async (component) => {
        should.not.exist(document.querySelector('.popover'));
        component.should.not.alert();
        // Make sure that this does not result in a Vue warning.
        await getAnchor(component).trigger('mouseleave');
      });
  });

  it('does not log an error if mouseleave is triggered during request', () => {
    const clock = sinon.useFakeTimers();
    const entity = testData.standardEntities.createPast(1).last();
    return mockHttp()
      .mount(TestUtilHoverCards, mountOptions(
        EntityLink,
        { projectId: 1, dataset: 'trees', entity }
      ))
      .request(hover(clock))
      .beforeAnyResponse(component =>
        getAnchor(component).trigger('mouseleave'))
      .respondWithData(() => testData.extendedDatasets.last())
      .respondWithData(() => entity)
      .afterResponses(async () => {
        should.not.exist(document.querySelector('.popover'));
      });
  });
});
