import { env } from '$env/dynamic/public';

export const prerender = true;

const routes = [
	{ path: '/', priority: '1.0', changefreq: 'weekly' },
	{ path: '/about', priority: '0.7', changefreq: 'monthly' }
];

export function GET() {
	const origin = env.PUBLIC_SITE_URL ?? 'https://pixipalette.vercel.app';
	const lastmod = new Date().toISOString().split('T')[0];

	const xml =
		`<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
		routes
			.map(
				(r) =>
					`  <url><loc>${origin}${r.path}</loc><lastmod>${lastmod}</lastmod>` +
					`<changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`
			)
			.join('\n') +
		`\n</urlset>\n`;

	return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
