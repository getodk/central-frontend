import PreferenceNormalizer from './normalizer';

// The SitePreferenceNormalizer and ProjectPreferenceNormalizer classes are used to:
//  a)  verify that the preference key has been declared here.
//      Such might seem persnickety, but it allows us to have a central
//      registry of which keys are in use.
//  b)  normalize the value as per the normalization function with the name
//      of the preference. This also allows supplying a default.
//      Preferences serverside may have been created by some frontend version that
//      used different semantics (different values, perhaps differently typed).
//      Writing a validator function here makes it so one does not have to be defensive
//      for that eventuality in *every single usage site of the setting*.
//
// As such, any newly introduced preference will need a normalization function added
// to one of those classes, even if it's just a straight passthrough.
// Furthermore, the answer to "why can't I set an arbitrary value for a certain preference"
// can be found there.


export class SitePreferenceNormalizer extends PreferenceNormalizer {
  static projectSortMode(val) {
    return ['alphabetical', 'latest', 'newest'].includes(val) ? val : 'latest';
  }
}

export class ProjectPreferenceNormalizer extends PreferenceNormalizer {
  static formTrashCollapsed(val) {
    return val === true;
  }
}
