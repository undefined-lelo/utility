import * as babel from 'prettier/plugins/babel';
import * as estree from 'prettier/plugins/estree';
import * as postcss from 'prettier/plugins/postcss';
import * as prettier from 'prettier/standalone';
import { format as pythonFormat } from '@wasm-fmt/ruff_fmt';
import { format as rustFormat } from '@scalar/rust-fmt';
import type { LangId } from '#lib/tools/parsers/types';

export interface FormatResult {
	ok: boolean;
	code?: string;
	error?: string;
}

export async function formatCode(
	lang: LangId,
	source: string,
	options: { typescript?: boolean } = {}
): Promise<FormatResult> {
	if (!source.trim()) return { ok: true, code: source };

	try {
		switch (lang) {
			case 'json': {
				const parsed = JSON.parse(source);
				return { ok: true, code: `${JSON.stringify(parsed, null, 2)}\n` };
			}

			case 'css':
				return {
					ok: true,
					code: await prettier.format(source, { parser: 'css', plugins: [postcss] })
				};

			case 'js':
				return {
					ok: true,
					code: await prettier.format(source, {
						parser: options.typescript ? 'babel-ts' : 'babel',
						plugins: [babel, estree]
					})
				};

			case 'python':
				return {
					ok: true,
					code: pythonFormat(source, null, {
						indent_width: 4,
						line_width: 96,
						quote_style: 'preserve'
					})
				};

			case 'rust':
				return {
					ok: true,
					code: String(
						await rustFormat(source, { edition: '2021', styleEdition: '2021', maxWidth: 100 })
					)
				};
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return { ok: false, error: message.split('\n')[0].slice(0, 300) };
	}
}
