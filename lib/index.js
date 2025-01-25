/* eslint-disable n/no-unsupported-features/node-builtins -- `node:test` is experimental yet, but it's okay with this package. */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { inspect } from 'node:util';

import stylelint from 'stylelint';

const { lint } = stylelint;

/** @type {import('./index.d.ts').testRule} */
export function testRule(schema) {
	const {
		ruleName,
		config,
		plugins,
		customSyntax,
		codeFilename,
		fix,
		accept = [],
		reject = [],
	} = schema;

	assert.ok(accept.length > 0 || reject.length > 0, 'No test cases provided');

	describe(`${ruleName}`, () => {
		const stylelintConfig = {
			plugins,
			rules: { [ruleName]: config },
		};

		setupTestCases({
			name: 'accept',
			cases: accept,
			schema,
			comparisons: (testCase) => async () => {
				const { code } = testCase;
				const stylelintOptions = {
					code,
					config: stylelintConfig,
					customSyntax,
					codeFilename: testCase.codeFilename || codeFilename,
				};

				const { results } = await lint(stylelintOptions);
				const [result] = results;

				assert.ok(result, 'No lint result');

				const { warnings, parseErrors, invalidOptionWarnings } = result;

				assert.deepEqual(warnings, [], 'Warnings are not empty');
				assert.deepEqual(parseErrors, [], 'Parse errors are not empty');
				assert.deepEqual(invalidOptionWarnings, [], 'Invalid option warnings are not empty');

				if (!fix) return;

				// Check that --fix doesn't change code
				const outputAfterFix = await lint({ ...stylelintOptions, fix: true });
				const fixedCode = getOutputCss(outputAfterFix);

				assert.equal(fixedCode, code, 'Fixed code does not equal original code');
			},
		});

		setupTestCases({
			name: 'reject',
			cases: reject,
			schema,
			comparisons: (testCase) => async () => {
				const { code, fixed, unfixable, warnings } = testCase;
				const stylelintOptions = {
					code,
					config: stylelintConfig,
					customSyntax,
					codeFilename: testCase.codeFilename || codeFilename,
					computeEditInfo: schema.computeEditInfo,
				};

				const { results } = await lint(stylelintOptions);
				const [result] = results;

				assert.ok(result, 'No lint result');

				const { warnings: resultWarnings, parseErrors, invalidOptionWarnings } = result;

				assert.deepEqual(parseErrors, [], 'Parse errors are not empty');

				const actualWarnings = [...invalidOptionWarnings, ...resultWarnings];
				const expectedWarnings = warnings ?? [testCase];

				assert.equal(
					actualWarnings.length,
					expectedWarnings.length,
					'Number of warnings does not match',
				);

				for (const [i, expected] of expectedWarnings.entries()) {
					const actualWarning = actualWarnings[i];

					assert.ok(actualWarning, 'No warning');
					assert.equal(actualWarning.text, expected.message, 'Warning "message" does not match');

					if ('line' in actualWarning && 'line' in expected) {
						assert.equal(actualWarning.line, expected.line, 'Warning "line" does not match');
					}

					if ('column' in actualWarning && 'column' in expected) {
						assert.equal(actualWarning.column, expected.column, 'Warning "column" does not match');
					}

					if ('endLine' in actualWarning && 'endLine' in expected) {
						assert.equal(
							actualWarning.endLine,
							expected.endLine,
							'Warning "endLine" does not match',
						);
					}

					if ('endColumn' in actualWarning && 'endColumn' in expected) {
						assert.equal(
							actualWarning.endColumn,
							expected.endColumn,
							'Warning "endColumn" does not match',
						);
					}

					if ('fix' in actualWarning && 'fix' in expected) {
						assert.deepStrictEqual(actualWarning.fix, expected.fix, 'Warning "fix" does not match');
					}
				}

				if (!fix) return;

				assert.ok(
					typeof fixed === 'string' || unfixable,
					'If using "{ fix: true }" in test schema, all reject cases must have a "fixed" or "unfixable" property',
				);

				const outputAfterFix = await lint({ ...stylelintOptions, fix: true });

				const fixedCode = getOutputCss(outputAfterFix);

				if (!unfixable) {
					assert.equal(fixedCode, fixed, 'Fixed code does not match "fixed"');
					assert.notEqual(fixedCode, code, 'Code is not fixed');
				} else {
					// can't fix
					if (fixed) {
						assert.equal(fixedCode, fixed, 'Fixed code does not match "fixed"');
					}

					assert.equal(fixedCode, code, 'Code is fixed');
				}

				// Checks whether only errors other than those fixed are reported
				const outputAfterLintOnFixedCode = await lint({
					...stylelintOptions,
					code: fixedCode,
					fix: unfixable,
				});
				const [fixedResult] = outputAfterLintOnFixedCode.results;

				assert.ok(fixedResult, 'No lint result');
				assert.deepEqual(
					fixedResult.warnings,
					outputAfterFix.results[0]?.warnings,
					'Warnings do not match',
				);
				assert.deepEqual(fixedResult.parseErrors, [], 'Parse errors are not empty');
			},
		});
	});
}

/**
 * @template {import('./index.d.ts').TestCase} T
 * @param {{
 *   name: string,
 *   cases: T[],
 *   schema: import('./index.d.ts').TestSchema,
 *   comparisons: (testCase: T) => () => void,
 * }} args
 * @returns {void}
 */
function setupTestCases({ name, cases, schema, comparisons }) {
	if (cases.length === 0) return;

	const testGroup = schema.only ? describe.only : schema.skip ? describe.skip : describe;

	testGroup(`${name}`, () => {
		cases.forEach((testCase) => {
			if (testCase) {
				const spec = testCase.only ? it.only : testCase.skip ? it.skip : it;

				describe(`${inspect(schema.config)}`, () => {
					describe(`${inspect(testCase.code)}`, () => {
						spec(testCase.description || 'no description', comparisons(testCase));
					});
				});
			}
		});
	});
}

/**
 * @param {import('stylelint').LinterResult} result
 * @returns {string}
 */
function getOutputCss({ results }) {
	assert.ok(results[0]);
	const { _postcssResult: result } = results[0];

	assert.ok(result);
	assert.ok(result.root);
	assert.ok(result.opts);

	return result.root.toString(result.opts.syntax);
}

/** @type {import('./index.d.ts').testRuleConfigs} */
export function testRuleConfigs({
	ruleName,
	plugins,
	accept = [],
	reject = [],
	only = false,
	skip = false,
}) {
	assert.ok(accept.length > 0 || reject.length > 0, 'No test cases provided');

	const testGroup = only ? describe.only : skip ? describe.skip : describe;

	testGroup(`${ruleName} configs`, () => {
		/**
		 * @param {import('./index.d.ts').RuleConfigTestCase} case
		 * @param {(warnings: Array<{ text: string }>) => void} comparison
		 */
		function testConfig({ config, description, only: onlyTest, skip: skipTest }, comparison) {
			const testFn = onlyTest ? it.only : skipTest ? it.skip : it;

			testFn(`${description || inspect(config)}`, async () => {
				const lintConfig = {
					plugins,
					rules: { [ruleName]: config },
				};
				const { results } = await lint({ code: '', config: lintConfig });
				const [result] = results;

				assert.ok(result, 'No lint result');

				comparison(result.invalidOptionWarnings);
			});
		}

		describe('accept', () => {
			accept.forEach((c) => {
				testConfig(c, (warnings) => {
					assert.deepEqual(warnings, [], 'Config is invalid');
				});
			});
		});

		describe('reject', () => {
			reject.forEach((c) => {
				testConfig(c, (warnings) => {
					assert.notDeepEqual(warnings, [], 'Config is invalid');
				});
			});
		});
	});
}
