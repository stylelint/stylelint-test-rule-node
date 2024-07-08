import { testRule } from '../index.js';

import plugin from './fixtures/plugin-foo.js';

const plugins = [plugin];
const {
	// @ts-expect-error -- TS2339: Property 'ruleName' does not exist on type 'Plugin'.
	ruleName,
	// @ts-expect-error -- TS2339: Property 'rule' does not exist on type 'Plugin'.
	rule: { messages },
} = plugin;

testRule({
	plugins,
	ruleName,
	config: ['.a'],

	accept: [
		{
			code: '.a {}',
		},
		{
			code: '.a {}',
			description: 'with description',
		},
	],

	reject: [
		{
			code: '#a {}',
			message: messages.rejected('#a'),
		},
		{
			code: '#a {}',
			message: messages.rejected('#a'),
			description: 'with description',
		},
		{
			code: '#a {}',
			message: messages.rejected('#a'),
			description: 'with location',
			line: 1,
			column: 1,
			endLine: 1,
			endColumn: 3,
		},
		{
			code: '#a {} #b {}',
			description: 'multiple warnings',
			warnings: [
				{
					message: messages.rejected('#a'),
				},
				{
					message: messages.rejected('#b'),
					line: 1,
					column: 7,
					endLine: 1,
					endColumn: 9,
				},
			],
		},
		{
			code: '#a {',
			message: 'Unclosed block (CssSyntaxError)',
			description: 'syntax error',
		},
	],
});

testRule({
	plugins,
	ruleName,
	config: ['.a'],
	fix: true,

	reject: [
		{
			code: '#a {}',
			fixed: '.a {}',
			message: messages.rejected('#a'),
		},
	],
});

testRule({
	plugins,
	ruleName,
	config: ['.a', { filename: 'foo.css' }],
	codeFilename: 'foo.css',

	accept: [{ code: '.a {}' }, { code: '.a {}', codeFilename: 'foo.css' }],

	reject: [
		{
			code: '#a {}',
			codeFilename: 'bar.css',
			message: messages.expectFilename('foo.css', 'bar.css'),
		},
	],
});
