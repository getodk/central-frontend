import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type { OpaqueReactiveObjectFactory } from '../../../client/OpaqueReactiveObjectFactory.ts';
import type {
	AnyViolation,
	ConditionSatisfied,
	ConditionValidation,
	ConditionViolation,
	ValidationCondition,
} from '../../../client/validation.ts';
import type { ValidationContext } from '../../../instance/internal-api/ValidationContext.ts';
import { createComputedExpression } from '../createComputedExpression.ts';
import type {
	SharedNodeState,
	SharedNodeStateOptions,
} from '../node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../node-state/createSharedNodeState.ts';
import type { ReactiveScope } from '../scope.ts';
import { createTextRange } from '../text/createTextRange.ts';

// prettier-ignore
type ComputedConditionValidation<
	Condition extends ValidationCondition
> = Accessor<ConditionValidation<Condition>>;

const constraintValid = (): ConditionSatisfied<'constraint'> => {
	return {
		condition: 'constraint',
		valid: true,
		message: null,
	};
};

const createConstraintValidation = (
	context: ValidationContext
): ComputedConditionValidation<'constraint'> => {
	return context.scope.runTask(() => {
		const { constraint, constraintMsg } = context.definition.bind;

		if (constraint == null) {
			return constraintValid;
		}

		const isValid = createComputedExpression(context, constraint, {
			defaultValue: true,
		});
		const message = constraintMsg ? createTextRange(context, 'constraintMsg', constraintMsg) : null;

		return createMemo(() => {
			if (!context.isRelevant() || context.isBlank() || isValid()) {
				return constraintValid();
			}

			return {
				condition: 'constraint',
				valid: false,
				message: message?.() ?? null,
			} as const;
		});
	});
};

const requiredValid = (): ConditionSatisfied<'required'> => {
	return {
		condition: 'required',
		valid: true,
		message: null,
	};
};

const createRequiredValidation = (
	context: ValidationContext
): ComputedConditionValidation<'required'> => {
	return context.scope.runTask(() => {
		const { required, requiredMsg } = context.definition.bind;

		if (required.isDefaultExpression) {
			return requiredValid;
		}

		const isValid = () => {
			if (context.isRequired()) {
				return !context.isBlank();
			}

			return true;
		};

		const message = requiredMsg ? createTextRange(context, 'requiredMsg', requiredMsg) : null;

		return createMemo(() => {
			if (!context.isRelevant() || isValid()) {
				return requiredValid();
			}

			return {
				condition: 'required',
				valid: false,
				message: message?.() ?? null,
			} as const;
		});
	});
};

type OptionalViolation<Condition extends ValidationCondition> =
	Accessor<ConditionViolation<Condition> | null>;

const createComputedViolation = <Condition extends ValidationCondition>(
	scope: ReactiveScope,
	validateCondition: ComputedConditionValidation<Condition>
): OptionalViolation<Condition> => {
	return scope.runTask(() => {
		return createMemo(() => {
			const validation = validateCondition();

			if (validation.valid) {
				return null;
			}

			return validation;
		});
	});
};

type ComputedViolation = Accessor<AnyViolation | null>;

interface ValidationStateSpec {
	readonly constraint: ComputedConditionValidation<'constraint'>;
	readonly required: ComputedConditionValidation<'required'>;
	readonly violation: ComputedViolation;
}

export type SharedValidationState = SharedNodeState<ValidationStateSpec>;

interface ValidationStateOptions<
	Factory extends OpaqueReactiveObjectFactory,
> extends SharedNodeStateOptions<Factory, ValidationStateSpec> {}

export const createValidationState = <Factory extends OpaqueReactiveObjectFactory>(
	context: ValidationContext,
	options: ValidationStateOptions<Factory>
): SharedValidationState => {
	const { scope } = context;

	return scope.runTask(() => {
		const constraint = createConstraintValidation(context);
		const constraintViolation = createComputedViolation(scope, constraint);
		const required = createRequiredValidation(context);
		const requiredViolation = createComputedViolation(scope, required);

		const violation = createMemo(() => {
			return constraintViolation() ?? requiredViolation();
		});

		const spec: ValidationStateSpec = {
			constraint,
			required,
			violation,
		};

		return createSharedNodeState(scope, spec, options);
	});
};
