# eslint-config-optionq

Option Q [ESLint](https://eslint.org/) config.

## Install

```sh
$ yarn add --dev eslint eslint-config-optionq
```

## Usage

Add to `.eslintrc.yml` the following:

```yaml
extends: optionq
```

Add a `lint` command to the `scripts` section of your `package.json`:

```json
{
  "scripts": {
    "lint": "npx eslint ."
  }
}
```

Run linter with:

```sh
$ yarn lint
```

Automatically fix lint issues with `--fix` option:

```sh
$ yarn lint --fix
```
