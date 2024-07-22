/// <reference types="tree-sitter-cli/dsl" />

/*
 * ----------------------------------------------------------------------------
 * Grammar helper functions
 * ----------------------------------------------------------------------------
 */

const binaryExpression = <
	ExpressionType extends `${string}_expr`,
	OperatorName extends `${string}_operator`,
	OperandName extends `${string}_expr`,
>(
	baseType: SymbolRule<ExpressionType>,
	operator: RuleOrLiteral | SymbolRule<OperatorName>,
	operand: SymbolRule<OperandName>
): Rule => choice(seq(baseType, operator, operand), operand);

/*
 * ----------------------------------------------------------------------------
 * Grammar patterns and subpatterns
 * ----------------------------------------------------------------------------
 */

const UNQUALIFIED_NAME_START_CHAR =
	/[_a-zA-Z\u{C0}-\u{D6}\u{D8}-\u{F6}\u{F8}-\u{2FF}\u{370}-\u{37D}\u{37F}-\u{1FFF}\u{200C}-\u{200D}\u{2070}-\u{218F}\u{2C00}-\u{2FEF}\u{3001}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFFD}\u{10000}-\u{EFFFF}]/u;

// eslint-disable-next-line no-misleading-character-class -- this is per spec
const NAME_CHAR_ADDITIONS = /[-.\u{B7}0-9\u{0300}-\u{036F}\u{203F}-\u{2040}]/u;

// The above subpatterns are spec-defined. They're combined here so tree-sitter
// matches the full pattern without error.
const NC_NAME = new RegExp(
	// eslint-disable-next-line no-misleading-character-class
	[
		UNQUALIFIED_NAME_START_CHAR.source,
		'(?:',
		UNQUALIFIED_NAME_START_CHAR.source,
		'|',
		NAME_CHAR_ADDITIONS.source,
		')*',
	].join(''),
	'u'
);

/**
 * Except where noted otherwise, this grammar's rules are derived as directly as
 * possible from the
 * {@link https://www.w3.org/TR/1999/REC-xpath-19991116/ | XPath 1.0} spec, and
 * pertinent specs referenced by it.
 *
 * Rules prefixed by `_` are considered "hidden" by tree-sitter, i.e. they don't
 * produce nodes in a parsed syntax tree unless they have no named/non-hidden
 * children. The decision to hide a rule is arbitrary, generally guided by which
 * rules are expected to correspond to semantically meaningful/useful syntax
 * tree nodes for parsing/highlighting/etc.
 * @see
 * {@link https://tree-sitter.github.io/tree-sitter/creating-parsers#hiding-rules | Hiding Rules}
 */
const xpathGrammar = grammar({
	name: 'xpath',

	inline: ($) => [$._axis_specifier, $._local_part, $._prefix, $._axis_name],

	word: ($) => $._nc_name,

	rules: {
		xpath: ($) => $.expr,

		/* --- definitions from XPath 1.0 spec --- */

		/* 1 Introduction - no grammar rules in spec */

		/* 2 Location Paths */

		_location_path: ($) => choice($.relative_location_path, $.absolute_location_path),

		absolute_location_path: ($) =>
			choice(
				seq($.absolute_root_location_path, optional($._relative_location_path)),
				$.abbreviated_absolute_location_path
			),

		absolute_root_location_path: ($) => $._slash,

		relative_location_path: ($) => $._relative_location_path,

		_relative_location_path: ($) =>
			choice(
				$.step,
				seq($._relative_location_path, $._slash, $.step),
				$._abbreviated_relative_location_path
			),

		/* 2.1 Location Steps */

		step: ($) =>
			choice(
				// NodeTest, which may have an [abbreviated] axis specifier prefix
				seq(choice($.axis_test, $.abbreviated_axis_test, $.node_test), repeat($.predicate)),

				// . or ..
				$.abbreviated_step
			),

		axis_test: ($) => seq($._axis_specifier, $._node_test),
		abbreviated_axis_test: ($) => seq($._abbreviated_axis_specifier, $._node_test),

		/**
		 * This should include `_abbreviated_axis_specifier` choice, which is
		 * defined as optional according to the XPath 1.0 grammar. Strictly
		 * following the spec, tree-sitter (rightly) complains that it would match
		 * an empty string. Instead, we've defined its equivalent optionality
		 * directly in `step`.
		 */
		_axis_specifier: ($) => choice(seq($.axis_name, /::/)),

		/* 2.2 Axes */

		axis_name: ($) => $._axis_name,
		_axis_name: () =>
			choice(
				/ancestor/,
				/ancestor-or-self/,
				/attribute/,
				/child/,
				/descendant/,
				/descendant-or-self/,
				/following/,
				/following-sibling/,
				/namespace/,
				/parent/,
				/preceding/,
				/preceding-sibling/,
				/self/
			),

		/* 2.3 Node Tests */

		node_test: ($) => $._node_test,
		_node_test: ($) =>
			choice(
				$._name_test,

				// This is implicit in the spec's grammar notation, but reflects parts of
				// the details on disambiguation (and helps tree-sitter with same).
				alias($._axis_name, $.unprefixed_name),

				$.node_type_test,
				$.processing_instruction_name_test
			),

		// Spec explicitly calls this case out, though not by name
		processing_instruction_name_test: ($) =>
			seq(/processing-instruction\s*\(/, $.string_literal, /\)/),

		/* 2.4 Predicates */

		predicate: ($) => seq(/\[/, $._predicate_expr, /\]/),

		_predicate_expr: ($) => $.expr,

		/* 2.5 Abbreviated Syntax */

		abbreviated_absolute_location_path: ($) =>
			seq(
				// TODO: name this (and other uses)?
				token('//'),
				$._relative_location_path
			),

		_abbreviated_relative_location_path: ($) => seq($._relative_location_path, token('//'), $.step),

		abbreviated_step: ($) =>
			choice(
				alias(
					'.',
					// @ts-expect-error - This is what tree-sitter expects for named aliases
					// which do not correspond to an explicit rule. TODO: maybe they can be
					// explicit rules?
					$.self
				),
				alias(
					'..',
					// @ts-expect-error - This is what tree-sitter expects for named aliases
					// which do not correspond to an explicit rule. TODO: maybe they can be
					// explicit rules?
					$.parent
				)
			),

		/**
		 * Should be `optional('@')`, but tree-sitter objects (probably rightly) that it
		 * matches the empty string. Its optionality is pushed up to `step`.
		 */
		_abbreviated_axis_specifier: () => '@',

		/* 3 Expressions */

		/* 3.1 Basics */

		expr: ($) => $._expr,
		_expr: ($) => $._or_expr,

		_primary_expr: ($) =>
			choice(
				$.variable_reference,
				seq(/\(/, $.expr, /\)/),
				$.string_literal,
				$.number,
				$.function_call
			),

		/* 3.2 Function Calls */

		function_call: ($) =>
			seq(
				field('name', $.function_name),
				seq(/\(/, field('arguments', optional(seq($.argument, repeat(seq(/,/, $.argument))))), /\)/)
			),

		function_name: ($) => $._q_name,
		argument: ($) => $.expr,

		/* 3.3 Node-sets */

		union_expr: ($) => prec(1, binaryExpression($._union_expr, /\|/, $._path_expr)),

		_union_expr: ($) => prec(2, choice($.union_expr, $._path_expr)),

		_path_expr: ($) => choice($._location_path, $.filter_path_expr),

		_slash: () => token('/'),

		filter_path_expr: ($) => $._filter_path_expr,

		_filter_path_expr: ($) =>
			seq($.filter_expr, optional(seq(choice($._slash, token('//')), $._relative_location_path))),

		filter_expr: ($) => $._filter_expr,

		_filter_expr: ($) => choice($._primary_expr, seq($._filter_expr, $.predicate)),

		/* 3.4 Booleans */

		or_expr: ($) => prec(1, binaryExpression($._or_expr, /or/, $._and_expr)),

		_or_expr: ($) => prec(2, choice($.or_expr, $._and_expr)),

		and_expr: ($) => prec(1, binaryExpression($._and_expr, /and/, $._equality_expr)),

		_and_expr: ($) => prec(2, choice($.and_expr, $._equality_expr)),

		ne_expr: ($) => prec(1, binaryExpression($._equality_expr, /!=/, $._relational_expr)),
		eq_expr: ($) => prec(1, binaryExpression($._equality_expr, /=/, $._relational_expr)),

		_equality_expr: ($) => prec(2, choice($.ne_expr, $.eq_expr, $._relational_expr)),

		lte_expr: ($) => prec(1, binaryExpression($._relational_expr, /<=/, $._additive_expr)),
		lt_expr: ($) => prec(1, binaryExpression($._relational_expr, /</, $._additive_expr)),
		gte_expr: ($) => prec(1, binaryExpression($._relational_expr, />=/, $._additive_expr)),
		gt_expr: ($) => prec(1, binaryExpression($._relational_expr, />/, $._additive_expr)),

		_relational_expr: ($) =>
			prec(2, choice($.lte_expr, $.lt_expr, $.gte_expr, $.gt_expr, $._additive_expr)),

		/* 3.5 Numbers */

		addition_expr: ($) => prec(1, binaryExpression($._additive_expr, /\+/, $._multiplicative_expr)),
		subtraction_expr: ($) =>
			prec(1, binaryExpression($._additive_expr, /-/, $._multiplicative_expr)),

		_additive_expr: ($) =>
			prec(2, choice($.addition_expr, $.subtraction_expr, $._multiplicative_expr)),

		multiplication_expr: ($) =>
			prec(1, binaryExpression($._multiplicative_expr, $._multiply_operator, $._unary_expr)),
		division_expr: ($) =>
			prec(1, binaryExpression($._multiplicative_expr, $._divide_operator, $._unary_expr)),
		modulo_expr: ($) =>
			prec(1, binaryExpression($._multiplicative_expr, $._modulo_operator, $._unary_expr)),

		_multiplicative_expr: ($) =>
			prec(2, choice($.multiplication_expr, $.division_expr, $.modulo_expr, $._unary_expr)),

		unary_expr: ($) => seq(/-/, $._union_expr),

		_unary_expr: ($) => choice(prec.right($.unary_expr), $._union_expr),

		/* 3.6 Strings - no spec grammar */

		/* 3.7 Lexical Structure */

		string_literal: ($) => $._literal,
		/** *String* literal */
		_literal: () => choice(/"[^"]*"/, /'[^']*'/),

		number: () => choice(/\d+(\.\d*)?/, /\.\d+/),

		// Not in use: `number` is expressed as regular expressions, rather than the
		// more directly equivalent `seq` tree-sitter API, mainly to avoid overly
		// permissive allowance of whitespace.
		// _digits: () => /[0-9]+/,

		// TODO: This is broken. Unclear if it matters for ODK use cases, but the
		// grammar is incomplete for the general purpose without addressing it.
		variable_reference: ($) => seq($._variable_reference, $.variable_reference),
		_variable_reference: ($) => seq(/\$/, $._q_name),

		_name_test: ($) =>
			choice($.unprefixed_wildcard_name_test, $.prefixed_wildcard_name_test, $._q_name),

		unprefixed_wildcard_name_test: ($) => $._wildcard_name_test,
		prefixed_wildcard_name_test: ($) => seq($.prefix, /:/, $._wildcard_name_test),
		_wildcard_name_test: () => '*',

		/* --- definitions from Namespaces in XML 1.0 spec --- */

		_q_name: ($) => choice($.prefixed_name, $.unprefixed_name),

		prefixed_name: ($) => seq($.prefix, /:/, $.local_part),
		unprefixed_name: ($) => $._local_part,
		prefix: ($) => $._prefix,
		_prefix: ($) => $._nc_name,
		local_part: ($) => $._local_part,
		_local_part: ($) => $._nc_name,

		_nc_name: () => NC_NAME,

		// Defined after `_*_name` so those will take precedence
		//
		// TODO: there **has to be** a better way to do this with the explicit
		// tree-sitter `prec`/`prec.*` APIs, but I haven't yet cracked that nut.
		_multiply_operator: () => /\*/,
		_divide_operator: () => prec(1, /div/),
		_modulo_operator: () => prec(1, /mod/),

		node_type_test: () =>
			seq(
				choice(
					token(seq('comment', /\s*\(\s*\)/)),
					token(seq('node', /\s*\(\s*\)/)),
					token(seq('processing-instruction', /\s*\(\s*\)/)),
					token(seq('text', /\s*\(\s*\)/))
				)
			),
	},
});

export default xpathGrammar;
