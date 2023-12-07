# stylelint-test-rule-node

[![CI](https://github.com/stylelint/stylelint-test-rule-node/actions/workflows/ci.yml/badge.svg)](https://github.com/stylelint/stylelint-test-rule-node/actions/workflows/ci.yml)

A Stylelint rule tester using [Node.js built-in test runner](https://nodejs.org/api/test.html) (`node:test`).

## Installation

Install the tester package alongside Stylelint:

```shell
npm install stylelint-test-rule-node stylelint --save-dev
```

## Usage

This package provides the following helper functions to help you test your custom rules or plugins.

See also the [type definitions](lib/index.d.ts) for more details.

### `testRule`

The `testRule` function enables you to efficiently test your plugin using a schema.

For example, we can test a plugin that enforces and autofixes kebab-case class selectors:

```js
// my-plugin.test.js
import myPlugin from "./my-plugin.js";

const plugins = [myPlugin];
const {
  ruleName,
  rule: { messages }
} = myPlugin;

testRule({
  plugins,
  ruleName,
  config: [true, { type: "kebab" }],
  fix: true,

  accept: [
    {
      code: ".class {}",
      description: "simple class selector"
    },
    {
      code: ".my-class {}",
      description: "kebab class selector"
    }
  ],

  reject: [
    {
      code: ".myClass {}",
      fixed: ".my-class {}",
      description: "camel case class selector",
      message: messages.expected(),
      line: 1,
      column: 1,
      endLine: 1,
      endColumn: 8
    },
    {
      code: ".MyClass,\n.MyOtherClass {}",
      fixed: ".my-class,\n.my-other-class {}",
      description: "two pascal class selectors in a selector list",
      warnings: [
        {
          message: messages.expected(),
          line: 1,
          column: 1,
          endLine: 1,
          endColumn: 8
        },
        {
          message: messages.expected(),
          line: 2,
          column: 1,
          endLine: 2,
          endColumn: 13
        }
      ]
    }
  ]
});
```

### `testRuleConfigs`

The `testRuleConfigs` function enables you to test invalid configs for a rule.

For example:

```js
testRuleConfigs({
  plugins,
  ruleName,

  accept: [
    {
      config: "valid"
    }
  ],

  reject: [
    {
      config: "invalid"
    },
    {
      config: [/invalid/],
      description: "regex is not allowed"
    }
  ]
});
```

## [Changelog](CHANGELOG.md)

## [License](LICENSE)
