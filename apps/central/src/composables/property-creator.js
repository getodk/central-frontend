import { reactive } from 'vue';

class PropertyCreator {
  #created;

  constructor(request) {
    this.#request = request;
    // An array of the names of properties that have been created via the
    // request() method since the last clear()
    this.#created = reactive(new Set());
    this.created = readonly(this.#created);
  }

  clear() { this.#created.clear(name); }

  // TODO. Define duplicateFields.
  async request(url, names, duplicateFields) {
    if (names == null) return;
    for (const name of names) {
      if (this.#created.has(name)) continue; // eslint-disable-line no-continue
      await request({ // eslint-disable-line no-await-in-loop
        method: 'POST',
        url,
        data: { name },
        // If the property has already been created somehow, that's not an
        // issue. We can just ignore the Problem response.
        fullfillProblem: ({ code, details }) => code === 409.3 &&
          equals(details.fields, ['projectId', 'name'])
      });
      this.#created.add(name);
    }
  }
}

export default (request) => new PropertyCreator(request);
