export let imageUrl = $state('');
export let colors = $state<string[]>([]);
export let imageInput: HTMLInputElement;
export const colorFormat = $state('rgb');

export function handleImageUpload(event: Event) {
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

export function parseRgb(rgb: string): number[] {
	return rgb.match(/\d+/g)?.map(Number) ?? [];
}

export function extractColors(imageSrc: string) {
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

export function getContrastColor(rgb: string) {
	// Extract RGB values from the rgb string
	const [r, g, b] = parseRgb(rgb);

	// Calculate relative luminance using the formula
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

	// Return white for dark colors, black for light colors
	return luminance > 0.5 ? '#000000' : '#ffffff';
}

export function convertColor(rgbStr: string, format: string) {
	// Extract RGB values
	const [r, g, b] = parseRgb(rgbStr);

	switch (format) {
		case 'hex':
			return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
		case 'hsl': {
			// Convert RGB to HSL
			const r1 = r / 255;
			const g1 = g / 255;
			const b1 = b / 255;

			const max = Math.max(r1, g1, b1);
			const min = Math.min(r1, g1, b1);
			let h = 0,
				s = 0;
			const l = (max + min) / 2;

			if (max !== min) {
				const d = max - min;
				s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
				switch (max) {
					case r1:
						h = (g1 - b1) / d + (g1 < b1 ? 6 : 0);
						break;
					case g1:
						h = (b1 - r1) / d + 2;
						break;
					case b1:
						h = (r1 - g1) / d + 4;
						break;
				}
				h /= 6;
			}

			return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
		}
		default:
			return rgbStr;
	}
}
