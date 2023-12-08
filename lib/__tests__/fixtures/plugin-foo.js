import stylelint from 'stylelint';

const {
	// @ts-expect-error -- TS2339: Property 'createPlugin' does not exist on type 'typeof import("...").'
	createPlugin,
	// @ts-expect-error -- TS2339: Property 'utils' does not exist on type 'typeof import("...")'.
	utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = 'plugin/foo';

const messages = ruleMessages(ruleName, {
	rejected: (/** @type {string} */ selector) => `No "${selector}" selector`,
});

/** @type {(value: unknown) => boolean} */
const isString = (value) => typeof value === 'string';

/** @type {import('stylelint').Rule} */
const ruleFunction = (primary, _secondaryOptions, { fix }) => {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [isString],
		});

		if (!validOptions) {
			return;
		}

		root.walkRules((rule) => {
			const { selector } = rule;

			if (primary === selector) return;

			if (fix) {
				rule.selector = primary;

				return;
			}

			report({
				result,
				ruleName,
				message: messages.rejected(selector),
				node: rule,
				word: selector,
			});
		});
	};
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;

export default createPlugin(ruleName, ruleFunction);
