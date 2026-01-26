/**
 * Yields execution to the back of the Macrotask queue.
 * This forces the JavaScript engine to flush all pending Microtasks (Promise chains,
 * reactivity updates) before resuming execution.
 *
 * Usage example:
 * This is useful in scenarios like form submission. If a value was just updated,
 * the engine may have internal pending tasks (validations, calculated constraints) in the queue.
 * Waiting for them to finish guarantees we capture the most accurate and up-to-date state of the data.
 */
export const waitAllTasksToFinish = (): Promise<void> => {
	return new Promise((resolve) => setTimeout(resolve, 0));
};
