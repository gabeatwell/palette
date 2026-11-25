<script lang="ts">
	import { page } from '$app/state';

	interface Props {
		title: string;
		description: string;
		keywords: string;
		image?: string;
		siteType?: string;
	}

	let { keywords, description, title, image, siteType = 'website' }: Props = $props();

	let url = $derived(page.url.href);
	let baseUrl = $derived(page.url.origin);
	let siteName = 'PixiPalette';
	let ogImage = $derived(image ? `${baseUrl}${image}` : `${baseUrl}/logos/pixipalette.webp`);

	// JSON string only — no <script> tags here (avoids parser pitfalls)
	let jsonLd = $derived.by(() => {
		const schema =
			siteType === 'article'
				? {
						'@context': 'https://schema.org',
						'@type': 'Article',
						headline: title,
						description,
						image: ogImage,
						url,
						inLanguage: 'en',
						author: { '@type': 'Organization', name: siteName },
						publisher: {
							'@type': 'Organization',
							name: siteName,
							logo: { '@type': 'ImageObject', url: ogImage }
						}
					}
				: {
						'@context': 'https://schema.org',
						'@type': 'WebSite',
						name: siteName,
						url: baseUrl,
						description
					};

		// escape `<` so nothing can break out of the tag
		return JSON.stringify(schema).replace(/</g, '\\u003c');
	});
</script>

<svelte:head>
	<title>{title}</title>

	<meta name="description" content={description} />
	<meta name="keywords" content={keywords} />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />

	<link rel="canonical" href={url} />

	<meta name="robots" content="index, follow" />
	<meta property="og:locale" content="en_US" />

	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:type" content={siteType} />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:alt" content={`${title} - ${siteName}`} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:type" content="image/webp" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
	<meta name="twitter:image:alt" content={`${title} - ${siteName}`} />

	<!-- eslint-disable-next-line svelte/no-at-html-tags — jsonLd is internal + `<` escaped -->
	{@html '<script type="application/ld+json">' + jsonLd + '</scr' + 'ipt>'}
</svelte:head>
