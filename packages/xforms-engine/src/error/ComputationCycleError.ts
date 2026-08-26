import { XFormsSpecViolationError } from './XFormsSpecViolationError.ts';

export class ComputationCycleError extends XFormsSpecViolationError {
  constructor(cycleNodesets: readonly string[]) {
    // Matches Collect message
    super(
      'Cycle detected in form\'s relevant and calculation logic!\n' +
      'The following nodes are likely involved in the loop:\n' +
      cycleNodesets.join('\n')
    );
  }
}
