# @getodk/central-frontend

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
- getodk/central#1944 (f9c0f85): Attachment files now can only be drag and drop to the attachment section. Previously, they could be drop to anywhere on the Form draft page.
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
- getodk/central#1668: Update dependencies
- getodk/central#1843: Update translations
