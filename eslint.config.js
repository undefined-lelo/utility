import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: ['build/**', '.svelte-kit/**', 'node_modules/**', '.agents/**', '.claude/**']
	},
	...tseslint.configs.recommended,
	...svelte.configs.recommended,
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: { parser: tseslint.parser }
		}
	},
	{
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
			],
			'@typescript-eslint/no-explicit-any': 'off',
			'svelte/no-navigation-without-resolve': 'off'
		}
	}
);
