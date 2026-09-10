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
			}, 500);
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
			max-width: 1200px;
			margin-inline: auto;
			padding: 0;

			.nav-content {
				display: flex;
				justify-content: space-between;
				align-items: center;
				height: 4em;
				padding: 1.5rem 1rem 0 1rem;

				@media (width <= 500px) {
					padding: 0.5rem 1rem 0 1rem;
				}

				@media (min-width: 768px) {
					height: 9em;
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
			font-size: clamp(1.25rem, 3vw, 4rem);
			font-weight: 900;
			letter-spacing: 5px;

			&:hover {
				background-color: hsl(0, 0%, 31%);
				color: #f0f0f0;
				border-radius: 5px;
				padding: 0.1rem 0.75rem;
			}

			@media (min-width: 768px) {
				margin-right: 1em;
			}
		}

		.mobile-menu {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			width: 100%;
			height: 100vh;
			background-color: #f0f0f0;
			margin: 0;
			padding: 0;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			gap: 4em;
			z-index: 50;
			animation: slideDown 0.5s ease forwards;

			&.closing {
				animation: slideUp 0.5s ease forwards;
			}

			@media (min-width: 768px) {
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

			@media (min-width: 768px) {
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
				background-color: hsl(0, 0%, 31%);
				transition: all 0.3s ease-in-out;
				transform-origin: center;
				border-radius: 5px;
			}

			&.active {
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
