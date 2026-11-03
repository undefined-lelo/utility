export type ToolGroup = 'convert' | 'parse' | 'network';

export interface Tool {
	id: string;
	href: string;
	name: string;
	blurb: string;
	group: ToolGroup;
	client: boolean;
	meta: string[];
	keys: string[];
}

export const GROUPS: { id: ToolGroup; label: string; index: string }[] = [
	{ id: 'convert', label: 'Convert', index: '01' },
	{ id: 'parse', label: 'Parse', index: '02' },
	{ id: 'network', label: 'Network', index: '03' }
];

export const TOOLS: Tool[] = [
	{
		id: 'hex',
		href: '/hex',
		name: 'Decimal → Hex',
		blurb:
			'Convert decimal integers to hex, binary and octal with fixed bit widths and two’s complement.',
		group: 'convert',
		client: true,
		meta: ['bigint', '8/16/32/64'],
		keys: ['decimal', 'hex', 'hexadecimal', 'binary', 'octal', 'base', 'convert', 'radix']
	},
	{
		id: 'hsl',
		href: '/hsl',
		name: 'HSL → Hex',
		blurb: 'Dial in a hue, saturation and lightness and copy the exact hex, RGB and CSS value.',
		group: 'convert',
		client: true,
		meta: ['colour', 'alpha', 'css'],
		keys: ['hsl', 'hsla', 'hslc', 'hex', 'colour', 'color', 'rgb', 'alpha', 'picker', 'convert']
	},
	{
		id: 'parse-js',
		href: '/parse/js',
		name: 'JS / TS Parser',
		blurb:
			'Parse JavaScript and TypeScript with Babel, inspect the AST and read recovery-mode errors.',
		group: 'parse',
		client: true,
		meta: ['babel', 'jsx', 'typescript'],
		keys: ['javascript', 'typescript', 'js', 'ts', 'ast', 'parser', 'babel', 'jsx', 'syntax']
	},
	{
		id: 'parse-python',
		href: '/parse/python',
		name: 'Python Parser',
		blurb:
			'Build a concrete syntax tree for Python source and catch structural errors as you type.',
		group: 'parse',
		client: true,
		meta: ['lezer', 'cst'],
		keys: ['python', 'py', 'ast', 'parser', 'lezer', 'syntax', 'cst']
	},
	{
		id: 'parse-rust',
		href: '/parse/rust',
		name: 'Rust Parser',
		blurb: 'Inspect the syntax tree of Rust items, expressions and patterns without compiling.',
		group: 'parse',
		client: true,
		meta: ['lezer', 'cst'],
		keys: ['rust', 'rs', 'ast', 'parser', 'lezer', 'syntax', 'cst']
	},
	{
		id: 'parse-css',
		href: '/parse/css',
		name: 'CSS Parser',
		blurb: 'Walk rules, selectors, declarations and at-rules as a tree, with error positions.',
		group: 'parse',
		client: true,
		meta: ['lezer', 'cst'],
		keys: ['css', 'stylesheet', 'ast', 'parser', 'lezer', 'syntax', 'rules', 'selectors']
	},
	{
		id: 'parse-json',
		href: '/parse/json',
		name: 'JSON Parser',
		blurb: 'A strict, hand-written JSON parser with precise error offsets plus format and minify.',
		group: 'parse',
		client: true,
		meta: ['strict', 'format'],
		keys: ['json', 'ast', 'parser', 'validate', 'format', 'pretty', 'minify', 'strict']
	},
	{
		id: 'ip',
		href: '/ip',
		name: 'IP Lookup',
		blurb: 'Look up the country, city, network and ASN behind any address or domain.',
		group: 'network',
		client: false,
		meta: ['geo', 'asn'],
		keys: ['ip', 'lookup', 'geo', 'geolocation', 'asn', 'country', 'isp', 'network']
	},
	{
		id: 'site-check',
		href: '/site-check',
		name: 'Site Checker',
		blurb: 'Run HTTP, ping, TCP and DNS checks from nodes around the world via check-host.net.',
		group: 'network',
		client: false,
		meta: ['http', 'ping', 'tcp', 'dns'],
		keys: [
			'site',
			'checker',
			'uptime',
			'http',
			'ping',
			'tcp',
			'dns',
			'check-host',
			'status',
			'nodes'
		]
	}
];

export function findTool(id: string): Tool | undefined {
	return TOOLS.find((t) => t.id === id);
}

export function toolsByGroup(group: ToolGroup): Tool[] {
	return TOOLS.filter((t) => t.group === group);
}
