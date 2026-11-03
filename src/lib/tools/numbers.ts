export type BitWidth = 'auto' | 8 | 16 | 32 | 64;

export interface BaseConversion {
	ok: true;
	input: string;
	negative: boolean;
	hex: string;
	hexBytes: string[];
	binary: string;
	octal: string;
	decimal: string;
	width: BitWidth;
	usedWidth: number;
	twoComplement: boolean;
}

export interface BaseError {
	ok: false;
	error: string;
}

const WIDTH_DIGITS: Record<Exclude<BitWidth, 'auto'>, number> = { 8: 2, 16: 4, 32: 8, 64: 16 };

const MAX_UNSIGNED = 2n ** 64n - 1n;

function groupHex(hex: string): string[] {
	const padded = hex.padStart(Math.ceil(hex.length / 2) * 2, '0');
	const out: string[] = [];
	for (let i = 0; i < padded.length; i += 2) out.push(padded.slice(i, i + 2));
	return out;
}

export function decimalToBases(raw: string, width: BitWidth): BaseConversion | BaseError {
	const cleaned = raw.trim().replace(/[_\s]/g, '');
	if (!cleaned) return { ok: false, error: 'Enter a decimal integer.' };

	const negative = cleaned.startsWith('-');
	const digits = negative ? cleaned.slice(1) : cleaned;

	if (!/^\d+$/.test(digits)) {
		return { ok: false, error: 'Decimal only — digits 0–9 with an optional leading minus.' };
	}

	let abs: bigint;
	try {
		abs = BigInt(digits);
	} catch {
		return { ok: false, error: 'That number is too large to parse.' };
	}

	if (negative && abs === 0n) {
		return {
			ok: true,
			input: cleaned,
			negative: false,
			hex: '0x0',
			hexBytes: ['00'],
			binary: '0b0',
			octal: '0o0',
			decimal: '0',
			width,
			usedWidth: width === 'auto' ? 8 : width,
			twoComplement: false
		};
	}

	if (width === 'auto') {
		if (abs > MAX_UNSIGNED) {
			return { ok: false, error: `Out of range — the maximum is ${MAX_UNSIGNED} (2⁶⁴ − 1).` };
		}
		const hexDigits = abs.toString(16).toUpperCase();
		const padTo = Math.max(2, Math.ceil(hexDigits.length / 2) * 2);
		const hex = hexDigits.padStart(padTo, '0');
		return {
			ok: true,
			input: cleaned,
			negative,
			hex: `${negative ? '-' : ''}0x${hex}`,
			hexBytes: groupHex(hex),
			binary: `${negative ? '-' : ''}0b${abs.toString(2)}`,
			octal: `${negative ? '-' : ''}0o${abs.toString(8)}`,
			decimal: cleaned,
			width,
			usedWidth: padTo * 4,
			twoComplement: false
		};
	}

	const bits = BigInt(width);
	const maxSigned = 2n ** (bits - 1n) - 1n;
	const mod = 2n ** bits;

	if (!negative && abs > mod - 1n) {
		return { ok: false, error: `${abs} does not fit in ${width} bits (max ${mod - 1n}).` };
	}
	if (negative && abs > maxSigned + 1n) {
		return { ok: false, error: `-${abs} does not fit in ${width} bits (min -${maxSigned + 1n}).` };
	}

	const value = negative ? mod - abs : abs;
	const hexDigits = WIDTH_DIGITS[width];
	const hex = value.toString(16).toUpperCase().padStart(hexDigits, '0');
	const padded = hex.padStart(Math.ceil(hex.length / 2) * 2, '0');

	return {
		ok: true,
		input: cleaned,
		negative,
		hex: `0x${hex}`,
		hexBytes: groupHex(padded),
		binary: `0b${value.toString(2).padStart(width, '0')}`,
		octal: `0o${value.toString(8)}`,
		decimal: value.toString(10),
		width,
		usedWidth: width,
		twoComplement: negative
	};
}
