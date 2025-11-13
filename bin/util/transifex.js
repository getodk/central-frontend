const fs = require('fs');
const { equals, hasPath, last, path: getPath, startsWith } = require('ramda');
// eslint-disable-next-line import/no-extraneous-dependencies
const { parse } = require('comment-json');

const { deletePath, logThenThrow, setPath, sortProps } = require('./util');



////////////////////////////////////////////////////////////////////////////////
// LOCALES

const locales = {
  en: {},
  cs: {},
  de: {},
  es: { pluralCategories: ['one', 'many', 'other'] },
  fr: {},
  id: {},
  it: { pluralCategories: ['one', 'many', 'other'] },
  ja: { warnVariableSeparator: false },
  pt: {},
  sw: {},
  zh: { warnVariableSeparator: false },
  'zh-Hant': { warnVariableSeparator: false }
};

const sourceLocale = 'en';

// Normalize `locales`.
{
  const defaults = { warnVariableSeparator: true };
  for (const [locale, options] of Object.entries(locales)) {
    const normalized = { ...defaults, ...options };

    if (normalized.pluralCategories != null) {
      normalized.pluralCategories = [...normalized.pluralCategories].sort();
    } else {
      const pluralRules = new Intl.PluralRules([locale]);
      normalized.pluralCategories = pluralRules.resolvedOptions().pluralCategories;
    }

    locales[locale] = normalized;
  }
}



////////////////////////////////////////////////////////////////////////////////
// VARIABLES

// Returns an array of the variables and component interpolation slots used in a
// message. The array will contain the name of the variable or slot for each
// time it is used in the message. For a pluralized message, call parseVars()
// for each plural form.
const parseVars = (pluralForm) => {
  const varMatches = pluralForm.match(/{\w+}/g);
  const vars = varMatches != null ? varMatches.sort() : [];
  // Braces used outside of variables could be an issue.
  const braceMatches = pluralForm.match(/[{}]/g);
  if (braceMatches != null && braceMatches.length !== 2 * vars.length)
    logThenThrow(pluralForm, 'unexpected brace');
  return vars;
};



////////////////////////////////////////////////////////////////////////////////
// PLURALS

// PluralForms is an array-like object with an element for each plural form of a
// message. It provides methods to convert to or from an Vue I18n message or a
// Transifex string. If a message is not pluralized, PluralForms will contain a
// single element.
class PluralForms {
  static empty(length) { return new PluralForms(new Array(length).fill('')); }

  static fromVueI18n(message) {
    const forms = message.split(' | ');
    if (forms.length > 2)
      logThenThrow(message, 'a pluralized message must have exactly two forms');

    for (const form of forms) {
      if (form.includes('|')) logThenThrow(message, 'unexpected |');
      if (/(^\s|\s$|\s\s)/.test(form))
        logThenThrow(message, 'unexpected white space');
    }

    return new PluralForms(forms);
  }

  // Transifex uses ICU plurals.
  static fromTransifex(string, locale) {
    const forms = [];
    const icuMatch = string.match(/^({count, plural,).+}$/s);
    if (icuMatch == null) {
      forms.push(string);
    } else {
      const categories = [];
      for (let begin = icuMatch[1].length; begin < string.length - 1;) {
        // Using a single RegExp along with lastIndex might be more efficient.
        const formMatch = string.slice(begin).match(/^ ([a-z]+) {/);
        if (formMatch == null) logThenThrow(string, 'invalid plural');
        categories.push(formMatch[1]);

        let end = begin + formMatch[0].length;
        let unmatchedBraces = 1;
        for (; unmatchedBraces > 0 && end < string.length - 1; end += 1) {
          if (string[end] === '{')
            unmatchedBraces += 1;
          else if (string[end] === '}')
            unmatchedBraces -= 1;
        }
        if (unmatchedBraces !== 0) logThenThrow(string, 'unmatched brace');
        forms.push(string.slice(begin + formMatch[0].length, end - 1));
        begin = end;
      }

      categories.sort();
      const expectedCategories = locales[locale].pluralCategories;
      if (!equals(categories, expectedCategories))
        logThenThrow(string, `Expected the plural categories [${expectedCategories.join(', ')}], but found [${categories.join(', ')}]. Did you download the translations "to translate"?`);
    }

    for (let i = 0; i < forms.length; i += 1)
      forms[i] = forms[i].trim().replace(/\s+/g, ' ');

    return new PluralForms(forms);
  }

  constructor(forms) {
    if (forms.length === 0) throw new Error('forms cannot be empty');
    this[0] = forms[0]; // eslint-disable-line prefer-destructuring
    const vars = parseVars(forms[0]);
    for (let i = 1; i < forms.length; i += 1) {
      // Transifex should prevent this.
      if ((forms[i] === '') !== (forms[0] === ''))
        logThenThrow(forms, 'unexpected empty plural form');
      // Our Transifex translation checks should prevent this.
      if (!equals(parseVars(forms[i]), vars))
        logThenThrow(forms, 'plural forms must use the same variables in each form');

      this[i] = forms[i];
    }
    this.length = forms.length;
  }

  isEmpty() { return this[0] === ''; }

  toVueI18n() {
    const forms = Array.from(this);
    if (forms.some(form => form.includes('|')))
      logThenThrow(this, 'unexpected |');
    return forms.join(' | ');
  }

  toTransifex() {
    for (let i = 0; i < this.length; i += 1) {
      // Single quotes are used for escaping in ICU plurals.
      if (this[i].includes("'"))
        logThenThrow(this, "We don't support straight single quotes in ICU plurals, but curly quotes are supported.");
      // Used in ICU plurals
      if (this[i].includes('#')) logThenThrow(this, 'unexpected #');
    }
    if (this.length > 2) logThenThrow(this, 'too many plural forms');
    return this.length === 2
      ? `{count, plural, one {${this[0]}} other {${this[1]}}}`
      // It seems that there is no issue if the string starts with a variable
      // (that is, with an open brace).
      : this[0];
  }
}



////////////////////////////////////////////////////////////////////////////////
// LINKED LOCALE MESSAGES

/*
We will use a linked locale message when two messages are exactly the same.
However, we don't use a linked locale message to insert one message into
another, larger message: grammatical features like noun case and construct state
mean that that usually won't work across languages. Given that, we only use the
@:path syntax, not @:(path). We also do not use linked locale message modifiers.

Related to this, note that while a linked locale message can link to a
pluralized message if they are exactly the same, a pluralized message should not
contain a linked locale message: that would mean that it is using a linked
locale message within a longer message. See also these related issues:

https://github.com/kazupon/vue-i18n/issues/521
https://github.com/kazupon/vue-i18n/issues/195
*/
const pathOfLinkedMessage = (pluralForms) => {
  if (pluralForms.length === 1) {
    const match = pluralForms[0].match(/^@:([\w.]+)$/);
    if (match != null) return match[1].split('.');
  }

  for (let i = 0; i < pluralForms.length; i += 1) {
    if (pluralForms[i].includes('@:'))
      logThenThrow(pluralForms, 'unexpected linked locale message');
  }

  return null;
};



////////////////////////////////////////////////////////////////////////////////
// TRANSIFEX COMMENTS

const commentTags = {
  transifexKey: (text) => {
    if (text === '') throw new Error('key required');
    const path = text.split('.');
    if (path.some(element => !/^\w+$/.test(element)))
      throw new Error('invalid key');
    return path;
  }
};
const commentTag = (line) => {
  const match = line.match(/^@(\w+)(\s|$)/);
  if (match == null) logThenThrow(line, 'invalid comment tag');
  const name = match[1];
  const parser = commentTags[name];
  if (parser == null) logThenThrow(line, 'unknown comment tag');
  const text = line.replace(match[0], '').trimStart();
  let value;
  try {
    value = parser(text);
  } catch (error) {
    logThenThrow(line, `@${name}: ${error.message}`);
  }
  return [name, value];
};

// Parses the JSON comments before a message or group of messages.
const parseComments = (messages, key) => {
  const comments = messages[Symbol.for(`before:${key}`)];
  if (comments == null) return {};

  const { type } = comments[0];
  if (comments.some(comment => comment.type !== type))
    logThenThrow(comments, 'cannot mix line comments and block comments');
  if (type === 'BlockComment' && comments.length !== 1)
    logThenThrow(comments, 'too many block comments');

  // Split a block comment into lines.
  const lines = type === 'BlockComment'
    ? comments[0].value.split('\n')
    : comments.map(({ value }) => value);

  // Trim lines.
  for (const [i, line] of lines.entries()) lines[i] = line.trim();
  while (lines.length !== 0 && lines[0] === '') lines.shift();
  if (lines.length === 0) return {};
  while (last(lines) === '') lines.pop();

  // Parse tags at the top of the comments.
  const result = {};
  while (lines.length !== 0 && lines[0].startsWith('@')) {
    const [name, value] = commentTag(lines.shift());
    if (result[name] != null) logThenThrow(comments, `multiple @${name} tags`);
    result[name] = value;
    while (lines.length !== 0 && lines[0] === '') lines.shift();
  }
  for (const line of lines) {
    if (/^@\w+(\s|$)/.test(line)) logThenThrow(line, 'unexpected comment tag');
  }

  // Combine all the lines of text into a single comment for Transifex.
  if (lines.length !== 0) {
    result.text = lines.reduce((acc, line) => {
      const separator = line === '' || acc.endsWith('\n') ? '\n' : ' ';
      return `${acc}${separator}${line}`;
    });
  }

  return result;
};

// Parses the comments at the top of en.json5.
const keyComments = (messages) => {
  const comments = messages[Symbol.for('before-all')];
  if (comments == null) return {};
  const byKey = {};
  for (const { value } of comments) {
    const trim = value.trim();
    const match = trim.match(/^(\w+):/);
    if (match == null) logThenThrow(trim, 'invalid comment for key');
    const key = match[1];
    const text = trim.replace(match[0], '').trimStart();
    if (text === '') logThenThrow(trim, 'empty comment for key');
    byKey[key] = text;
  }
  return byKey;
};

/*
Our convention for component interpolation is to group all the messages used in
the component interpolation in a flat object. The object will have a property
named `full` whose path is passed to the <i18n-t> component. A component
interpolation is identified by the presence of a property named `full`, so
`full` should not be used as a property name outside component interpolation.

A component interpolation can be nested, for example, if only part of a link is
formatted in bold. We still use a single flat object in that case, grouping
together the messages of the entire component interpolation.

generateCommentsForFull() generates the developer comments for the messages used
in a component interpolation. Because a component interpolation can be nested,
generateCommentsForFull() uses the ComponentInterpolationNode class to represent
the component interpolation as a tree; each node is a message that may use other
messages.
*/

class ComponentInterpolationNode {
  static fromMessages(messages) {
    const nodesByKey = {};
    const entries = Object.entries(messages);
    for (const [key, value] of entries) {
      if (!(value instanceof PluralForms))
        logThenThrow(messages, 'invalid message');
      nodesByKey[key] = new ComponentInterpolationNode(key, value);
    }
    for (const [key] of entries) {
      if (key !== 'full') {
        const node = nodesByKey[key];
        const [parentKey] = entries.find(([, pluralForms]) =>
          pluralForms[0].includes(`{${key}}`));
        if (parentKey == null) logThenThrow(messages, 'parent not found');
        const parentNode = nodesByKey[parentKey];
        node._parentNode = parentNode;
        parentNode._childNodes.push(node);
      }
    }
    if (!nodesByKey.full.hasChildNodes())
      logThenThrow(messages, 'invalid component interpolation');
    return nodesByKey.full;
  }

  constructor(key, pluralForms) {
    this._parentNode = null;
    this._childNodes = [];
    this._key = key;
    this._pluralForms = pluralForms;
  }

  get parentNode() { return this._parentNode; }
  get childNodes() { return this._childNodes; }
  get key() { return this._key; }
  get pluralForms() { return this._pluralForms; }

  hasChildNodes() { return this._childNodes.length !== 0; }

  visitDescendants(callback) {
    for (const childNode of this._childNodes) {
      callback(childNode);
      childNode.visitDescendants(callback);
    }
  }
}

const generateCommentsForFull = (messages) => {
  const rootNode = ComponentInterpolationNode.fromMessages(messages);
  const comments = { full: '' };

  const commentOnChildNode = (node, expandedMessage) => {
    comments[node.key] = 'This text will be formatted within ODK Central, for example, it might be bold or a link. ';
    comments[node.key] += rootNode.pluralForms.length === 1
      ? `It will be inserted where {${node.key}} is in the following text:`
      // Showing the plural form instead of the singular, because that is what
      // Transifex initially shows for an English string with a plural form.
      : `It will be inserted where {${node.key}} is in the following text. (The plural form of the text is shown.)`;
    comments[node.key] += `\n\n${expandedMessage}`;

    if (node.hasChildNodes()) {
      const messageForChildNodes = expandedMessage.replace(
        `{${node.key}}`,
        node.pluralForms[node.pluralForms.length - 1]
      );
      for (const child of node.childNodes)
        commentOnChildNode(child, messageForChildNodes);
    }
  };
  for (const childNode of rootNode.childNodes) {
    const message = rootNode.pluralForms[rootNode.pluralForms.length - 1];
    commentOnChildNode(childNode, message);
  }

  const commentOnParentNode = (node) => {
    if (comments[node.key] !== '') comments[node.key] += '\n\n';

    if (node.childNodes.length === 1 && !node.childNodes[0].hasChildNodes()) {
      const childNode = node.childNodes[0];
      comments[node.key] += node.parentNode == null
        ? `{${childNode.key}} is a separate string that will be translated below. Its text will be formatted within ODK Central, for example, it might be bold or a link.`
        : `Note that {${childNode.key}} is a separate string that will be translated below.`;
      comments[node.key] += ' ';
      comments[node.key] += childNode.pluralForms.length === 1
        ? `Its text is:\n\n${childNode.pluralForms[0]}`
        : `In its plural form, its text is:\n\n${childNode.pluralForms[1]}`;
    } else {
      comments[node.key] += node.parentNode == null
        ? 'The following are separate strings that will be translated below. They will be formatted within ODK Central, for example, they might be bold or a link.'
        : 'Note that the following are separate strings that will be translated below:';
      comments[node.key] += '\n';
      node.visitDescendants(descendant => {
        comments[node.key] += '\n';
        comments[node.key] += descendant.pluralForms.length === 1
          ? `- {${descendant.key}} has the text: ${descendant.pluralForms[0]}`
          : `- {${descendant.key}} has the plural form: ${descendant.pluralForms[1]}`;
      });

      for (const childNode of node.childNodes)
        if (childNode.hasChildNodes()) commentOnParentNode(childNode);
    }
  };
  commentOnParentNode(rootNode);

  return comments;
};



////////////////////////////////////////////////////////////////////////////////
// JSON CONVERSION

// Converts Vue I18n JSON to Structured JSON, returning an object.
const _restructure = (
  // A simple object, an array, or a PluralForms instance
  value,
  root,
  commentForPath,
  commentForKey,
  commentForFull,
  commentsByKey
) => {
  if (value instanceof PluralForms) {
    const structured = { string: value.toTransifex() };

    if (commentForPath != null) {
      structured.developer_comment = commentForFull != null
        ? `${commentForPath}\n\n${commentForFull}`
        : commentForPath;
    } else if (commentForKey != null) {
      structured.developer_comment = commentForFull != null
        ? `${commentForKey}\n\n${commentForFull}`
        : commentForKey;
    } else if (commentForFull != null) {
      structured.developer_comment = commentForFull;
    }

    return structured;
  }

  // `structured` will be a non-array object, even if `value` is an array:
  // Structured JSON does not seem to support arrays.
  const structured = {};
  const entries = Object.entries(value);
  const commentsForFull = value.full != null
    ? generateCommentsForFull(value)
    : null;
  for (const [k, v] of entries) {
    // If `v` is a linked locale message, validate it, then skip it so that it
    // does not appear in the Structured JSON.
    const linkedPath = v instanceof PluralForms ? pathOfLinkedMessage(v) : null;
    if (linkedPath != null) {
      const dest = getPath(linkedPath, root);
      if (dest == null) {
        // We do not currently support a linked locale message in an i18n custom
        // block that links to another message in the block, but we may very
        // well at some point.
        logThenThrow(value, 'link to message that either does not exist or is in an i18n custom block');
      }
      if (pathOfLinkedMessage(dest) != null) {
        // Supporting this case would add complexity to
        // copyLinkedLocaleMessage().
        logThenThrow(value, 'cannot link to a linked locale message');
      }
      if (value.full != null || Array.isArray(value)) {
        // Supporting these cases would add complexity to
        // deletePartialTranslation(), because then linking to an untranslated
        // message could result in a partial translation, which would then be
        // removed.
        logThenThrow(value, 'linked locale message not allowed in a component interpolation or array element');
      }

      continue; // eslint-disable-line no-continue
    }

    structured[k] = _restructure(
      v,
      root,
      parseComments(value, k).text ?? commentForPath,
      commentsByKey[k] ?? commentForKey,
      commentsForFull != null ? commentsForFull[k] : null,
      commentsByKey
    );

    // Remove an object that only contains linked locale messages.
    if (typeof v === 'object' && Object.keys(structured[k]).length === 0)
      delete structured[k];
  }
  return structured;
};
const restructure = (messages) =>
  _restructure(messages, messages, null, null, null, keyComments(messages));

// Converts Structured JSON to Vue I18n JSON, returning an object where each
// message is a PluralForms object.
const destructure = (json, locale) => JSON.parse(
  json,
  (_, value) => {
    if (value != null && typeof value === 'object' &&
      typeof value.string === 'string')
      return PluralForms.fromTransifex(value.string, locale);
    return value;
  }
);



////////////////////////////////////////////////////////////////////////////////
// @transifexKey

/*
A @transifexKey tag can be used to specify that a message should appear at a
different key in Transifex than the default. This is helpful for maintaining
translations after a component is renamed or in general after a message is
moved. If the Transifex key of a string changes, then Transifex considers it a
new string that requires translation. @transifexKey can be used to prevent that
case, preserving existing translations and their Transifex history.

For messages in en.json5, the default Transifex key is the same as the Vue I18n
key. For messages in components, the default Transifex key is the Vue I18n key
prefixed by "component.[component name].", for example: component.Home.heading.0

@transifexKey can be specified for a single message or for an object or array of
messages.

@transifexKey can also be used to copy translations from one component to
another. In the destination component into which translations are to be copied,
copy the relevant English message(s) from the source component. Above the
messages, use @transifexKey to specify the Transifex key of the messages in the
source component. destructure.js will know to add translations for the messages
to both the source component and the destination component. The messages copied
in the destination component cannot have comments.

Different messages may specify the same @transifexKey. However, they must have
the same text. Only one can specify a Transifex comment, and then only if there
isn't an existing message at the Transifex key.

Functions in this section are passed an argument named transifexPaths, which is
returned by readSourceMessages(). transifexPaths holds all the information about
the @transifexKey tags in use. It maps paths in the source messages to paths in
Transifex. Each path is an array, a key split on '.'.
*/

// Validates transifexPaths. Also adds more information about each path pair,
// mutating transifexPaths.
const processTransifexPaths = (transifexPaths, sourceMessages) => {
  // Returns `true` if the value at the specified key has a comment or if it is
  // an object with a nested comment; otherwise returns `false`. Only examines
  // comments on individual values, not inherited or autogenerated comments.
  const hasComment = (obj, key) => {
    if (parseComments(obj, key).text != null) return true;
    const value = obj[key];
    return !(value instanceof PluralForms) &&
      Object.keys(value).some(k => hasComment(value, k));
  };
  // transifexOnly stores information about paths that will only exist in
  // Transifex (that don't exist in sourceMessages).
  const transifexOnly = new Map();
  for (const pathPair of transifexPaths) {
    const { sourcePath, transifexPath } = pathPair;
    const sourceParent = getPath(sourcePath.slice(0, -1), sourceMessages);
    const sourceHasComment = hasComment(sourceParent, last(sourcePath));
    // Save sourceHasComment for later use.
    pathPair.sourceHasComment = sourceHasComment;

    const valueAtSourcePath = sourceParent[last(sourcePath)];
    const valueAtTransifexPath = getPath(transifexPath, sourceMessages);
    const transifexJoined = transifexPath.join('.');
    if (valueAtTransifexPath == null) {
      const previous = transifexOnly.get(transifexJoined);
      if (previous == null) {
        transifexOnly.set(transifexJoined, {
          value: valueAtSourcePath,
          hasComment: sourceHasComment
        });
      } else {
        if (!equals(valueAtSourcePath, previous.value))
          throw new Error(`@transifexKey ${transifexJoined} specified for multiple, conflicting values`);

        if (sourceHasComment) {
          if (previous.hasComment)
            throw new Error(`@transifexKey ${transifexJoined} specified for multiple values with comments`);
          previous.hasComment = true;
        }
      }
    } else {
      // Because valueAtTransifexPath != null, we know that this is a copy, not
      // a move.

      if (!equals(valueAtTransifexPath, valueAtSourcePath))
        throw new Error(`@transifexKey ${transifexJoined} was specified for a value that conflicts with the existing value at ${transifexJoined}`);
      if (sourceHasComment)
        throw new Error(`@transifexKey ${transifexJoined} was specified for a value with a comment, but there is an existing value at ${transifexJoined}`);
    }
  }

  // Check that @transifexKey does not point to a value that itself specifies
  // @transifexKey or that is nested in an object that specifies @transifexKey.
  for (const { transifexPath } of transifexPaths) {
    for (const { sourcePath } of transifexPaths) {
      if (startsWith(sourcePath, transifexPath)) {
        const joined = transifexPath.join('.');
        throw new Error(`@transifexKey ${joined} was specified, but ${joined} itself specifies @transifexKey`);
      }
    }
  }

  // Check that @transifexKey is not specified for a value that is nested in an
  // object that also specifies @transifexKey. (I'm not sure what the expected
  // behavior would be in that case.)
  for (const { sourcePath } of transifexPaths) {
    for (const { sourcePath: otherPath } of transifexPaths) {
      if (otherPath !== sourcePath && startsWith(otherPath, sourcePath))
        throw new Error(`${sourcePath.join('.')} specifies @transifexKey, but it is in an object that also specifies @transifexKey`);
    }
  }
};

// `structured` is a Structured JSON object returned by restructure().
// rekeySource() will mutate `structured`, applying the path changes specified
// by transifexPaths.
const rekeySource = (structured, transifexPaths) => {
  for (const { sourcePath, transifexPath, sourceHasComment } of transifexPaths) {
    // The same @transifexKey may be specified for multiple values, but only one
    // can have a comment. This `if` ensures that the one with the comment will
    // be moved and won't be overwritten.
    if (!hasPath(transifexPath, structured) || sourceHasComment)
      setPath(transifexPath, getPath(sourcePath, structured), structured);
    deletePath(sourcePath, structured);
  }

  // Re-alphabetize components by name in order to minimize the diff.
  sortProps(structured.component);
};

const rekeyTranslations = (source, translated, transifexPaths) => {
  for (const { sourcePath, transifexPath } of transifexPaths)
    setPath(sourcePath, getPath(transifexPath, translated), translated);
  for (const { transifexPath } of transifexPaths) {
    if (!hasPath(transifexPath, source)) deletePath(transifexPath, translated);
  }
};



////////////////////////////////////////////////////////////////////////////////
// READ SOURCE MESSAGES

// Returns the Vue I18n messages for the source locale after converting them to
// PluralForms objects.
const readSourceMessages = (localesDir, filenamesByComponent) => {
  const reviver = (_, value) =>
    (typeof value === 'string' ? PluralForms.fromVueI18n(value) : value);

  // Read the root messages.
  const messages = parse(
    fs.readFileSync(`${localesDir}/${sourceLocale}.json5`).toString(),
    reviver
  );

  // Read the component messages.
  messages.component = {};
  for (const [componentName, filename] of filenamesByComponent) {
    const content = fs.readFileSync(filename).toString();
    const match = content.match(/<i18n( +lang="json5")? *>/);
    if (match != null) {
      const begin = match.index + match[0].length;
      const end = content.indexOf('</i18n>', begin);
      if (end === -1) logThenThrow(filename, 'invalid single file component');
      // Trimming so that if there is an error, the line number is clear.
      const json = content.slice(begin, end).trim();
      let componentMessages;
      try {
        componentMessages = parse(json, reviver);
      } catch (e) {
        console.error(`could not parse the Vue I18n JSON of ${componentName}`);
        throw e;
      }

      messages.component[componentName] = componentMessages[sourceLocale];
      // Move top-level comments on the component.
      const comments = componentMessages[Symbol.for(`before:${sourceLocale}`)];
      if (comments != null)
        messages.component[Symbol.for(`before:${componentName}`)] = comments;
    }
  }

  // Walk `messages`, doing some basic validation and parsing @transifexKey
  // tags.
  const entries = [[[], messages]];
  const transifexPaths = [];
  while (entries.length !== 0) {
    const [path, value] = entries.pop();
    if (value == null || typeof value !== 'object')
      logThenThrow({ path, value }, 'invalid value');
    for (const [k, v] of Object.entries(value)) {
      const p = [...path, k];
      const { transifexKey } = parseComments(value, k);
      if (transifexKey != null)
        transifexPaths.push({ sourcePath: p, transifexPath: transifexKey });
      if (!(v instanceof PluralForms)) entries.push([p, v]);
    }
  }

  processTransifexPaths(transifexPaths, messages);
  return { messages, transifexPaths };
};



////////////////////////////////////////////////////////////////////////////////
// WRITE TRANSLATIONS

// Stores a source message with the corresponding translation.
class Translation {
  constructor(parent, key) {
    this.parent = parent;
    this.key = key;
    this.source = parent._source[key];
  }

  get root() { return this.parent.root; }
  get path() { return [...this.parent.path, this.key]; }

  // `translated` returns either a PluralForms object or `null`. The result is
  // an empty PluralForms object for an untranslated message and `null` for a
  // message that does not exist in Transifex at all (because it is a linked
  // locale message). `translated` is "live": if the translation changes in the
  // parent, it will change here as well.
  get translated() { return this.parent._translated[this.key]; }

  toJSON() {
    return !this.translated.isEmpty() ? this.translated.toVueI18n() : undefined;
  }
}

/*
A `Translations` object is a tree whose structure mirrors the source Vue I18n
JSON. It stores source messages along with the corresponding translations.
`Translations` is used to:

  - walk the source messages and translations in parallel
  - modify the translations
  - output the Vue I18n JSON for the translations
*/
class Translations {
  // `source` is either a non-array object or an array. `translated` is always
  // a non-array object: Structured JSON does not seem to support arrays.
  constructor(parent, key, source, translated) {
    this.parent = parent;
    this.key = key;
    if (source == null || typeof source !== 'object')
      logThenThrow(source, 'invalid source');
    this._source = source;
    if (translated == null || typeof translated !== 'object')
      logThenThrow(translated, 'invalid translated');
    this._translated = translated;
    this.size = Object.keys(source).length;
  }

  get root() { return this.parent == null ? this : this.parent.root; }

  get path() {
    return this.parent == null ? [] : [...this.parent.path, this.key];
  }

  isArray() { return Array.isArray(this._source); }

  // Returns either a single translation or another `Translations` object. In
  // either case, the result is "live": a change to this node will be reflected
  // in its children.
  get(key) {
    const sourceValue = this._source[key];
    if (sourceValue == null) return undefined;
    if (sourceValue instanceof PluralForms)
      return new Translation(this, key.toString());
    if (this._translated[key] == null) this._translated[key] = {};
    return new Translations(
      this,
      key.toString(),
      sourceValue,
      this._translated[key]
    );
  }

  has(key) { return this._source[key] != null; }

  // Sets a single translation.
  set(key, translated) {
    if (!(this._source[key] instanceof PluralForms))
      logThenThrow(key, 'invalid key');
    if (!(translated instanceof PluralForms))
      logThenThrow(translated, 'invalid translated');
    this._translated[key] = translated;
    return this;
  }

  // Removes one or more translations.
  delete(key) {
    const value = this._translated[key];
    if (value == null) return;
    if (value instanceof PluralForms)
      this._translated[key] = PluralForms.empty(value.length);
    else
      this.get(key).clear();
  }

  clear() {
    for (const key of Object.keys(this._translated))
      this.delete(key);
  }

  // Visit each translation.
  walk(callbacks) {
    if (typeof callbacks === 'function') {
      this.walk([callbacks]);
      return;
    }

    for (const key of Object.keys(this._source)) {
      const value = this.get(key);
      if (value instanceof Translation) {
        for (const callback of callbacks)
          callback(value);
      } else {
        value.walk(callbacks);
      }
    }
  }

  toJSON(key) {
    if (this.isArray()) {
      const result = [];
      for (let i = 0; i < this.size; i += 1) {
        const value = this.get(i).toJSON(i.toString());
        // Because of logic below, `value` can be `undefined` only if
        // this.get(i) is a Translation object.
        if (value === undefined) {
          // If we were to add `value` to `result`, `result` would become a
          // sparse array, which JSON does not support. Instead, we stop adding
          // to `result` here. As a result, the length of the translated array
          // will differ from the length of the source array. See
          // deletePartialTranslation() for related comments.
          break;
        }
        result.push(value);
      }
      const anyPresent = result.some(value => typeof value === 'string' ||
        Object.keys(value).length !== 0);
      if (!anyPresent) {
        // There are no translations to return. If possible, we return
        // `undefined` in order to minimize the JSON. However, we return an
        // empty array if the parent object is an array in order to prevent the
        // parent object from becoming a sparse array.
        return /^\d+$/.test(key) ? [] : undefined;
      }
      return result;
    }

    const result = {};
    for (const k of Object.keys(this._translated)) {
      const value = this.get(k).toJSON(k);
      if (value != null) result[k] = value;
    }
    return Object.keys(result).length !== 0 || /^\d+$/.test(key)
      ? result
      : undefined;
  }
}

// If a linked locale message links to a message that does not exist in the
// user's locale, then in some cases, Vue I18n does not fall back to the message
// in the fallback locale. Because of that, we copy a linked locale message only
// if the message it links to is translated.
const copyLinkedLocaleMessage = ({ source, root, parent, key }) => {
  const path = pathOfLinkedMessage(source);
  if (path == null) return;
  const translationLinkedTo = path.reduce((node, k) => node.get(k), root);
  if (!translationLinkedTo.translated.isEmpty()) parent.set(key, source);
};

const verifyDestructure = ({ source, translated }) => {
  if (translated == null || !equals(Array.from(source), Array.from(translated)))
    logThenThrow({ source, translated }, 'mismatch for source locale');
};

/*
If a component interpolation is only partially translated, we remove the partial
translation so that the resulting text is not a mix of locales. For example:

{
  "en": {
    "introduction": [
      {
        "full": "Click {here}.",
        "here": "here"
      }
    ]
  },
  "es": {
    "introduction": [
      {
        // Since this message is untranslated, the entire component
        // interpolation will be removed.
        "full": "",
        "here": "aquí"
      }
    ]
  }
}

If one of the elements of an array is an untranslated message, we also remove
the subsequent translations, because JSON does not support sparse arrays. For
example:

{
  "en": {
    "introduction": [
      "one",
      "two",
      "three"
    ]
  },
  "es": {
    "introduction": [
      "uno",
      // Since this message is untranslated, "tres" will be removed.
      "",
      "tres"
    ]
  }
}

If https://github.com/kazupon/vue-i18n/issues/563 is implemented, we might not
need to discard the subsequent translations.
*/
const deletePartialTranslation = ({ translated, parent, key }) => {
  if (translated != null && translated.isEmpty()) {
    if (parent.has('full')) {
      parent.clear();
    } else if (parent.isArray()) {
      for (let i = Number.parseInt(key, 10) + 1; i < parent.size; i += 1)
        parent.delete(i);
    }
  }
};

const validateTranslation = (locale) => ({ source, translated, path }) => {
  if (translated == null) return;
  // Our Transifex translation checks should prevent these possibilities.
  if (locales[locale].pluralCategories.length !== 1 &&
    (source.length !== 1) !== (translated.length !== 1))
    logThenThrow({ source, translated }, 'pluralization mismatch');
  if (!translated.isEmpty() &&
    !equals(parseVars(source[0]), parseVars(translated[0])))
    logThenThrow({ source, translated }, 'translation must use the same variables as the source message');

  for (let i = 0; i < translated.length; i += 1) {
    // Check for a linked locale message. (I don't see an easy way to set up a
    // Transifex translation check for this.)
    if (translated[i].includes('@:') && translated[i] !== source[i])
      logThenThrow({ source, translated }, 'unexpected linked locale message');

    if (locales[locale].warnVariableSeparator) {
      const noSeparator = '[^\\] !"\'(),./:;<>?[’“”„–—-]';
      if (new RegExp(`${noSeparator}\\{|\\}${noSeparator}`, 'u').test(translated[i])) {
        console.warn(`warning: ${path.join('.')}: variable without separator.`);
      }
    }
  }
};

// Writes the translations for the specified locale.
const writeTranslations = (
  locale,
  source,
  translated,
  localesDir,
  filenamesByComponent
) => {
  if (locales[locale] == null) throw new Error(`unknown locale ${locale}`);

  const translations = new Translations(null, null, source, translated);

  // Instead of overwriting the source messages, here we check that
  // destructuring the restructured source messages results in the original
  // source messages again. If this fails, then there may be an issue with
  // restructure.js or destructure.js.
  if (locale === sourceLocale) {
    translations.walk([copyLinkedLocaleMessage, verifyDestructure]);
    return;
  }

  translations.walk(deletePartialTranslation);
  // Walking twice so that we copy a linked locale message only if
  // deletePartialTranslation won't delete it.
  translations.walk([copyLinkedLocaleMessage, validateTranslation(locale)]);

  const translationsByComponent = translations.get('component');
  const autogenerated = {
    open: '<!-- Autogenerated by destructure.js -->\n<i18n>\n',
    close: '\n</i18n>\n'
  };
  // We escape '<' in an i18n custom block in order to avoid an ESLint
  // vue/no-parsing-error: see https://github.com/kazupon/vue-i18n/issues/977
  const escapeJSON = (json) => json.replace(/</g, '\\u003c');
  for (const [componentName, filename] of filenamesByComponent) {
    const translationsForComponent = translationsByComponent.get(componentName);
    if (translationsForComponent == null)
      continue; // eslint-disable-line no-continue

    const content = fs.readFileSync(filename).toString();
    const begin = content.indexOf(autogenerated.open);
    if (begin === -1) {
      // This may throw an error, so we run it before using `fs`.
      const json = JSON.stringify(
        { [locale]: translationsForComponent },
        null,
        2
      );
      if (json !== '{}') {
        fs.appendFileSync(filename, '\n');
        fs.appendFileSync(filename, autogenerated.open);
        fs.appendFileSync(filename, escapeJSON(json));
        fs.appendFileSync(filename, autogenerated.close);
      }
    } else {
      const end = content.indexOf(autogenerated.close, begin);
      if (end === -1)
        logThenThrow(filename, 'autogenerated i18n custom block is invalid');
      if (end + autogenerated.close.length !== content.length)
        logThenThrow(filename, 'content found after autogenerated i18n custom block');
      const blockMessages = JSON.parse(
        content.slice(begin + autogenerated.open.length, end)
      );

      blockMessages[locale] = translationsForComponent;
      sortProps(blockMessages);

      // Trim in case there are no translations and we remove the block.
      fs.writeFileSync(filename, content.slice(0, begin).trimEnd());
      fs.appendFileSync(filename, '\n');
      const json = JSON.stringify(blockMessages, null, 2);
      if (json !== '{}') {
        fs.appendFileSync(filename, '\n');
        fs.appendFileSync(filename, autogenerated.open);
        fs.appendFileSync(filename, escapeJSON(json));
        fs.appendFileSync(filename, autogenerated.close);
      }
    }
  }

  translations.delete('component');
  fs.writeFileSync(
    `${localesDir}/${locale}.json`,
    JSON.stringify(translations, null, 2)
  );
};



////////////////////////////////////////////////////////////////////////////////
// EXPORT

module.exports = {
  sourceLocale,
  restructure, destructure,
  rekeySource, rekeyTranslations,
  readSourceMessages,
  writeTranslations
};
