import { error } from '@sveltejs/kit';
import { LANGS, isLang } from '#lib/tools/parsers';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	if (!isLang(params.lang)) {
		error(404, `There is no parser for “${params.lang}”.`);
	}

	return { lang: params.lang, meta: LANGS[params.lang] };
};
