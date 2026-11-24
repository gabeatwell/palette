# Palette Pro

A browser-based color palette generator built with **SvelteKit 2 + Svelte 5 (runes)**. Upload an
image and Palette Pro samples it, isolates the most dominant distinct colors, and renders them as
swatches — with on-demand conversion into multiple CSS color formats and live **CSS Relative Color
Syntax** output.

---

## Features

- **Image → palette**: uploads a local image (no server, no uploads — everything runs in the browser).
- **Dominant-color extraction**: samples pixel data and returns the **top 5 most common, visually
  distinct** colors.
- **Multi-format display**: switch the swatch labels between **RGB, HEX, HSL, and OKLCH**.
- **Relative Color Syntax**: a second selector wraps the current color into a real CSS relative-color
  expression (e.g. `oklch(from #b34711 70% c h)`), with the swatch painted from the **computed** result.
- **Readable labels**: contrast-aware text so values stay legible on any swatch.

---

## Tech Stack

| Concern         | Choice                           | Notes                              |
| --------------- | -------------------------------- | ---------------------------------- |
| Framework       | SvelteKit 2 / Svelte 5 runes     | `$state`, `$derived`, `{@const}`   |
| Language        | TypeScript (strict)              | `moduleResolution: "bundler"`      |
| Build           | Vite 6                           | via `@sveltejs/vite-plugin-svelte` |
| Color math      | **culori 4**                     | sRGB↔OKLCH/HSL conversions         |
| Package manager | **pnpm**                         | see `pnpm-lock.yaml`               |
| Quality         | ESLint + Prettier + svelte-check | `pnpm lint` / `pnpm check`         |

---

## Getting Started

```bash
# install dependencies
pnpm install

# start the dev server (hosted, see vite dev --host)
pnpm dev

# production build
pnpm build

# preview the production build
pnpm preview
```

## Scripts

| Command        | What it does                                  |
| -------------- | --------------------------------------------- |
| `pnpm dev`     | Start Vite dev server with `--host`           |
| `pnpm build`   | Production build via Vite + SvelteKit adapter |
| `pnpm preview` | Serve the built output locally                |
| `pnpm check`   | `svelte-check` type/lint pass over `.svelte`  |
| `pnpm lint`    | Prettier check + ESLint                       |
| `pnpm format`  | Prettier write                                |

## How it works

1. Color extraction `(extractColors)`

- The uploaded image is drawn to an offscreen <canvas> and read via `getImageData`.
- Pixels are sampled every 20 bytes (~every 5th pixel) and bucketed to 16-unit steps to cluster
  similar colors.
- Very dark / very light pixels are skipped (`r+g+b < 60 || > 740`).
- A color is kept only if its Euclidean RGB distance to every already-kept color is ≥ 60
  (this is the “distinctness” knob — lower it for more similar colors, raise it for more contrast).
- The 5 highest-frequency buckets become the palette.

2. Format conversion (convertColor, via culori)
   Stored colors are canonical `rgb(r,g,b)` strings. Display formats are computed on demand:

- HEX → `formatHex(c)`
- HSL → `converter('hsl')` with components rounded (h, s%, l%)
- OKLCH → `converter('oklch')`, rendered compactly as `oklch(L% C H)`
  Conversions go through culori (sRGB → linear → XYZ → Oklab → OkLch) rather than hand-rolled math,
  so the gamma handling is correct. Components are rounded and stripped of noisy decimals so labels
  fit inside the square swatches.

3. Relative Color Syntax (the second selector)
   CSS relative color syntax decouples the function name (target space) from the origin color:
   the `<from>` value may be any valid CSS color, so every `format × relative` pairing is valid
   and resolves to the same color (a channel-keyword form like `…(from X l c h)` is an identity).

Palette Pro demonstrates relative color working by applying a real transform (a lightness bump,
`LIGHT_BUMP = 0.15`):

- the label shows the actual relative-color expression (e.g. `oklch(from … 70% c h)`), and
- the swatch background is painted with the culori-computed result, so you can see the effect.

`rgb()` / `hwb` targets have no single lightness channel, so they wrap as an identity relative
color (the swatch is unchanged but the syntax still resolves).

- The resolved color is emitted as rgb(...) (via formatRgb), not hex, because getContrastColor
  parses digits to choose black/white label text.

## Project Structure

```text
palette/
├─ src/
│  ├─ lib/
│  │  └─ components/
│  │     ├─ Palette.svelte        # main feature: upload, extraction, format + relative-color selects
│  │     ├─ Nav.svelte / Burger.svelte / Github.svelte / Title.svelte / SEO.svelte
│  │     └─ palette.svelte.ts     # shared color helpers (parseRgb, getContrastColor, …)
│  ├─ routes/
│  │  ├─ +layout.svelte          # app shell (nav/footer)
│  │  ├─ +page.svelte            # home → <Palette/>
│  │  └─ about/+page.svelte
│  ├─ app.css / app.html / app.d.ts
├─ svelte.config.js              # @sveltejs/adapter-auto
├─ vite.config.js
├─ tsconfig.json                 # extends .svelte-kit, strict, bundler resolution
└─ package.json
```

## Key Component State

| State           | Purpose                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------- |
| `imageUrl`      | Data URL preview of the uploaded image                                                         |
| `colors`        | Extracted palette (`rgb(...)` strings)                                                         |
| `colorFormat`   | Display format: `''` (placeholder) \| `rgb` \| `hex` \| `hsl` \| `oklch`                       |
| `relativeColor` | Relative-color target: `''` \| `rgb` \| `hsl` \| `hwb` \| `lab` \| `lch` \| `oklab` \| `oklch` |

Each `<select>` defaults to a disabled placeholder option whose text describes the control
(“Color Format” / “Relative Color”). `bind:value` (not bind:this) binds the chosen option’s value.

---

### Browser Support

Relative color syntax renders live in Chrome 119+, Edge 119+, Safari 16.4+, Firefox 128+. The
label text is valid CSS regardless; only the painted background depends on support. For older
browsers, fall back to showing the plain convertColor output.

### Engineering Notes & Gotchas (learned the hard way)

- Don’t trust the package blindly. The original attempt used `d3-color`, but the installed
  `d3-color@3.1.1` shipped no OKLab/OKLCH despite the real package advertising them — a strong
  integrity/typosquat signal. If a dependency’s behavior doesn’t match its documented API,
  pnpm why and inspect its dist before trusting it.
- `culori` types are external. The runtime is JS-only; `@types/culori` (4.x) provides the
  declarations. Without it you get implicit-any.
- Channels are `number | undefined`. culori colors (e.g. `HslColor`, `OklchColor`) mark channels
  like `h`/`a`/`b`/`c` as optional (undefined = achromatic). Guard with `?? 0` before arithmetic or
  `.toFixed()`, otherwise strict rejects `number | undefined`.
- Avoid `ConvertFn` variance traps in maps. Storing `converter('rgb')` and `converter('oklch')`
  in one `Record` causes `ConvertFn<"rgb">` not-assignable errors; instead use each typed converter
  inside a `switch` so channel access stays typed and any-free.
- Contrast needs parseable input. `getContrastColor` extracts digits, so feed swatch/contrast
  colors as `rgb(...)`, not hex or oklch.

Author: [Gabe Atwell](https://github.com/gabeatwell)
Portfolio: [atwell.dev](https://atwell.dev/)
