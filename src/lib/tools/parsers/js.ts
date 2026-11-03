import { parse } from '@babel/parser';
import type { AstNode, ParseIssue, ParseOutcome } from './types';
import { measure } from './types';

const MAX_NODES = 4000;

const SKIP = new Set([
	'type',
	'start',
	'end',
	'loc',
	'range',
	'extra',
	'leadingComments',
	'trailingComments',
	'innerComments',
	'comments',
	'errors',
	'tokens',
	'importKind',
	'flags'
]);

interface Counter {
	n: number;
	truncated: boolean;
}

const CALLEE_FREE: Record<string, string[]> = {
	Identifier: ['name'],
	JSXIdentifier: ['name'],
	PrivateName: ['name'],
	StringLiteral: ['value'],
	NumericLiteral: ['value'],
	BooleanLiteral: ['value'],
	NullLiteral: [],
	BigIntLiteral: ['value'],
	RegExpLiteral: ['pattern', 'flags'],
	DecimalLiteral: ['value'],
	TemplateElement: ['raw'],
	VariableDeclaration: ['kind'],
	BinaryExpression: ['operator'],
	LogicalExpression: ['operator'],
	AssignmentExpression: ['operator'],
	UnaryExpression: ['operator', 'prefix'],
	UpdateExpression: ['operator', 'prefix'],
	MemberExpression: ['computed', 'optional'],
	CallExpression: ['optional'],
	ImportDeclaration: ['importKind'],
	ExportNamedDeclaration: ['exportKind'],
	TSInterfaceDeclaration: [],
	TSTypeAliasDeclaration: []
};

function shorten(value: string, max = 48): string {
	const flat = value.replace(/\s+/g, ' ').trim();
	return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

function summarize(node: Record<string, unknown>): string | undefined {
	const type = typeof node.type === 'string' ? node.type : '';

	const id = node.id as Record<string, unknown> | undefined;
	if (id && typeof id.name === 'string' && /Declaration$|^Class|^Function|^TS/.test(type))
		return id.name;

	const parts: string[] = [];
	const keys = CALLEE_FREE[type] ?? [];
	for (const key of keys) {
		const value = node[key];
		if (value === undefined || value === null) continue;
		if (key === 'prefix' && value === true) continue;
		if (key === 'computed' && value === false) continue;
		if (key === 'optional' && value === false) continue;
		parts.push(
			key === 'value' || key === 'name' || key === 'raw' ? String(value) : `${key}=${String(value)}`
		);
	}

	if (type === 'Property' || type === 'ObjectProperty') {
		const key = node.key as Record<string, unknown> | undefined;
		if (key && typeof key.name === 'string') parts.push(key.name);
		if (key && typeof key.value === 'string') parts.push(key.value);
	}

	if (type === 'Variance' && typeof node.kind === 'string') parts.push(node.kind);

	if (
		type === 'ImportDeclaration' ||
		type === 'ExportNamedDeclaration' ||
		type === 'ExportAllDeclaration'
	) {
		const source = node.source as Record<string, unknown> | undefined;
		if (source && typeof source.value === 'string') parts.push(`"${shorten(source.value)}"`);
	}

	if (!parts.length) return undefined;
	return shorten(parts.join(' '));
}

function convert(value: unknown, label: string, counter: Counter): AstNode | null {
	if (value === null || value === undefined) return null;
	if (counter.n >= MAX_NODES) {
		counter.truncated = true;
		return null;
	}
	counter.n++;

	if (typeof value === 'string') return { label, detail: shorten(value) };
	if (typeof value === 'number' || typeof value === 'boolean')
		return { label, detail: String(value) };
	if (typeof value === 'bigint') return { label, detail: value.toString() };

	if (Array.isArray(value)) {
		const node: AstNode = { label: `${label}[${value.length}]` };
		const children = value
			.map((item, i) => convert(item, String(i), counter))
			.filter((item): item is AstNode => item !== null);
		if (children.length) node.children = children;
		return node;
	}

	if (typeof value === 'object') {
		const obj = value as Record<string, unknown>;
		const type = typeof obj.type === 'string' ? obj.type : null;
		const node: AstNode = { label: type ?? label };
		if (typeof obj.start === 'number') node.from = obj.start;
		if (typeof obj.end === 'number') node.to = obj.end;

		const detail = summarize(obj);
		if (detail) node.detail = detail;

		const children: AstNode[] = [];
		for (const [key, child] of Object.entries(obj)) {
			if (SKIP.has(key)) continue;
			if (child === null || child === undefined || child === false) continue;
			const converted = convert(child, key, counter);
			if (converted) children.push(converted);
			if (counter.truncated) break;
		}
		if (children.length) node.children = children;
		return node;
	}

	return { label, detail: String(value) };
}

function toIssue(error: {
	message: string;
	loc?: { line: number; column: number } | null;
}): ParseIssue {
	const loc = error.loc ?? { line: 1, column: 0 };
	return {
		message: error.message.replace(/\s*\(\d+:\d+\)$/, ''),
		line: loc.line,
		column: loc.column,
		from: error.loc ? undefined : undefined
	};
}

export function parseJs(source: string, typescript: boolean): ParseOutcome {
	const t0 = performance.now();
	const issues: ParseIssue[] = [];
	let nodes: AstNode[] = [];
	let truncated = false;

	const plugins: ('jsx' | 'typescript')[] = typescript ? ['typescript', 'jsx'] : ['jsx'];

	try {
		const file = parse(source, {
			sourceType: 'unambiguous',
			allowAwaitOutsideFunction: true,
			errorRecovery: true,
			plugins
		});

		const counter: Counter = { n: 0, truncated: false };
		const program = convert(file.program, 'Program', counter);
		truncated = counter.truncated;
		if (program) nodes = [program];

		const recovered =
			(
				file as unknown as {
					errors?: { message: string; loc?: { line: number; column: number } | null }[];
				}
			).errors ?? [];
		for (const error of recovered) issues.push(toIssue(error));
	} catch (error) {
		const err = error as { message: string; loc?: { line: number; column: number } | null };
		issues.push(toIssue(err));
	}

	if (issues.length > 40) issues.length = 40;
	const { nodes: count, depth } = measure(nodes);

	return {
		ok: issues.length === 0,
		nodes,
		issues,
		truncated,
		stats: {
			nodes: count,
			depth,
			ms: Math.round((performance.now() - t0) * 100) / 100,
			lines: source.length ? source.split('\n').length : 0,
			chars: source.length
		}
	};
}
