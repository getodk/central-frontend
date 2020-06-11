const R = require('ramda');
const fs = require('fs');
// eslint-disable-next-line import/no-extraneous-dependencies
const { parse } = require('comment-json');

const fallbackLocale = 'en';



////////////////////////////////////////////////////////////////////////////////
// READ ROOT MESSAGES

const rootJsonFilename = `src/locales/${fallbackLocale}.json`;
const messages = parse(fs.readFileSync(rootJsonFilename).toString());



////////////////////////////////////////////////////////////////////////////////
// READ SINGLE FILE COMPONENTS

// Get a list of single file components, sorted by component name.
const sfcs = [];
const dirs = ['src/components'];
while (dirs.length !== 0) {
  const dir = dirs.pop();
  for (const basename of fs.readdirSync(dir)) {
    const path = `${dir}/${basename}`;
    if (fs.statSync(path).isDirectory()) {
      dirs.push(path);
    } else if (path.endsWith('.vue')) {
      const componentName = path
        .replace('src/components', '')
        .replace(/\.vue$/, '')
        .replace(/[-/](.)/g, (_, c) => c.toUpperCase());
      sfcs.push({ componentName, filename: path });
    }
  }
}
sfcs.sort(R.comparator((sfc1, sfc2) =>
  sfc1.componentName < sfc2.componentName));

messages.component = {};
for (const { componentName, filename } of sfcs) {
  const content = fs.readFileSync(filename).toString();
  const match = content.match(/<i18n( +lang="json5")? *>/);
  if (match != null) {
    const begin = match.index + match[0].length;
    const end = content.indexOf('</i18n>', begin);
    if (end === -1) throw new Error('invalid single file component');
    const json = content.slice(begin, end);
    messages.component[componentName] = parse(json)[fallbackLocale];
  }
}



////////////////////////////////////////////////////////////////////////////////
// PLURAL FORMS

const validatePluralForms = (forms) => {
  if (forms.length > 2)
    throw new Error('pluralized messages must have exactly two forms');
  const vars = forms.map(form => {
    const match = form.match(/{\w+}/g);
    return match != null ? match.sort() : [];
  });
  for (let i = 0; i < forms.length; i += 1) {
    // Braces used outside of variables could be an issue for ICU plurals.
    const match = forms[i].match(/[{}]/g);
    if (match != null && match.length !== 2 * vars[i].length)
      throw new Error('unexpected brace');

    // Single quotes are used for escaping in ICU plurals.
    if (forms[i].includes("'"))
      throw new Error("We don't support straight single quotes in ICU plurals, but curly quotes are supported.");

    if (forms[i].includes('#')) throw new Error('unexpected #');
  }
  if (forms.length === 2) {
    if (vars[0].length !== vars[1].length)
      throw new Error('pluralized messages must use the same number of variables in each form');
    for (let i = 0; i < vars[0].length; i += 1) {
      if (vars[0][i] !== vars[1][i])
        throw new Error('pluralized messages must use the same variables in each form');
    }
  }
};
const splitPluralForms = (message) => {
  const split = message.split(' | ');
  validatePluralForms(split);
  return split;
};
// Returns a string for Transifex that may use ICU plurals.
const joinPluralForms = (forms) => {
  validatePluralForms(forms);
  return forms.length === 2
    ? `{count, plural, one {${forms[0]}} other {${forms[1]}}}`
    // It seems that there is no issue if the string starts with a variable
    // (that is, with an open brace).
    : forms[0];
};



////////////////////////////////////////////////////////////////////////////////
// DEVELOPER COMMENTS

const commentsByKey = {};
for (const { value } of messages[Symbol.for('before-all')]) {
  const match = value.trim().match(/^(\w+):[ \t]*(.+)$/);
  // eslint-disable-next-line prefer-destructuring
  if (match != null) commentsByKey[match[1]] = match[2];
}

const getComment = (path) => {
  const parent = R.path(path.slice(0, path.length - 1), messages);
  const key = path[path.length - 1];

  if (key === 'full') {
    const siblings = Object.entries(parent)
      .filter(([k, v]) => k !== 'full' && typeof v === 'string');
    if (siblings.length === 0) return null;

    if (siblings.length === 1) {
      const [k, v] = siblings[0];
      const forms = splitPluralForms(v);
      return forms.length === 1
        ? `{${k}} is a separate string that will be translated below. Its text will be formatted within ODK Central, for example, it might be bold or a link. Its text is:\n\n${v}`
        // Showing the plural form instead of the singular, because that is what
        // Transifex initially shows for an English string with a plural form.
        : `{${k}} is a separate string that will be translated below. Its text will be formatted within ODK Central, for example, it might be bold or a link. In its plural form, its text is:\n\n${forms[1]}`;
    }

    const joined = siblings
      .map(([k, v]) => {
        const forms = splitPluralForms(v);
        return forms.length === 1
          ? `- {${k}} has the text: ${v}`
          : `- {${k}} has the plural form: ${forms[1]}`;
      })
      .join('\n');
    return `The following are separate strings that will be translated below. They will be formatted within ODK Central, for example, they might be bold or a link.\n\n${joined}`;
  }

  if (parent.full != null) {
    // parent.full will be an array if $tcPath() is used.
    return Array.isArray(parent.full)
      ? `This text will be formatted within ODK Central, for example, it might be bold or a link. It will be inserted where {${key}} is in the following text. (The plural form of the text is shown.)\n\n${parent.full[1]}`
      : `This text will be formatted within ODK Central, for example, it might be bold or a link. It will be inserted where {${key}} is in the following text:\n\n${parent.full}`;
  }

  for (let i = path.length - 1; i >= 0; i -= 1) {
    const ancestor = R.path(path.slice(0, i), messages);
    const comments = ancestor[Symbol.for(`before:${path[i]}`)];
    if (comments != null)
      return comments.map(comment => comment.value.trim()).join(' ');
  }

  for (let i = path.length - 1; i >= 0; i -= 1) {
    const comment = commentsByKey[path[i]];
    if (comment != null) return comment;
  }

  return null;
};



////////////////////////////////////////////////////////////////////////////////
// CONVERT TO STRUCTURED JSON

const restructure = (value, path = []) => {
  if (value == null) throw new Error('invalid value');

  if (typeof value === 'string') {
    const structured = { string: joinPluralForms(splitPluralForms(value)) };
    const comment = getComment(path);
    if (comment != null) structured.developer_comment = comment;
    return structured;
  }

  // Needed for $tcPath().
  if (path[path.length - 1] === 'full') {
    if (!Array.isArray(value)) throw new Error('invalid .full message');
    const structured = { string: joinPluralForms(value) };
    const comment = getComment(path);
    if (comment != null) structured.developer_comment = comment;
    return structured;
  }

  if (Array.isArray(value)) {
    // Convert `value` to a non-array object: it seems that structured JSON does
    // not support arrays.
    const structured = {};
    for (let i = 0; i < value.length; i += 1)
      structured[i] = restructure(value[i], [...path, i.toString()]);
    return structured;
  }

  if (typeof value !== 'object') throw new Error('invalid value');

  const structured = {};
  for (const [k, v] of Object.entries(value))
    structured[k] = restructure(v, [...path, k]);
  return structured;
};

const structured = restructure(messages);



////////////////////////////////////////////////////////////////////////////////
// WRITE OUTPUT

fs.writeFileSync(
  `transifex/strings_${fallbackLocale}.json`,
  JSON.stringify(structured, null, 2)
);
