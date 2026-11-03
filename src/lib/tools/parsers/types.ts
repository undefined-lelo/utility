export type LangId = 'js' | 'python' | 'rust' | 'css' | 'json';

export interface AstNode {
	label: string;
	detail?: string;
	from?: number;
	to?: number;
	children?: AstNode[];
}

export interface ParseIssue {
	message: string;
	line: number;
	column: number;
	from?: number;
	to?: number;
}

export interface ParseStats {
	nodes: number;
	depth: number;
	ms: number;
	lines: number;
	chars: number;
}

export interface ParseOutcome {
	ok: boolean;
	nodes: AstNode[];
	issues: ParseIssue[];
	stats: ParseStats;
	truncated?: boolean;
}

export function offsetToLineCol(source: string, offset: number): { line: number; column: number } {
	const clamped = Math.max(0, Math.min(offset, source.length));
	let line = 1;
	let lineStart = 0;
	for (let i = 0; i < clamped; i++) {
		if (source.charCodeAt(i) === 10) {
			line++;
			lineStart = i + 1;
		}
	}
	return { line, column: clamped - lineStart };
}

export function measure(nodes: AstNode[]): { nodes: number; depth: number } {
	let count = 0;
	let depth = 0;
	const stack: { node: AstNode; d: number }[] = nodes.map((node) => ({ node, d: 1 }));
	while (stack.length) {
		const { node, d } = stack.pop()!;
		count++;
		if (d > depth) depth = d;
		if (node.children) for (const child of node.children) stack.push({ node: child, d: d + 1 });
	}
	return { nodes: count, depth };
}

export function emptyStats(source: string, ms = 0): ParseStats {
	return {
		nodes: 0,
		depth: 0,
		ms,
		lines: source.length ? source.split('\n').length : 0,
		chars: source.length
	};
}
