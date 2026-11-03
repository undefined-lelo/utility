import type { TreeCursor } from '@lezer/common';
import type { AstNode, ParseIssue, ParseOutcome } from './types';
import { measure, offsetToLineCol } from './types';

const MAX_NODES = 4000;

interface Counter {
	n: number;
	truncated: boolean;
}

function walk(cursor: TreeCursor, counter: Counter): AstNode {
	counter.n++;
	const node: AstNode = { label: cursor.name, from: cursor.from, to: cursor.to };

	if (cursor.firstChild()) {
		const children: AstNode[] = [];
		do {
			if (counter.n >= MAX_NODES) {
				counter.truncated = true;
				break;
			}
			children.push(walk(cursor, counter));
		} while (cursor.nextSibling());
		cursor.parent();
		if (children.length) node.children = children;
	}

	return node;
}

export function parseWithLezer(
	parser: { parse(input: string): import('@lezer/common').Tree },
	source: string
): ParseOutcome {
	const t0 = performance.now();
	const tree = parser.parse(source);
	const counter: Counter = { n: 0, truncated: false };
	const cursor = tree.cursor();
	const nodes: AstNode[] = [];

	const root: AstNode = { label: tree.topNode.name, from: 0, to: source.length };
	if (cursor.firstChild()) {
		const children: AstNode[] = [];
		do {
			if (counter.n >= MAX_NODES) {
				counter.truncated = true;
				break;
			}
			children.push(walk(cursor, counter));
		} while (cursor.nextSibling());
		cursor.parent();
		if (children.length) root.children = children;
	}
	nodes.push(root);

	const issues: ParseIssue[] = [];
	tree.iterate({
		enter(ref) {
			if (!ref.type.isError) return;
			const { line, column } = offsetToLineCol(source, ref.from);
			const snippet =
				ref.from === ref.to
					? source
							.slice(ref.from, ref.from + 12)
							.split('\n')[0]
							.trim()
					: source
							.slice(ref.from, Math.min(ref.to, ref.from + 24))
							.split('\n')[0]
							.trim();
			issues.push({
				message:
					ref.from === ref.to
						? 'Unexpected token — expected something else here.'
						: `Unexpected input: “${snippet || '⏎'}”`,
				line,
				column,
				from: ref.from,
				to: ref.to
			});
		}
	});

	if (issues.length > 40) issues.length = 40;

	const { nodes: count, depth } = measure(nodes);
	return {
		ok: issues.length === 0,
		nodes,
		issues,
		truncated: counter.truncated,
		stats: {
			nodes: count,
			depth,
			ms: Math.round((performance.now() - t0) * 100) / 100,
			lines: source.length ? source.split('\n').length : 0,
			chars: source.length
		}
	};
}
