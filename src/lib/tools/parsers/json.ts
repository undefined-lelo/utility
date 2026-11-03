import type { AstNode, ParseIssue, ParseOutcome } from './types';
import { measure, offsetToLineCol } from './types';

const MAX_DEPTH = 200;

class JsonSyntaxError extends Error {
	constructor(
		message: string,
		readonly at: number
	) {
		super(message);
	}
}

interface Ctx {
	src: string;
	i: number;
}

function skipWs(ctx: Ctx) {
	while (ctx.i < ctx.src.length) {
		const c = ctx.src[ctx.i];
		if (c === ' ' || c === '\t' || c === '\n' || c === '\r') ctx.i++;
		else break;
	}
}

function readString(ctx: Ctx): string {
	const start = ctx.i;
	ctx.i++;
	let out = '';

	while (ctx.i < ctx.src.length) {
		const c = ctx.src[ctx.i];

		if (c === '"') {
			ctx.i++;
			return out;
		}

		if (c === '\\') {
			const esc = ctx.src[ctx.i + 1];
			if (esc === undefined) throw new JsonSyntaxError('Unterminated string escape.', ctx.i);
			switch (esc) {
				case '"':
				case '\\':
				case '/':
					out += esc;
					ctx.i += 2;
					break;
				case 'b':
					out += '\b';
					ctx.i += 2;
					break;
				case 'f':
					out += '\f';
					ctx.i += 2;
					break;
				case 'n':
					out += '\n';
					ctx.i += 2;
					break;
				case 'r':
					out += '\r';
					ctx.i += 2;
					break;
				case 't':
					out += '\t';
					ctx.i += 2;
					break;
				case 'u': {
					const hex = ctx.src.slice(ctx.i + 2, ctx.i + 6);
					if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
						throw new JsonSyntaxError('Invalid \\u escape — expected four hex digits.', ctx.i);
					}
					out += String.fromCharCode(parseInt(hex, 16));
					ctx.i += 6;
					break;
				}
				default:
					throw new JsonSyntaxError(`Invalid escape “\\${esc}”.`, ctx.i);
			}
			continue;
		}

		const code = c.charCodeAt(0);
		if (code < 0x20) {
			throw new JsonSyntaxError('Control character in string — it must be escaped.', ctx.i);
		}

		out += c;
		ctx.i++;
	}

	throw new JsonSyntaxError('Unterminated string.', start);
}

function readNumber(ctx: Ctx): { raw: string; value: number } {
	const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(ctx.src.slice(ctx.i));
	if (!match) throw new JsonSyntaxError('Invalid number.', ctx.i);
	const raw = match[0];
	ctx.i += raw.length;
	return { raw, value: Number(raw) };
}

function readValue(ctx: Ctx, depth: number): AstNode {
	skipWs(ctx);
	if (ctx.i >= ctx.src.length) throw new JsonSyntaxError('Unexpected end of input.', ctx.i);
	if (depth > MAX_DEPTH)
		throw new JsonSyntaxError(`Nested deeper than ${MAX_DEPTH} levels.`, ctx.i);

	const c = ctx.src[ctx.i];
	const start = ctx.i;

	if (c === '{') return readObject(ctx, depth);
	if (c === '[') return readArray(ctx, depth);
	if (c === '"') {
		const value = readString(ctx);
		return { label: 'String', detail: JSON.stringify(value), from: start, to: ctx.i };
	}
	if (c === '-' || (c >= '0' && c <= '9')) {
		const { raw, value } = readNumber(ctx);
		return {
			label: 'Number',
			detail: Number.isFinite(value) ? `${raw}` : raw,
			from: start,
			to: ctx.i
		};
	}
	if (ctx.src.startsWith('true', ctx.i)) {
		ctx.i += 4;
		return { label: 'Boolean', detail: 'true', from: start, to: ctx.i };
	}
	if (ctx.src.startsWith('false', ctx.i)) {
		ctx.i += 5;
		return { label: 'Boolean', detail: 'false', from: start, to: ctx.i };
	}
	if (ctx.src.startsWith('null', ctx.i)) {
		ctx.i += 4;
		return { label: 'Null', from: start, to: ctx.i };
	}

	throw new JsonSyntaxError(`Unexpected character “${c}”.`, ctx.i);
}

function readObject(ctx: Ctx, depth: number): AstNode {
	const start = ctx.i;
	ctx.i++;
	const node: AstNode = { label: 'Object', from: start };
	const children: AstNode[] = [];

	skipWs(ctx);
	if (ctx.src[ctx.i] === '}') {
		ctx.i++;
		node.to = ctx.i;
		return node;
	}

	for (;;) {
		skipWs(ctx);
		if (ctx.i >= ctx.src.length)
			throw new JsonSyntaxError('Unterminated object — expected “}”.', ctx.i);
		if (ctx.src[ctx.i] !== '"') {
			throw new JsonSyntaxError(
				`Expected a double-quoted key, found “${ctx.src[ctx.i] ?? 'EOF'}”.`,
				ctx.i
			);
		}

		const keyStart = ctx.i;
		const key = readString(ctx);

		skipWs(ctx);
		if (ctx.src[ctx.i] !== ':') throw new JsonSyntaxError('Expected “:” after the key.', ctx.i);
		ctx.i++;

		const value = readValue(ctx, depth + 1);
		children.push({
			label: JSON.stringify(key),
			detail: value.detail,
			from: keyStart,
			to: value.to,
			children: value.children ?? (value.detail === undefined ? undefined : undefined)
		});

		const entry = children[children.length - 1];
		entry.children = [value];

		skipWs(ctx);
		if (ctx.src[ctx.i] === ',') {
			ctx.i++;
			skipWs(ctx);
			if (ctx.src[ctx.i] === '}') {
				throw new JsonSyntaxError('Trailing comma before “}” is not valid JSON.', ctx.i);
			}
			continue;
		}
		if (ctx.src[ctx.i] === '}') {
			ctx.i++;
			break;
		}
		throw new JsonSyntaxError(`Expected “,” or “}”, found “${ctx.src[ctx.i] ?? 'EOF'}”.`, ctx.i);
	}

	node.to = ctx.i;
	if (children.length) node.children = children;
	return node;
}

function readArray(ctx: Ctx, depth: number): AstNode {
	const start = ctx.i;
	ctx.i++;
	const node: AstNode = { label: 'Array', from: start };
	const children: AstNode[] = [];

	skipWs(ctx);
	if (ctx.src[ctx.i] === ']') {
		ctx.i++;
		node.to = ctx.i;
		return node;
	}

	let index = 0;
	for (;;) {
		const value = readValue(ctx, depth + 1);
		children.push({
			label: `[${index}]`,
			detail: value.detail,
			from: value.from,
			to: value.to,
			children: [value]
		});
		index++;

		skipWs(ctx);
		if (ctx.src[ctx.i] === ',') {
			ctx.i++;
			skipWs(ctx);
			if (ctx.src[ctx.i] === ']') {
				throw new JsonSyntaxError('Trailing comma before “]” is not valid JSON.', ctx.i);
			}
			continue;
		}
		if (ctx.src[ctx.i] === ']') {
			ctx.i++;
			break;
		}
		throw new JsonSyntaxError(`Expected “,” or “]”, found “${ctx.src[ctx.i] ?? 'EOF'}”.`, ctx.i);
	}

	node.to = ctx.i;
	if (children.length) node.children = children;
	return node;
}

export function parseJson(source: string): ParseOutcome {
	const t0 = performance.now();
	const trimmed = source.trim();

	if (!trimmed) {
		return {
			ok: false,
			nodes: [],
			issues: [],
			stats: { nodes: 0, depth: 0, ms: 0, lines: 0, chars: 0 }
		};
	}

	const ctx: Ctx = { src: source, i: 0 };

	try {
		const root = readValue(ctx, 0);
		skipWs(ctx);
		if (ctx.i < source.length) {
			throw new JsonSyntaxError(
				`Unexpected trailing content “${source.slice(ctx.i, ctx.i + 12).split('\n')[0]}”.`,
				ctx.i
			);
		}

		const { nodes, depth } = measure([root]);
		return {
			ok: true,
			nodes: [root],
			issues: [],
			stats: {
				nodes,
				depth,
				ms: Math.round((performance.now() - t0) * 100) / 100,
				lines: source.split('\n').length,
				chars: source.length
			}
		};
	} catch (error) {
		const err =
			error instanceof JsonSyntaxError
				? error
				: new JsonSyntaxError('Could not parse JSON.', ctx.i);
		const { line, column } = offsetToLineCol(source, err.at);
		const issue: ParseIssue = { message: err.message, line, column, from: err.at };
		return {
			ok: false,
			nodes: [],
			issues: [issue],
			stats: {
				nodes: 0,
				depth: 0,
				ms: Math.round((performance.now() - t0) * 100) / 100,
				lines: source.split('\n').length,
				chars: source.length
			}
		};
	}
}

export function formatJson(source: string, indent = 2): string | null {
	try {
		return JSON.stringify(JSON.parse(source), null, indent);
	} catch {
		return null;
	}
}

export function minifyJson(source: string): string | null {
	try {
		return JSON.stringify(JSON.parse(source));
	} catch {
		return null;
	}
}
