const fs = require('fs');
const { equals } = require('ramda');
// eslint-disable-next-line import/no-extraneous-dependencies
const { parse } = require('comment-json');

const { logThenThrow } = require('./util');

const sourceLocale = 'en';



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
  static fromTransifex(string) {
    const icuMatch = string.match(/^({count, plural,).+}$/);
    const forms = [];
    if (icuMatch == null) {
      forms.push(string);
    } else {
      for (let begin = icuMatch[1].length; begin < string.length - 1;) {
        // Using a single RegExp along with lastIndex might be more efficient.
        const formMatch = string.slice(begin).match(/^ [a-z]+ {/);
        if (formMatch == null) logThenThrow(string, 'invalid plural');
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
      if (!equals(parseVars(forms[i]), vars))
        logThenThrow(forms, 'plural forms must use the same variables in each form');
      this[i] = forms[i];
    }
    this.length = forms.length;
  }

  isEmpty() {
    for (let i = 0; i < this.length; i += 1) {
      if (this[i] !== '') return false;
    }
    return true;
  }

  toVueI18n() {
    for (let i = 0; i < this.length; i += 1) {
      if (this[i].includes('|')) logThenThrow(this, 'unexpected |');
    }
    return Array.from(this).join(' | ');
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

const pathOfLinkedMessage = (pluralForms) => {
  if (pluralForms.length !== 1) return null;
  const match = pluralForms[0].match(/^@:([\w.]+)$/);
  return match != null ? match[1].split('.') : null;
};



////////////////////////////////////////////////////////////////////////////////
// JSON CONVERSION

// Generates comments related to component interpolation.
const generateCommentForFull = (obj, key) => {
  const { full } = obj;
  if (full == null) return null;
  if (!(full instanceof PluralForms))
    logThenThrow(full, 'invalid full property');

  if (key !== 'full') {
    return full.length === 1
      ? `This text will be formatted within ODK Central, for example, it might be bold or a link. It will be inserted where {${key}} is in the following text:\n\n${full[0]}`
      // Showing the plural form instead of the singular, because that is what
      // Transifex initially shows for an English string with a plural form.
      : `This text will be formatted within ODK Central, for example, it might be bold or a link. It will be inserted where {${key}} is in the following text. (The plural form of the text is shown.)\n\n${full[1]}`;
  }

  const siblings = Object.entries(obj).filter(([k, v]) => {
    if (k === 'full') return false;
    if (!(v instanceof PluralForms)) logThenThrow(obj, 'invalid sibling');
    return true;
  });
  if (siblings.length === 0) logThenThrow(obj, 'sibling not found');

  if (siblings.length === 1) {
    const [k, forms] = siblings[0];
    return forms.length === 1
      ? `{${k}} is a separate string that will be translated below. Its text will be formatted within ODK Central, for example, it might be bold or a link. Its text is:\n\n${forms[0]}`
      : `{${k}} is a separate string that will be translated below. Its text will be formatted within ODK Central, for example, it might be bold or a link. In its plural form, its text is:\n\n${forms[1]}`;
  }

  const joined = siblings
    .map(([k, forms]) => (forms.length === 1
      ? `- {${k}} has the text: ${forms[0]}`
      : `- {${k}} has the plural form: ${forms[1]}`))
    .join('\n');
  return `The following are separate strings that will be translated below. They will be formatted within ODK Central, for example, they might be bold or a link.\n\n${joined}`;
};

// Converts Vue I18n JSON to structured JSON, returning an object.
const _restructure = (
  value,
  commentsByKey,
  commentForPath,
  commentForKey,
  commentForFull
) => {
  if (value == null) throw new Error('invalid value');

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

  if (typeof value !== 'object') throw new Error('invalid value');

  // `structured` will be a non-array object, even if `value` is an array: it
  // seems that structured JSON does not support arrays.
  const structured = {};
  const entries = Object.entries(value);
  for (const [k, v] of entries) {
    // Skip linked locale messages.
    if (v instanceof PluralForms && pathOfLinkedMessage(v) != null)
      continue; // eslint-disable-line no-continue

    const comments = value[Symbol.for(`before:${k}`)];
    structured[k] = _restructure(
      v,
      commentsByKey,
      comments != null
        ? comments.map(comment => comment.value.trim()).join(' ')
        : commentForPath,
      commentsByKey[k] != null ? commentsByKey[k] : commentForKey,
      generateCommentForFull(value, k)
    );

    // Remove an object that only contains linked locale messages.
    if (typeof v === 'object' && Object.keys(structured[k]).length === 0)
      delete structured[k];
  }
  return structured;
};
const restructure = (messages) => {
  const commentsByKey = {};
  for (const { value } of messages[Symbol.for('before-all')]) {
    const match = value.trim().match(/^(\w+):[ \t]*(.+)$/);
    // eslint-disable-next-line prefer-destructuring
    if (match != null) commentsByKey[match[1]] = match[2];
  }

  return _restructure(messages, commentsByKey, null, null, null);
};

// Converts structured JSON to Vue I18n JSON, returning an object where each
// message is a PluralForms object.
const destructure = (json) => JSON.parse(
  json,
  (_, value) => {
    if (value != null && typeof value === 'object' &&
      typeof value.string === 'string')
      return PluralForms.fromTransifex(value.string);
    return value;
  }
);



////////////////////////////////////////////////////////////////////////////////
// READ SOURCE MESSAGES

// Returns the Vue I18n messages for the source locale after converting them to
// PluralForms objects.
const readSourceMessages = (localesDir, filenamesByComponent) => {
  // Read the root messages.
  const reviver = (key, value) => {
    if (typeof value === 'string') return PluralForms.fromVueI18n(value);
    if (key === 'full') {
      // `value` will be an array if $tcPath() is used.
      if (!Array.isArray(value)) logThenThrow(value, 'invalid full property');
      return new PluralForms(value.map(pluralForms => {
        if (pluralForms.length !== 1)
          logThenThrow(value, 'invalid full property');
        return pluralForms[0];
      }));
    }
    return value;
  };
  const messages = parse(
    fs.readFileSync(`${localesDir}/${sourceLocale}.json`).toString(),
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
      try {
        messages.component[componentName] = parse(json, reviver)[sourceLocale];
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`could not parse the Vue I18n JSON of ${componentName}`);
        throw e;
      }
    }
  }

  return messages;
};



////////////////////////////////////////////////////////////////////////////////
// WRITE TRANSLATIONS

// Stores a source message with the corresponding translation.
class Translation {
  constructor(parent, key) {
    this.parent = parent;
    this._key = key;
    this.source = parent._source[key];
  }

  get root() { return this.parent.root; }

  // The translation is "live": if it changes in the parent, it will change here
  // as well.
  get translated() { return this.parent._translated[this._key]; }

  toJSON(key) {
    if (this.translated.isEmpty()) return undefined;
    return key === 'full' && this.translated.length !== 1
      ? Array.from(this.translated)
      : this.translated.toVueI18n();
  }
}

// `Translations` stores an object of source messages with the corresponding
// translations. It provides methods to modify the translations.
class Translations {
  constructor(parent, key, source, translated) {
    this.parent = parent;
    this._key = key;
    if (source == null || typeof source !== 'object')
      logThenThrow(source, 'invalid source');
    this._source = source;
    if (translated == null || typeof translated !== 'object')
      logThenThrow(translated, 'invalid translated');
    this._translated = translated;
    this.size = Object.keys(source).length;
  }

  get root() { return this.parent == null ? this : this.parent.root; }

  // Returns a translation or another set of translations. In either case, the
  // result is "live": a change to this node will be reflected in its children.
  get(key) {
    const sourceValue = this._source[key];
    if (sourceValue == null) return undefined;
    if (sourceValue instanceof PluralForms) return new Translation(this, key);
    if (this._translated[key] == null) this._translated[key] = {};
    return new Translations(this, key, sourceValue, this._translated[key]);
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

  // Removes a translation or set of translations.
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
          callback(key, value);
      } else {
        value.walk(callbacks);
      }
    }
  }

  toJSON(key) {
    const keyIsIndex = /^\d+$/.test(key);

    if (this.has('0')) {
      const result = [];
      let emptyPluralForms = 0;
      let emptyObjects = 0;
      for (let i = 0; i < this.size; i += 1) {
        const k = i.toString();
        if (!this.has(k))
          logThenThrow(this, 'error converting object to array');
        const value = this.get(k).toJSON(k);
        result.push(value);
        if (value === undefined)
          emptyPluralForms += 1;
        else if (Object.keys(value).length === 0)
          emptyObjects += 1;
      }
      if (emptyPluralForms + emptyObjects === this.size) {
        // `this` has only empty translations. If possible, we return
        // `undefined` so that there is not an empty array in the JSON. However,
        // we do not return `undefined` if doing so would result in a sparse
        // array: JSON does not support sparse arrays.
        return keyIsIndex ? [] : undefined;
      }
      if (emptyPluralForms !== 0) logThenThrow(this, 'sparse array');
      return result;
    }

    const result = {};
    for (const k of Object.keys(this._translated)) {
      const value = this.get(k).toJSON(k);
      if (value != null) result[k] = value;
    }
    return Object.keys(result).length !== 0 || keyIsIndex ? result : undefined;
  }
}

// This will not work for a linked locale message in an i18n custom block, but
// we do not use those yet.
const copyLinkedLocaleMessage = (key, { source, parent }) => {
  const path = pathOfLinkedMessage(source);
  if (path == null) return;
  let linked = parent.root;
  for (let i = 0; linked != null && i < path.length; i += 1)
    linked = linked.get(path[i]);
  if (linked != null && linked.translated != null) parent.set(key, source);
};

const verifyDestructure = (_, { source, translated }) => {
  if (translated == null || !equals(Array.from(source), Array.from(translated)))
    logThenThrow({ source, translated }, 'mismatch for source locale');
};

// If a component interpolation is only partially translated, we remove the
// partial translation so that the resulting text is not a mix of locales. We
// also remove an array that is missing a translation, because JSON does not
// support sparse arrays.
const deletePartialTranslation = (key, { source, translated, parent }) => {
  if (parent.has('full') || parent.has('0')) {
    // Linked locale message
    if (translated == null) logThenThrow(source, 'not supported');
    if (translated.isEmpty()) parent.clear();
  }
};

const validateTranslation = (_, { source, translated }) => {
  if ((source.length !== 1) !== (translated.length !== 1))
    logThenThrow({ source, translated }, 'pluralization mismatch');
  if (!translated.isEmpty() &&
    !equals(parseVars(source[0]), parseVars(translated[0])))
    logThenThrow({ source, translated }, 'translation must use the same variables as the source message');
};

// Writes the translations for the specified locale.
const writeTranslations = (
  locale,
  source,
  translated,
  localesDir,
  filenamesByComponent
) => {
  const translations = new Translations(null, null, source, translated);

  if (locale === sourceLocale) {
    translations.walk([copyLinkedLocaleMessage, verifyDestructure]);
    return;
  }

  translations.walk(deletePartialTranslation);
  // Walking twice so that we copy a linked locale message only if
  // deletePartialTranslation won't delete it.
  translations.walk([copyLinkedLocaleMessage, validateTranslation]);

  const translationsByComponent = translations.get('component');
  const autogenerated = {
    open: '<!-- Autogenerated by destructure.js -->\n<i18n>\n',
    close: '\n</i18n>\n'
  };
  // Needed to prevent an ESLint vue/no-parsing-error.
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
      fs.appendFileSync(filename, '\n');
      fs.appendFileSync(filename, autogenerated.open);
      fs.appendFileSync(escapeJSON(json));
      fs.appendFileSync(filename, autogenerated.close);
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
      // Position the new locale alphabetically.
      for (const key of Object.keys(blockMessages).sort()) {
        const value = blockMessages[key];
        delete blockMessages[key];
        blockMessages[key] = value;
      }

      const json = JSON.stringify(blockMessages, null, 2);
      fs.writeFileSync(filename, content.slice(0, begin));
      fs.appendFileSync(filename, autogenerated.open);
      fs.appendFileSync(filename, escapeJSON(json));
      fs.appendFileSync(filename, autogenerated.close);
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
  restructure,
  destructure,
  readSourceMessages,
  writeTranslations
};
