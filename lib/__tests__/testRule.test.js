import { testRule } from '../index.js';

import plugin from './fixtures/plugin-foo.js';

const plugins = [plugin];
const {
	ruleName,
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
	],
});

testRule({
	plugins,
	ruleName,
	config: ['.a'],
	loadLint: () => import('stylelint').then((m) => m.default.lint),
	accept: [{ code: '.a {}' }],
});

testRule({
	plugins,
	ruleName,
	codeFilename: 'foo.css',
	config: ['.a', { filename: 'foo.css' }],
	accept: [{ code: '.a {}' }, { code: '.a {}', codeFilename: 'foo.css' }],
	reject: [
		{
			code: '.a {}',
			codeFilename: 'bar.css',
			message: messages.expectFilename('foo.css', 'bar.css'),
		},
	],
});

testRule({
	plugins,
	ruleName,
	config: ['.a'],
	computeEditInfo: true,

	accept: [],

	reject: [
		{
			code: '#a {}',
			message: messages.rejected('#a'),
			fix: {
				range: [0, 1],
				text: '.',
			},
		},
		{
			code: '.a {} #a {}',
			message: messages.rejected('#a'),
			description: 'with description',
			fix: {
				range: [6, 7],
				text: '.',
			},
		},
		{
			code: '#a, #a {}',
			warnings: [
				{
					message: messages.rejected('#a'),
					fix: {
						range: [0, 1],
						text: '.',
					},
				},
				{
					message: messages.rejected('#a'),
				},
			],
		},
	],
});

testRule({
	plugins,
	ruleName,
	config: ['.a'],
	fix: true,
	computeEditInfo: true,

	accept: [],

	reject: [
		{
			code: '#a {}',
			fixed: '.a {}',
			message: messages.rejected('#a'),
			fix: {
				range: [0, 1],
				text: '.',
			},
		},
		{
			code: '.a {} #a {}',
			fixed: '.a {} .a {}',
			message: messages.rejected('#a'),
			description: 'with description',
			fix: {
				range: [6, 7],
				text: '.',
			},
		},
	],
});

testRule({
	ruleName: 'at-rule-descriptor-no-unknown',
	config: true,
	languageOptions: {
		syntax: {
			atRules: {
				foo: {
					descriptors: {
						bar: '<number>',
					},
				},
			},
		},
	},

	accept: [
		{
			code: '@foo { bar: 1; }',
		},
	],

	reject: [
		{
			code: '@foo { baz: 1; }',
			message: 'Unknown descriptor "baz" for at-rule "@foo" (at-rule-descriptor-no-unknown)',
		},
	],
});

testRule({
	ruleName: 'no-unknown-animations',
	config: true,
	referenceFiles: {
		files: 'lib/__tests__/fixtures/animations.css',
	},

	accept: [
		{
			code: 'a { animation-name: foo; }',
		},
	],

	reject: [
		{
			code: 'a { animation-name: bar; }',
			message: 'Unknown animation "bar" (no-unknown-animations)',
		},
	],
});
