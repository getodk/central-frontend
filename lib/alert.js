/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

/*
A component that is the parent of an Alert component must define a data property
named 'alert' containing the alert's underlying data as an object. The object
must have the following properties:

  - state. true if the alert is visible and false if not.
  - type. The alert's "contextual" type: 'success', 'info', 'warning', or
    'danger'.
  - message. The message to display.
  - at. The time at which the alert's data object was created.
*/

// Returns a data object for a new visible alert that is not blank.
export const newAlert = (type, message) => ({
  state: true,
  type,
  message,
  at: new Date()
});

// Returns a data object for a new blank alert.
export const blankAlert = (type = 'danger') => ({
  state: false,
  type,
  message: null,
  at: new Date()
});

/*
ComponentAlert provides read/write access to a component's alert data object.
Setters like success(), info(), and blank() replace the alert data object rather
than updating its properties in-place, at least in part in order to trigger any
watcher on the component's `alert` data property. (A change to an object's
property does not trigger a watcher on the object itself.)

Updating a component's alert data object using $alert(), which returns a
ComponentAlert, is also a little less verbose than updating it using newAlert()
or blankAlert(). For example:

  // Using $alert()
  this.$alert().success('The form was created successfully.');

  // Using newAlert()
  component.alert = newAlert('success', 'The form was created successfully');
*/
export class ComponentAlert {
  constructor(component) {
    this._component = component;
  }

  get state() { return this._component.alert.state; }
  get type() { return this._component.alert.type; }
  get message() { return this._component.alert.message; }
  get at() { return this._component.alert.at; }

  success(message) { this._component.alert = newAlert('success', message); }
  info(message) { this._component.alert = newAlert('info', message); }
  warning(message) { this._component.alert = newAlert('warning', message); }
  danger(message) { this._component.alert = newAlert('danger', message); }

  blank(type = undefined) { this._component.alert = blankAlert(type); }
}

// For a given component, returns the component if it has an alert property,
// otherwise traverses up through the component's ancestors in the component
// tree, returning the component's closest ancestor with an alert property.
export const closestComponentWithAlert = (component) => {
  if ('alert' in component) return component;
  // If the component's root element is itself a component, and that component
  // has an alert property, return that component. For example, that would be
  // the case for a component whose root element is a <modal>.
  if (component.$children.length === 1) {
    const child = component.$children[0];
    if (child.$el === component.$el && 'alert' in child) return child;
  }
  for (let ancestor = component.$parent; ancestor != null; ancestor = ancestor.$parent)
    if ('alert' in ancestor) return ancestor;
  return null;
};

// Traverses up through a component's ancestors in the component tree, hiding
// each ancestor's alert (if it has one).
export const hideAncestorAlerts = (component) => {
  for (let ancestor = component.$parent; ancestor != null; ancestor = ancestor.$parent)
    if ('alert' in ancestor) ancestor.alert.state = false;
};
