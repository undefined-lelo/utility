export interface IpGeo {
	status?: 'success' | 'fail';
	message?: string;
	continent?: string;
	continentCode?: string;
	country?: string;
	countryCode?: string;
	region?: string;
	regionName?: string;
	city?: string;
	district?: string;
	zip?: string;
	lat?: number;
	lon?: number;
	timezone?: string;
	offset?: number;
	currency?: string;
	isp?: string;
	org?: string;
	as?: string;
	asname?: string;
	reverse?: string;
	mobile?: boolean;
	proxy?: boolean;
	hosting?: boolean;
	query?: string;
}

export interface GeoResponse {
	query?: string | null;
	local?: boolean;
	cached?: boolean;
	geo?: IpGeo | null;
	error?: string;
	note?: string;
}

export function isIPv4(value: string): boolean {
	return /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(value);
}

export function isIPv6(value: string): boolean {
	if (!value.includes(':') || value.length > 45) return false;
	if (!/^[0-9a-f:.]+$/i.test(value)) return false;
	return value.split('::').length - 1 <= 1;
}

export function isIpLike(value: string): boolean {
	return isIPv4(value) || isIPv6(value);
}

export function isHostname(value: string): boolean {
	if (value.length > 253) return false;
	return /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(value);
}

export function isPrivateIp(value: string): boolean {
	if (isIPv4(value)) {
		const [a, b] = value.split('.').map(Number);
		return (
			a === 0 ||
			a === 10 ||
			a === 127 ||
			(a === 172 && b >= 16 && b <= 31) ||
			(a === 192 && b === 168) ||
			(a === 169 && b === 254) ||
			(a === 100 && b >= 64 && b <= 127)
		);
	}

	const lower = value.toLowerCase();
	return (
		lower === '::1' ||
		lower === '::' ||
		lower.startsWith('fc') ||
		lower.startsWith('fd') ||
		lower.startsWith('fe80')
	);
}

export function osmLink(lat: number | string, lon: number | string): string {
	return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=11/${lat}/${lon}`;
}
