# Scripts

This directory contains utility scripts to support the **ODK Web Forms** project workflows, mostly run via npm.

## Overview

The folder includes scripts for:

- Updating the feature matrix

## Prerequisites

- [Node.js](https://nodejs.org/) installed

Install dependencies before running scripts:

```bash
npm run ci
```

## Available Scripts

### `update-feature-matrix`

Updates the feature matrix data used by the project.

**Run:**

```bash
node feature-matrix/render.js
```

## Contributing

- When adding new scripts, please add an entry here with a description and usage instructions.
- Keep scripts consistent and well-documented.
