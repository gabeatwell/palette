<script lang="ts">
	import { parse, formatHex, formatRgb, converter } from 'culori';
	import type { Color } from 'culori';

	let imageUrl = $state('');
	let colors = $state<string[]>([]);
	let imageInput: HTMLInputElement;
	let colorFormat = $state('');
	let relativeColor = $state('');

	const RELATIVE_TOKENS: Record<string, string> = {
		rgb: 'r g b',
		hsl: 'h s l',
		hwb: 'h w b',
		lab: 'l a b',
		lch: 'l c h',
		oklab: 'l a b',
		oklch: 'l c h'
	};

	const toHsl = converter('hsl');
	const toOklch = converter('oklch');
	const toLab = converter('lab');
	const toLch = converter('lch');
	const toOklab = converter('oklab');

	function handleImageUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (file) {
			const reader = new FileReader();

			reader.onload = (e) => {
				const result = e.target?.result;
				if (typeof result !== 'string') return;
				imageUrl = result;
				extractColors(result);
			};

			reader.readAsDataURL(file);
		}
	}

	function parseRgb(rgb: string): number[] {
		return rgb.match(/\d+/g)?.map(Number) ?? [];
	}

	function extractColors(imageSrc: string) {
		const img = new Image();
		img.src = imageSrc;

		img.onload = () => {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			if (!ctx) return;
			canvas.width = img.width;
			canvas.height = img.height;

			ctx.drawImage(img, 0, 0);

			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
			const colorMap = new Map<string, number>();

			// Sample colors with better spacing
			for (let i = 0; i < imageData.length; i += 20) {
				const r = Math.floor(imageData[i] / 16) * 16;
				const g = Math.floor(imageData[i + 1] / 16) * 16;
				const b = Math.floor(imageData[i + 2] / 16) * 16;

				// Skip very dark and very light colors
				if (r + g + b < 60 || r + g + b > 740) continue;

				// Calculate color difference to ensure colors are distinct
				const rgb = `rgb(${r},${g},${b})`;
				let isDistinct = true;

				for (const existingColor of colorMap.keys()) {
					const [er, eg, eb] = parseRgb(existingColor);
					const colorDiff = Math.sqrt(
						Math.pow(r - er, 2) + Math.pow(g - eg, 2) + Math.pow(b - eb, 2)
					);

					if (colorDiff < 60) {
						// Adjust this threshold to control color distinction
						isDistinct = false;
						break;
					}
				}

				if (isDistinct) {
					colorMap.set(rgb, (colorMap.get(rgb) || 0) + 1);
				}
			}

			// Get top 5 most common colors
			colors = Array.from(colorMap.entries())
				.sort((a, b) => b[1] - a[1])
				.slice(0, 5)
				.map((entry) => entry[0]);
		};
	}

	function getContrastColor(rgb: string) {
		// Extract RGB values from the rgb string
		const [r, g, b] = parseRgb(rgb);

		// Calculate relative luminance using the formula
		const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

		// Return white for dark colors, black for light colors
		return luminance > 0.5 ? '#000000' : '#ffffff';
	}

	function convertColor(rgbStr: string, format: string) {
		if (format === 'rgb') return rgbStr;

		const c = parse(rgbStr);
		if (!c) return rgbStr;

		switch (format) {
			case 'hex':
				return formatHex(c);
			case 'hsl': {
				const h = toHsl(c);
				if (!h) return rgbStr;
				return `hsl(${Math.round(h.h ?? 0)} ${Math.round(h.s * 100)}% ${Math.round(h.l * 100)}%)`;
			}
			case 'oklch': {
				const o = toOklch(c);
				if (!o) return rgbStr;
				return `oklch(${(o.l * 100).toFixed(1)}% ${o.c.toFixed(3)} ${Math.round(o.h ?? 0)})`;
			}
			default:
				return rgbStr;
		}
	}

	const LIGHT_BUMP = 0.15; // add 15% relative lightness so the change is visible

	function relativeTransformed(
		rgbStr: string,
		space: string
	): { syntax: string; resolved: Color | string } {
		const origin = convertColor(rgbStr, colorFormat);
		const base = parse(rgbStr);
		if (!base) return { syntax: origin, resolved: rgbStr };

		switch (space) {
			case 'hsl': {
				const t = toHsl(base);
				if (!t) return { syntax: origin, resolved: base };
				t.l = Math.min(1, (t.l ?? 0) + LIGHT_BUMP);
				return { syntax: `hsl(from ${origin} h s ${Math.round(t.l * 100)}%)`, resolved: t };
			}
			case 'oklch': {
				const t = toOklch(base);
				if (!t) return { syntax: origin, resolved: base };
				t.l = Math.min(1, (t.l ?? 0) + LIGHT_BUMP);
				return {
					syntax: `oklch(from ${origin} ${Math.round(t.l * 100)}% ${(t.c ?? 0).toFixed(3)} ${Math.round(t.h ?? 0)})`,
					resolved: t
				};
			}
			case 'oklab': {
				const t = toOklab(base);
				if (!t) return { syntax: origin, resolved: base };
				t.l = Math.min(1, (t.l ?? 0) + LIGHT_BUMP);
				return {
					syntax: `oklab(from ${origin} ${Math.round(t.l * 100)}% ${(t.a ?? 0).toFixed(3)} ${(t.b ?? 0).toFixed(3)})`,
					resolved: t
				};
			}
			case 'lab': {
				const t = toLab(base);
				if (!t) return { syntax: origin, resolved: base };
				t.l = Math.min(100, (t.l ?? 0) + LIGHT_BUMP * 100);
				return {
					syntax: `lab(from ${origin} ${t.l.toFixed(1)} ${(t.a ?? 0).toFixed(1)} ${(t.b ?? 0).toFixed(1)})`,
					resolved: t
				};
			}
			case 'lch': {
				const t = toLch(base);
				if (!t) return { syntax: origin, resolved: base };
				t.l = Math.min(100, (t.l ?? 0) + LIGHT_BUMP * 100);
				return {
					syntax: `lch(from ${origin} ${t.l.toFixed(1)} ${(t.c ?? 0).toFixed(3)} ${Math.round(t.h ?? 0)})`,
					resolved: t
				};
			}
			default: {
				// rgb / hwb have no single lightness channel → identity wrap
				const tokens = RELATIVE_TOKENS[space] ?? 'r g b';
				return { syntax: `${space}(from ${origin} ${tokens})`, resolved: base };
			}
		}
	}

	function preview(rgbStr: string) {
		const origin = convertColor(rgbStr, colorFormat);
		if (!relativeColor) return { text: origin, swatch: rgbStr };

		const { syntax, resolved } = relativeTransformed(rgbStr, relativeColor);
		// formatRgb keeps it as "rgb(r g b)" so getContrastColor + background both work
		const swatch = typeof resolved === 'string' ? resolved : (formatRgb(resolved) ?? rgbStr);
		return { text: syntax, swatch };
	}
</script>

<div class="wrapper">
	<div class="inner">
		<input
			type="file"
			accept="image/*"
			bind:this={imageInput}
			onchange={handleImageUpload}
			class="file-input"
		/>

		{#if imageUrl}
			<img src={imageUrl} alt="Uploaded item" class="preview-image" />
		{/if}

		<div class="selects">
			<select class="format-select" bind:value={colorFormat}>
				<option value="" disabled>Color Format</option>
				<option value="rgb">RGB</option>
				<option value="hex">HEX</option>
				<option value="hsl">HSL</option>
				<option value="oklch">OKLCH</option>
			</select>

			<select class="format-select" bind:value={relativeColor}>
				<option value="" disabled>Relative Color</option>
				<option value="rgb">rgb()</option>
				<option value="hsl">hsl()</option>
				<option value="hwb">hwb()</option>
				<option value="lab">lab()</option>
				<option value="lch">lch()</option>
				<option value="oklab">oklab()</option>
				<option value="oklch">oklch()</option>
			</select>
		</div>

		<div class="color-palette">
			{#each colors as color}
				{@const p = preview(color)}
				<div class="color-box" style:background-color={p.swatch}>
					<span class="color-value" style:color={getContrastColor(p.swatch)}>
						{p.text}
					</span>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	:global(body) {
		background-color: #f0f0f0;
	}

	.wrapper {
		padding: 1.2rem;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 1.2rem;
		min-height: 100dvh;
		width: 100%;

		@media (max-width: 500px) {
			padding: 0.8rem;
			width: 99%;
			position: absolute;
			left: 50%;
			transform: translateX(-50%);
		}
	}

	.inner {
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
		align-items: center;
		justify-content: center;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
		padding: 0.75rem 1.25rem;
		width: clamp(250px, 90vw, 1000px);
		margin-bottom: 18em;
		background-color: #fff;
		border-radius: 0.3em;

		@media (max-width: 500px) {
			padding: 0.5rem;
			margin-inline: auto;
		}

		.color-palette {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
			gap: 1rem;
			width: 100%;
			padding: 0.5rem;
			box-sizing: border-box;

			@media (max-width: 500px) {
				grid-template-columns: repeat(2, 1fr);
				padding: 0;
				width: 100%;
			}

			.color-box {
				width: 100%;
				height: 80%;
				border-radius: 8px;
				display: flex;
				justify-content: center;
				align-items: center;
				position: relative;
				aspect-ratio: 1;

				.color-value {
					padding: 0.25rem 0.75rem;
					border-radius: 4px;
					font-family: var(--sans);
					font-size: clamp(1.1rem, 2.5vw, 1.35rem);
					text-shadow: none;
					display: flex;
					justify-content: center;
					align-items: center;
					gap: 5rem;
					text-align: center;
					width: auto;
					height: auto;
					word-break: break-all;
				}
			}
		}

		.selects {
			display: flex;
			flex-wrap: wrap;
			justify-content: center;
			align-items: center;
			gap: 1em;
			width: 100%;

			@media (width <= 768px) {
				flex-direction: column;
				gap: 0;
			}
		}

		.format-select {
			padding: 0.5rem;
			border: 2px solid hsl(0, 0%, 11%);
			border-radius: 4px;
			font-family: var(--sans);
			font-size: clamp(1rem, 2vw, 1.5rem);
			background-color: hsl(0, 0%, 91%);
			cursor: pointer;
			width: 100%;
			max-width: 200px;
			margin-bottom: 0.5rem;
			color: hsl(0, 0%, 11%);

			&:hover {
				border-color: #bdbdbd;
			}

			&:focus {
				outline: none;
				border-color: #242424;
				box-shadow: 0 0 0 2px rgba(36, 36, 36, 0.1);

				&:hover {
					border-color: #242424;
				}
			}

			& option {
				padding: 0.5rem;
				font-family: var(--sans);
			}
		}

		.file-input {
			color: hsl(0, 0%, 41%);
			padding: 0.5rem 0.75rem;
			padding-bottom: 1rem;
			margin-bottom: 1.2rem;
			border: none;
			font-family: var(--sans);
			font-size: clamp(0.875rem, 1.5vw, 1.22rem);
			width: 100%;
			max-width: 100%;
			box-sizing: border-box;
			cursor: pointer;

			&::file-selector-button {
				margin-right: 1em;
				padding: 0.5rem 1rem;
				border: 1px solid hsl(0, 0%, 11%);
				border-radius: 5px;
				background-color: hsl(0, 0%, 90%);
				color: hsl(0, 0%, 11%);
				cursor: pointer;
				font-size: clamp(0.875rem, 1.75vw, 1.5rem);
				white-space: nowrap;

				&:hover {
					background-color: #e0e0e0;
				}
			}
		}
	}

	.preview-image {
		max-width: 100%;
		height: auto;
		max-height: 400px;
		object-fit: contain;
	}
</style>
