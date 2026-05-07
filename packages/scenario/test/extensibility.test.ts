import { describe, it } from 'vitest';

describe('Extensibility', () => {
	describe('FormDefTest.java', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * - It is not inconceivable that we'd support a use case like this. The
		 *   `xpath` package already supports extensibility of XPath functions (and
		 *   it utilizes that support to introduce ODK XForms functions). Let's
		 *   discuss whether this is a use case we expect to support. If so, we
		 *   should put some serious thought into what the interface for it looks
		 *   like (including very probably revisiting the `xpath` package's own
		 *   extensibility APIs, which I'd looked into simplifying in the past. I
		 *   paused that effort when the functionality which would immediately
		 *   benefit from it turned out to be out of scope.)
		 *
		 * - Test is currently marked `todo` pending discussion, and the JavaRosa
		 *   function body is copied verbatim (commented out) to leave some context
		 *   here in case we pursue it.
		 */
		it.todo('can add function handlers before initialize', async () => {
			// 	FormDef formDef = Scenario.createFormDef("custom-func-form", html(
			// 		head(
			// 				title("custom-func-form"),
			// 				model(
			// 						mainInstance(t("data",
			// 								t("calculate"),
			// 								t("input")
			// 						)),
			// 						bind("/data/calculate").type("string").calculate("custom-func()")
			// 				)
			// 		),
			// 		body(
			// 				input("/data/input",
			// 						label("/data/calculate")
			// 				)
			// 		)
			// ));
			// formDef.getEvaluationContext().addFunctionHandler(new IFunctionHandler() {
			// 		@Override
			// 		public String getName() {
			// 				return "custom-func";
			// 		}
			// 		@Override
			// 		public List<Class[]> getPrototypes() {
			// 				return new ArrayList<Class[]>();
			// 		}
			// 		@Override
			// 		public boolean rawArgs() {
			// 				return true;
			// 		}
			// 		@Override
			// 		public boolean realTime() {
			// 				return false;
			// 		}
			// 		@Override
			// 		public Object eval(Object[] args, EvaluationContext ec) {
			// 				return "blah";
			// 		}
			// });
			// Scenario.init(formDef);
		});
	});
});
