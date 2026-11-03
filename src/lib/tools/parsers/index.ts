import { parser as cssParser } from '@lezer/css';
import { parser as pythonParser } from '@lezer/python';
import { parser as rustParser } from '@lezer/rust';
import { parseJs } from './js';
import { parseJson } from './json';
import { parseWithLezer } from './lezer';
import type { LangId, ParseOutcome } from './types';

export interface LangMeta {
	id: LangId;
	label: string;
	short: string;
	ext: string;
	engine: string;
	note: string;
	sample: string;
}

export const LANGS: Record<LangId, LangMeta> = {
	js: {
		id: 'js',
		label: 'JavaScript / TypeScript',
		short: 'JS / TS',
		ext: 'ts',
		engine: '@babel/parser',
		note: 'Babel parses in recovery mode, so a broken file still yields a partial AST alongside its errors.',
		sample: `const CACHE = new Map();

export class Registry {
	#items = [];

	add(item) {
		const key = item?.id ?? item.name;
		if (CACHE.has(key)) return false;
		CACHE.set(key, item);
		this.#items.push(item);
		return this.#items.length;
	}

	get size() {
		return this.#items.length;
	}
}

const greet = (user) => \`Hello, \${user?.name ?? 'anonymous'}!\`;
`
	},
	python: {
		id: 'python',
		label: 'Python',
		short: 'Python',
		ext: 'py',
		engine: '@lezer/python',
		note: 'A Lezer grammar builds a structural syntax tree. Errors are positional — it is not a type checker.',
		sample: `from dataclasses import dataclass


@dataclass
class Point:
    x: float
    y: float

    def dist(self) -> float:
        return (self.x ** 2 + self.y ** 2) ** 0.5


def summarize(points: list[Point]) -> dict[str, float]:
    if not points:
        raise ValueError("no points")
    return {"count": len(points), "far": max(p.dist() for p in points)}
`
	},
	rust: {
		id: 'rust',
		label: 'Rust',
		short: 'Rust',
		ext: 'rs',
		engine: '@lezer/rust',
		note: 'Covers items, expressions, patterns and generics at the syntax level — no name resolution or borrow checking.',
		sample: `use std::collections::HashMap;

#[derive(Debug, Clone)]
struct Item {
    name: String,
    qty: u32,
}

fn total(items: &[Item]) -> u32 {
    items.iter().map(|i| i.qty).sum()
}

fn main() {
    let mut stock: HashMap<&str, u32> = HashMap::new();
    stock.insert("bolt", 12);

    for (name, qty) in &stock {
        println!("{name}: {qty}");
    }

    println!("total: {}", total(&[]));
}
`
	},
	css: {
		id: 'css',
		label: 'CSS',
		short: 'CSS',
		ext: 'css',
		engine: '@lezer/css',
		note: 'Rules, selectors, declarations and at-rules as a tree. Custom properties and modern values stay intact.',
		sample: `:root {
	--bg: #08090a;
	--accent: #c9f75a;
	--gap: 12px;
}

.panel {
	display: grid;
	gap: var(--gap);
	padding: 16px 20px;
	border: 1px solid var(--accent);
}

.panel > .title:hover,
.panel > .title:focus-visible {
	color: var(--accent);
}

@media (max-width: 40rem) {
	.panel {
		padding: 12px;
	}
}
`
	},
	json: {
		id: 'json',
		label: 'JSON',
		short: 'JSON',
		ext: 'json',
		engine: 'hand-written',
		note: 'A strict RFC 8259 parser, so trailing commas and comments are reported as errors with an exact position.',
		sample: `{
	"name": "utility",
	"version": "0.1.0",
	"private": true,
	"tools": ["hex", "hsl", "parsers", "ip", "site-check"],
	"limits": { "nodes": 6, "timeout": 30 },
	"features": { "client": true, "proxied": ["ip", "site-check"] }
}
`
	}
};

export const LANG_ORDER: LangId[] = ['js', 'python', 'rust', 'css', 'json'];

export function isLang(value: string): value is LangId {
	return value in LANGS;
}

export function runParse(
	lang: LangId,
	source: string,
	options: { typescript?: boolean } = {}
): ParseOutcome {
	switch (lang) {
		case 'js':
			return parseJs(source, options.typescript ?? false);
		case 'python':
			return parseWithLezer(pythonParser, source);
		case 'rust':
			return parseWithLezer(rustParser, source);
		case 'css':
			return parseWithLezer(cssParser, source);
		case 'json':
			return parseJson(source);
	}
}

export type { AstNode, ParseIssue, ParseOutcome, LangId } from './types';
