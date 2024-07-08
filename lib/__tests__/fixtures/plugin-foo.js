import path from 'node:path';

import stylelint from 'stylelint';

const {
	createPlugin,
	utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = 'plugin/foo';

const messages = ruleMessages(ruleName, {
	rejected: (selector) => `No "${selector}" selector`,
	expectFilename: (expected, actual) => `Expect "${actual}" to be "${expected}"`,
});

/** @type {(value: unknown) => boolean} */
const isString = (value) => typeof value === 'string';

/** @type {import('stylelint').Rule} */
const ruleFunction = (primary, secondaryOptions, { fix }) => {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: [isString],
			},
			{
				actual: secondaryOptions,
				possible: {
					filename: [isString],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		const expectedFilename = secondaryOptions?.['filename']; // eslint-disable-line dot-notation
		const actualFilename = path.basename(root.source?.input.file ?? '');

		if (expectedFilename && expectedFilename !== actualFilename) {
			report({
				result,
				ruleName,
				message: messages.expectFilename(expectedFilename, actualFilename),
				node: root,
			});

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
