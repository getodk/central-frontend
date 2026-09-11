# @getodk/central-frontend

## 2026.3.0

### Minor Changes

- e66343c: Update translations (getodk/central#2137)
- 47ea79f: Handle error responses on homepage (getodk/central#1584, getodk/central#2070)
- 8d57d76: Remove trailing slashes from routes (getodk/central#1697)
- 4b148b1: Restore session when user initially navigates to "Not Found" page
- 81cb08b: Allow user to import Entity CSV with missing properties in header (getodk/central#1787)
- f1e85b0: Make routes case-sensitive
- faa6675: When importing Entities from CSV, ignore columns that start with `__` (getodk/central#1785)
- 96db2da: Prompt user to create Entity properties when CSV upload has unknown columns (getodk/central#1786)
- 5a87c0e: Reload page if asset fails to load after server upgrade (getodk/central#2073)
- 2a93ff7: Do not report session restore errors to Sentry (getodk/central#2072)
- 8dac83f: Prevent error if response for Entity List is received before Project (getodk/central#2189)
- 7f40e6f: Update What's New modal for release
- 272a95e: List duplicate column headers in Entity CSV file
- 398f558: Removed dependency on bootstrap plugins and jquery.
- faa52cd: Truncate overflowing tooltips (getodk/central#2183)
- 28bd0d0: Fixes: added extra bottom margin for draft control so snackbar doesn't overlap it. getodk/central#1962
- 87800e2: feat getodk/central#1875: Inline property creation for app user and PAL create modals
- ab7272b: Remove Custom Properties tab from project page (getodk/central#2075)
  - The functionality is still there but properties are now managed through app users and public links.
  - They can be created through the "Create New App User" and "Create New Public Link" modals, and viewed on the app user and link lists.
- 5acc384: feat getodk/central#1792: Add ViewAs &lt;app user&gt; filter to Entities
- b960928: feat getodk/central#1871 and getodk/central#1874
  - Allow App Users and Public Links to be filtered by actor properties and specific values of those properties. Single relations and equality only for now (e.g. show me app users where region = north).
- 194cc9e: Features: Submission data and view xml on the Submission detail page [Central#1707](https://github.com/getodk/central/issues/1707)
- d8c66cd: Show file size in form attachment table (issue getodk/central#1895)
- f6ac6db: Remove attachment confirmation modal and automatically uploading all matching files

## 2026.2.0

### Minor Changes

**Entity filtering**

- getodk/central#1866: Filter Entity Lists using custom user properties
- getodk/central#1870 (6947cd1): Add Custom Properties tab in Project to manage App User/Public Link properties
- getodk/central#1791 (6e1b299): Feature: add access filter options on dataset settings page

**Web Forms is now the default web form experience**

- e620e5a: Separated web-forms and enketo into a new app
- 7511e9a: Improved messaging regarding the ODK Web Forms experience
- getodk/central#1946 (b314f1c): Removed W+F keyboard shortcut to see "New Preview" button to use ODK Web Forms

**Improved form drafts**

- getodk/central#1681: Update Form drafts experience
- f9c0f85: Attachment files now can only be drag and drop to the attachment section. Previously, they could be drop to anywhere on the Form draft page.
- getodk/central#1945 (84750ae): Change icon and text of the choose files button on Form draft's attachment section

**Other improvements + bug fixes**

- getodk/central#1761: Only cap the login logo size vertically, not horizontally
- getodk/central#1867: Recommend action when Entity processing fails
- getodk/central#1348: Add pagination to URL for Submission and Entity tables
- getodk/central#1079: Rename "passphrase" to "encryption password"

**Maintenance**

- 18f994e: Added Sentry error reporting
- getodk/central#1847: Update What's New modal
- getodk/central#1846: Update usage information metrics
- getodk/central#1844: Update dependencies
- getodk/central#1843: Update translations
