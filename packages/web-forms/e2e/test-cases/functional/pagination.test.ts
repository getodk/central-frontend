import { expect, test } from '@playwright/test';
import { FillFormPage } from '../../page-objects/pages/FillFormPage.ts';

test.describe('Pagination', () => {
  let formPage: FillFormPage;

  test.describe('one input per page', () => {
    test.beforeEach(async ({ page }) => {
      formPage = await FillFormPage.loadForm(page, 'pagination-01-flat.xml');
    });

    test('shows only the first input on load', async () => {
      await formPage.text.expectOnlyLabels(['What is your name?']);
      await formPage.pagination.expectNavigation({ previous: false, next: true });
    });

    test('navigates forward and backward through every page', async () => {
      await formPage.pagination.clickNext();
      await formPage.text.expectOnlyLabels(['What is your age?']);
      await formPage.pagination.expectNavigation({ previous: true, next: true });

      await formPage.pagination.clickNext();
      await formPage.text.expectOnlyLabels(['Favorite color?']);

      await formPage.pagination.clickNext();
      await formPage.text.expectOnlyLabels(['Any comment?']);
      await formPage.pagination.expectNavigation({ previous: true, next: false });

      await formPage.pagination.clickPrevious();
      await formPage.text.expectOnlyLabels(['Favorite color?']);

      await formPage.pagination.clickPrevious();
      await formPage.pagination.clickPrevious();
      await formPage.text.expectOnlyLabels(['What is your name?']);
      await formPage.pagination.expectNavigation({ previous: false, next: true });
    });
  });

  test.describe('field-list group as one page', () => {
    test.beforeEach(async ({ page }) => {
      formPage = await FillFormPage.loadForm(page, 'pagination-03-fieldlist-group.xml');
    });

    test('renders all three inputs together on a single page', async ({ page }) => {
      await expect(
        page.getByText('Person details (field-list = one page)', { exact: true })
      ).toBeVisible();
      await formPage.text.expectOnlyLabels(['Name', 'Age', 'Email']);
    });

    test('disables navigation buttons but renders footer because form has "pages" class', async () => {
      await formPage.pagination.expectNavigation({ previous: false, next: false });
    });
  });

  test.describe('field-list wrapping a repeat', () => {
    test.beforeEach(async ({ page }) => {
      formPage = await FillFormPage.loadForm(page, 'pagination-09-repeat-fieldlist.xml');
    });

    test('walks intro → child[1] → child[2]', async ({ page }) => {
      const wrapperLabel = page.getByText('Children (each iteration = one page)', { exact: true });

      await formPage.text.expectOnlyLabels(['Intro question (own page)']);
      await expect(wrapperLabel).toBeHidden();
      await formPage.pagination.expectNavigation({ previous: false, next: true });

      await formPage.pagination.clickNext();
      await expect(wrapperLabel).toBeVisible();
      await formPage.text.expectOnlyLabels(['Child 1 name', 'Child 1 age', 'Child 1 sex']);

      await formPage.pagination.clickNext();
      await formPage.text.expectOnlyLabels(['Child 2 name', 'Child 2 age', 'Child 2 sex']);
      await formPage.pagination.expectNavigation({ previous: true, next: false });
    });

    test('renders the "Add" button only on the last page of the repeat', async () => {
      await formPage.repeat.expectAddButtonVisible(false);

      await formPage.pagination.clickNext();
      await formPage.repeat.expectAddButtonVisible(false);

      await formPage.pagination.clickNext();
      await formPage.repeat.expectAddButtonVisible(true);
    });
  });

  test.describe('plain repeat, one question per page', () => {
    test.beforeEach(async ({ page }) => {
      formPage = await FillFormPage.loadForm(page, 'pagination-08-plain-repeat.xml');
    });

    test('walks intro → each repeat question on its own page', async () => {
      await formPage.text.expectOnlyLabels(['Intro question (own page)']);

      await formPage.pagination.clickNext();
      await formPage.text.expectOnlyLabels(['Child 1 name']);

      await formPage.pagination.clickNext();
      await formPage.text.expectOnlyLabels(['Child 1 age']);

      await formPage.pagination.clickNext();
      await formPage.text.expectOnlyLabels(['Child 2 name']);

      await formPage.pagination.clickNext();
      await formPage.text.expectOnlyLabels(['Child 2 age']);
      await formPage.pagination.expectNavigation({ previous: true, next: false });
    });

    test('renders the "Add" button only on the last page of the repeat range', async () => {
      await formPage.repeat.expectAddButtonVisible(false);

      await formPage.pagination.clickNext();
      await formPage.repeat.expectAddButtonVisible(false);

      await formPage.pagination.clickNext();
      await formPage.pagination.clickNext();
      await formPage.pagination.clickNext();
      await formPage.repeat.expectAddButtonVisible(true);
    });

    test('adding an instance from the last page navigates to it, keeping document order', async () => {
      await formPage.pagination.clickNext();
      await formPage.pagination.clickNext();
      await formPage.pagination.clickNext();
      await formPage.pagination.clickNext();
      await formPage.text.expectOnlyLabels(['Child 2 age']);

      await formPage.repeat.addInstance();
      await formPage.text.expectOnlyLabels(['Child 3 name']);

      await formPage.pagination.clickNext();
      await formPage.text.expectOnlyLabels(['Child 3 age']);
      await formPage.pagination.expectNavigation({ previous: true, next: false });
      await formPage.repeat.expectAddButtonVisible(true);

      await formPage.pagination.clickPrevious();
      await formPage.text.expectOnlyLabels(['Child 3 name']);
    });
  });

  test.describe('empty plain repeat gets its own Add page', () => {
    test.beforeEach(async ({ page }) => {
      formPage = await FillFormPage.loadForm(page, 'pagination-08b-plain-repeat-empty.xml');
    });

    test('the empty repeat is its own page between intro and tail', async () => {
      await formPage.text.expectOnlyLabels(['Intro question (own page)']);
      await formPage.repeat.expectAddButtonVisible(false);

      await formPage.pagination.clickNext();
      await formPage.text.expectOnlyLabels([]);
      await formPage.repeat.expectAddButtonVisible(true);
      await formPage.pagination.expectNavigation({ previous: true, next: true });

      await formPage.pagination.clickNext();
      await formPage.text.expectOnlyLabels(['Tail question (own page)']);
      await formPage.repeat.expectAddButtonVisible(false);
      await formPage.pagination.expectNavigation({ previous: true, next: false });
    });

    test('tapping Add replaces the empty page with the first instance and moves Add to the end', async () => {
      await formPage.pagination.clickNext();
      await formPage.repeat.addInstance();

      // Auto-advance: the empty-range page is replaced by the new instance's first question.
      await formPage.text.expectOnlyLabels(['Child 1 name']);
      await formPage.repeat.expectAddButtonVisible(false);

      await formPage.pagination.clickNext();
      await formPage.text.expectOnlyLabels(['Child 1 age']);
      await formPage.repeat.expectAddButtonVisible(true);

      await formPage.pagination.clickNext();
      await formPage.text.expectOnlyLabels(['Tail question (own page)']);
      await formPage.repeat.expectAddButtonVisible(false);
    });
  });

  test.describe('field-list with relevance', () => {
    test.beforeEach(async ({ page }) => {
      formPage = await FillFormPage.loadForm(page, 'pagination-13-fieldlist-relevance.xml');
    });

    test('renders only the fields without relevance; navigation disabled', async () => {
      await formPage.text.expectOnlyLabels(['Are you employed?', 'Any comments? (always shown)']);
      await formPage.pagination.expectNavigation({ previous: false, next: false });
    });

    test('selecting "Yes" reveals employer + job_title; nav stays disabled', async ({ page }) => {
      await page.getByLabel('Yes', { exact: true }).check();

      await formPage.text.expectOnlyLabels([
        'Are you employed?',
        'Employer name (only if employed)',
        'Job title (only if employed)',
        'Any comments? (always shown)',
      ]);
      await formPage.pagination.expectNavigation({ previous: false, next: false });
    });

    test('selecting "No" reveals looking; employer + job_title hide', async ({ page }) => {
      await page.getByLabel('No', { exact: true }).check();

      await formPage.text.expectOnlyLabels([
        'Are you employed?',
        'Are you looking for work? (only if not employed)',
        'Any comments? (always shown)',
      ]);
    });
  });

  test.describe('field-list on repeat element', () => {
    test.beforeEach(async ({ page }) => {
      formPage = await FillFormPage.loadForm(page, 'pagination-14-fieldlist-on-repeat.xml');
    });

    test('renders one iteration per page and walks through both', async () => {
      await formPage.text.expectOnlyLabels(['Visit 1 date', 'Visit 1 temperature', 'Visit 1 notes']);
      await formPage.pagination.expectNavigation({ previous: false, next: true });

      await formPage.pagination.clickNext();
      await formPage.text.expectOnlyLabels(['Visit 2 date', 'Visit 2 temperature', 'Visit 2 notes']);
      await formPage.pagination.expectNavigation({ previous: true, next: false });
    });
  });

  test.describe('nested repeats, field-list on outer repeat', () => {
    test.beforeEach(async ({ page }) => {
      formPage = await FillFormPage.loadForm(page, 'pagination-17-nested-repeat-fieldlist.xml');
    });

    test('each household page shows its own questions and all of its members', async () => {
      await formPage.text.expectOnlyLabels([
        'Household 1 name',
        'Member 1 name',
        'Member 1 age',
        'Member 2 name',
        'Member 2 age',
      ]);
      await formPage.pagination.expectNavigation({ previous: false, next: true });

      await formPage.pagination.clickNext();
      await formPage.text.expectOnlyLabels(['Household 2 name', 'Member 1 name', 'Member 1 age']);
      await formPage.pagination.expectNavigation({ previous: true, next: false });
    });

    test('inner Add renders on every household page; outer Add only on the last', async () => {
      // Household 1 (not the last outer instance): inner Add only.
      await formPage.repeat.expectAddButtonVisible(true, 'Members');
      await formPage.repeat.expectAddButtonVisible(false, 'Households');

      // Household 2 (last outer instance): both, clearly distinct buttons.
      await formPage.pagination.clickNext();
      await formPage.repeat.expectAddButtonVisible(true, 'Members');
      await formPage.repeat.expectAddButtonVisible(true, 'Households');
    });

    test('adding a member stays on the same household page', async () => {
      await formPage.text.expectOnlyLabels([
        'Household 1 name',
        'Member 1 name',
        'Member 1 age',
        'Member 2 name',
        'Member 2 age',
      ]);

      await formPage.repeat.addInstance('Members');

      await formPage.text.expectOnlyLabels([
        'Household 1 name',
        'Member 1 name',
        'Member 1 age',
        'Member 2 name',
        'Member 2 age',
        'Member 3 name',
        'Member 3 age',
      ]);
      await formPage.pagination.expectNavigation({ previous: false, next: true });
    });

    test('adding a household from the last page navigates to the new household page', async () => {
      await formPage.pagination.clickNext();
      await formPage.text.expectOnlyLabels(['Household 2 name', 'Member 1 name', 'Member 1 age']);

      await formPage.repeat.addInstance('Households');

      await formPage.text.expectOnlyLabels(['Household 3 name']);
      await formPage.pagination.expectNavigation({ previous: true, next: false });
      await formPage.repeat.expectAddButtonVisible(true, 'Households');
    });
  });

  test.describe('fixed-count repeat', () => {
    test.beforeEach(async ({ page }) => {
      formPage = await FillFormPage.loadForm(page, 'pagination-16-repeat-fixed-count.xml');
    });

    test('walks one question per page across all N iterations then disables Next', async () => {
      await formPage.text.expectOnlyLabels(['Member 1 name']);
      await formPage.pagination.expectNavigation({ previous: false, next: true });

      await formPage.pagination.clickNext();
      await formPage.text.expectOnlyLabels(['Member 1 age']);

      await formPage.pagination.clickNext();
      await formPage.text.expectOnlyLabels(['Member 2 name']);

      await formPage.pagination.clickNext();
      await formPage.text.expectOnlyLabels(['Member 2 age']);

      await formPage.pagination.clickNext();
      await formPage.text.expectOnlyLabels(['Member 3 name']);

      await formPage.pagination.clickNext();
      await formPage.text.expectOnlyLabels(['Member 3 age']);
      await formPage.pagination.expectNavigation({ previous: true, next: false });
    });

    test('never renders an Add button (controlled repeat)', async () => {
      await formPage.repeat.expectAddButtonVisible(false);

      await formPage.pagination.clickNext();
      await formPage.pagination.clickNext();
      await formPage.pagination.clickNext();
      await formPage.pagination.clickNext();
      await formPage.pagination.clickNext();
      await formPage.text.expectOnlyLabels(['Member 3 age']);
      await formPage.repeat.expectAddButtonVisible(false);
    });
  });
});
