// /**
//  * @see
//  * {@link https://github.com/getodk/javarosa/blob/9ae47965ce740d386c09048baf44de101048c977/src/test/java/org/javarosa/core/test/Scenario.java#L334 | JavaRosa `AnswerResult`}
//  *
//  * The name differs because:
//  *
//  * - `Result` can imply the algebraic data type often named the same; while
//  *   there's conceptual overlap, it isn't (currently) used that way here.
//  * - `Answer` (as in "question") may imply user-facing questions, but the
//  *   validity state here may apply to <bind>s with no <body> element.
//  *
//  * Includes an additional enum value for parent nodes' validity, as derived from
//  * the validity states of their children.
//  */
// // prettier-ignore
// export type NodeStateValidity =
// 	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
// 	| 'OK'
// 	| 'REQUIRED_BUT_EMPTY'
// 	| 'CONSTRAINT_VIOLATED'
// 	| 'CHILD_INVALID';
