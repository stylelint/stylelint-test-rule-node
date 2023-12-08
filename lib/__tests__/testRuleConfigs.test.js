import { testRuleConfigs } from '../index.js';

import plugin from './fixtures/plugin-foo.js';

const plugins = [plugin];
// @ts-expect-error -- TS2339: Property 'ruleName' does not exist on type 'Plugin'.
const { ruleName } = plugin;

testRuleConfigs({
	plugins,
	ruleName,

	accept: [
		{
			config: 'a',
		},
		{
			config: ['b'],
			description: 'string is allowed',
		},
	],

	reject: [
		{
			config: 123,
		},
		{
			config: [/foo/],
			description: 'regex is not allowed',
		},
	],
});
