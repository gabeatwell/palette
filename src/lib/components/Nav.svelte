<script lang="ts">
	import Title from '$lib/components/Title.svelte';

	let isMenuOpen = $state(false);
	let isClosing = $state(false);

	const navItems = [
		{ href: '/', label: 'Home' },
		{ href: '/about', label: 'About' }
	];

	function toggleMenu() {
		if (isMenuOpen) {
			isClosing = true;

			setTimeout(() => {
				isMenuOpen = false;
				isClosing = false;
			}, 10);
		} else {
			isMenuOpen = true;
		}
	}
</script>

<nav>
	<div class="nav-container">
		<div class="nav-content">
			<Title />

			<div class="desktop-menu">
				{#each navItems as { href, label }}
					<a {href} class="nav-link">
						{label}
					</a>
				{/each}
			</div>

			<button
				class="burger"
				onclick={toggleMenu}
				aria-label="Toggle menu"
				class:active={isMenuOpen}
			>
				<span class="bar"></span>
				<span class="bar"></span>
				<span class="bar"></span>
			</button>
		</div>
	</div>

	{#if isMenuOpen || isClosing}
		<div class="mobile-menu" class:closing={isClosing}>
			{#each navItems as { href, label }}
				<a {href} class="mobile-nav-link" onclick={toggleMenu}>
					{label}
				</a>
			{/each}
		</div>
	{/if}
</nav>

<style>
	nav {
		background-color: white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		position: relative;

		.nav-container {
			max-width: 100%;
			margin-inline: auto;
			padding: 0;

			.nav-content {
				display: flex;
				justify-content: space-around;

				align-items: center;
				block-size: auto;

				@media (width <= 1400px) {
					justify-content: space-evenly;
				}
			}
		}

		.desktop-menu {
			display: none;

			@media (min-width: 768px) {
				display: flex;
				align-items: center;
			}
		}

		.nav-link {
			padding: 0.5rem 0.75rem;
			text-decoration: none;
			color: hsl(0, 0%, 31%);
			font-family: var(--sans-bold);
			font-size: clamp(1.25rem, 2.25vw, 3rem);
			font-weight: 600;
			letter-spacing: 1px;
			transform: scaleY(1.75);
			margin-right: 1.2em;

			&:nth-child(2) {
				margin-right: 0;
			}

			&:hover {
				background-color: hsl(0, 0%, 31%);
				color: #f0f0f0;
				border-radius: 5px;
				padding: 0.1rem 0.75rem;
			}

			@media (width <= 768px) {
				margin-right: 1em;
				transform: scaleY(1);
			}
		}

		.mobile-menu {
			position: fixed;
			inset: 0;
			width: 100%;
			height: 100dvh;
			background-color: #f0f0f0;
			margin: 0;
			padding: 0;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			gap: 2em;
			z-index: 50;
			animation: slideDown 0.5s ease forwards;

			@media (prefers-reduced-motion: reduce) {
				animation: none;
			}

			&.closing {
				animation: slideUp 0.5s ease forwards;

				@media (prefers-reduced-motion: reduce) {
					animation: none;
				}
			}

			@media (width >= 768px) {
				display: none;
			}

			.mobile-nav-link {
				display: block;
				padding: 0.75rem 0;
				text-decoration: none;
				color: hsl(0, 0%, 31%);
				font-family: var(--sans-bold);
				font-size: clamp(2rem, 3vw, 2rem);
				font-weight: 900;
				letter-spacing: 10px;
				border-radius: 0.25rem;
				text-align: center;
				width: 100%;
				margin: 0;

				&:hover {
					background-color: hsl(0, 0%, 31%);
					color: #f0f0f0;
				}
			}
		}

		.burger {
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			width: 2rem;
			height: 1.5rem;
			background: transparent;
			border: none;
			cursor: pointer;
			padding: 0;
			z-index: 51;
			position: relative;

			@media (width >= 768px) {
				display: none;
			}

			@media (width > 768px) {
				:global(&) {
					display: none;
				}
			}

			.bar {
				width: 100%;
				height: 5px;
				background-color: hsl(0, 0%, 11%);
				transition: all 0.3s ease-in-out;
				transform-origin: center;
				border-radius: 5px;
			}

			&.active {
				transform: translateX(1.3em) translateY(-1.3em);

				.bar:first-child {
					transform: translateY(10px) rotate(45deg);
					background-color: hsl(0, 0%, 0%);
				}

				.bar:nth-child(2) {
					opacity: 0;
				}

				.bar:last-child {
					transform: translateY(-9px) rotate(-45deg);
					background-color: hsl(0, 0%, 0%);
				}
			}
		}
	}

	@keyframes slideDown {
		from {
			transform: translateY(-100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			transform: translateY(0);
			opacity: 1;
		}
		to {
			transform: translateY(-100%);
			opacity: 0;
		}
	}
</style>
