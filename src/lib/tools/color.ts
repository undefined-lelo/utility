export interface Hsl {
	h: number;
	s: number;
	l: number;
	a: number;
}

export interface Rgb {
	r: number;
	g: number;
	b: number;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round = (n: number) => Math.round(n);

export function hslToRgb({ h, s, l }: Hsl): Rgb {
	const hue = ((h % 360) + 360) % 360;
	const sat = clamp(s, 0, 100) / 100;
	const lig = clamp(l, 0, 100) / 100;

	const c = (1 - Math.abs(2 * lig - 1)) * sat;
	const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
	const m = lig - c / 2;

	let r = 0;
	let g = 0;
	let b = 0;

	if (hue < 60) [r, g, b] = [c, x, 0];
	else if (hue < 120) [r, g, b] = [x, c, 0];
	else if (hue < 180) [r, g, b] = [0, c, x];
	else if (hue < 240) [r, g, b] = [0, x, c];
	else if (hue < 300) [r, g, b] = [x, 0, c];
	else [r, g, b] = [c, 0, x];

	return {
		r: clamp(round((r + m) * 255), 0, 255),
		g: clamp(round((g + m) * 255), 0, 255),
		b: clamp(round((b + m) * 255), 0, 255)
	};
}

export function rgbToHsl({ r, g, b }: Rgb, a = 1): Hsl {
	const rn = clamp(r, 0, 255) / 255;
	const gn = clamp(g, 0, 255) / 255;
	const bn = clamp(b, 0, 255) / 255;

	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const delta = max - min;
	const l = (max + min) / 2;

	let h = 0;
	let s = 0;

	if (delta !== 0) {
		s = delta / (1 - Math.abs(2 * l - 1));
		switch (max) {
			case rn:
				h = 60 * (((gn - bn) / delta) % 6);
				break;
			case gn:
				h = 60 * ((bn - rn) / delta + 2);
				break;
			default:
				h = 60 * ((rn - gn) / delta + 4);
		}
	}

	return {
		h: Math.round(((h % 360) + 360) % 360),
		s: Math.round(s * 100),
		l: Math.round(l * 100),
		a
	};
}

const hex2 = (n: number) => clamp(round(n), 0, 255).toString(16).padStart(2, '0');

export function rgbToHex({ r, g, b }: Rgb, a = 1, withHash = true): string {
	const base = `${hex2(r)}${hex2(g)}${hex2(b)}`;
	const alpha = a < 1 ? hex2(a * 255) : '';
	return `${withHash ? '#' : ''}${base}${alpha}`.toUpperCase();
}

export function hslToHex(hsl: Hsl, withHash = true): string {
	return rgbToHex(hslToRgb(hsl), hsl.a, withHash);
}

export function rgbToCss({ r, g, b }: Rgb, a = 1): string {
	return a < 1 ? `rgb(${r} ${g} ${b} / ${+a.toFixed(3)})` : `rgb(${r} ${g} ${b})`;
}

export function hslToCss(hsl: Hsl): string {
	const { h, s, l, a } = hsl;
	return a < 1 ? `hsl(${h} ${s}% ${l}% / ${+a.toFixed(3)})` : `hsl(${h} ${s}% ${l}%)`;
}

export function parseHex(input: string): { rgb: Rgb; a: number } | null {
	const raw = input.trim().replace(/^#/, '');
	if (!/^[0-9a-f]{3,8}$/i.test(raw)) return null;

	let hex = raw;
	if (hex.length === 3 || hex.length === 4) {
		hex = [...hex].map((c) => c + c).join('');
	}
	if (hex.length !== 6 && hex.length !== 8) return null;

	const num = (i: number) => parseInt(hex.slice(i, i + 2), 16);
	const a = hex.length === 8 ? num(6) / 255 : 1;
	return { rgb: { r: num(0), g: num(2), b: num(4) }, a: Math.round(a * 100) / 100 };
}

export function parseColor(input: string): Hsl | null {
	const value = input.trim().toLowerCase();

	const hex = parseHex(value);
	if (hex) return rgbToHsl(hex.rgb, hex.a);

	const fn = value.match(/^(rgba?|hsla?)\(([^)]+)\)$/);
	if (!fn) return null;

	const parts = fn[2]
		.replace(/\//g, ' ')
		.split(/[\s,]+/)
		.filter(Boolean);

	if (fn[1].startsWith('rgb')) {
		const [r, g, b] = parts.slice(0, 3).filter((p) => p !== '');
		if (!r || !g || !b) return null;
		const num = (p: string) => (p.endsWith('%') ? (parseFloat(p) / 100) * 255 : parseFloat(p));
		if ([r, g, b].some((p) => Number.isNaN(num(p)))) return null;
		const a = parts[3] !== undefined ? clamp(parseFloat(parts[3]), 0, 1) : 1;
		return rgbToHsl({ r: num(r), g: num(g), b: num(b) }, Number.isNaN(a) ? 1 : a);
	}

	const h = parseFloat(parts[0] ?? '');
	const s = parseFloat(parts[1] ?? '');
	const l = parseFloat(parts[2] ?? '');
	if ([h, s, l].some(Number.isNaN)) return null;
	const a = parts[3] !== undefined ? clamp(parseFloat(parts[3]), 0, 1) : 1;

	return {
		h: ((h % 360) + 360) % 360,
		s: clamp(s, 0, 100),
		l: clamp(l, 0, 100),
		a: Number.isNaN(a) ? 1 : a
	};
}

export function isLight({ r, g, b }: Rgb): boolean {
	const lin = (c: number) => {
		const n = c / 255;
		return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) > 0.45;
}
