import { testRuleConfigs } from '../index.js';

import plugin from './fixtures/plugin-foo.js';

const plugins = [plugin];
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
