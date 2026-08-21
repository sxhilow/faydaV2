export function initFooterNavHover(): void {
	const links = document.querySelectorAll<HTMLElement>("[data-footer-nav-link]");
	links.forEach((link) => {
		const bg = link.querySelector<HTMLElement>("[data-footer-nav-bg]");
		if (!bg) return;

		link.addEventListener("mousemove", (e) => {
			const rect = link.getBoundingClientRect();
			bg.style.left = `${e.clientX - rect.left}px`;
			bg.style.top = `${e.clientY - rect.top}px`;
		});

		link.addEventListener("mouseenter", () => {
			bg.style.width = "400px";
			bg.style.height = "400px";
		});

		link.addEventListener("mouseleave", () => {
			bg.style.width = "0";
			bg.style.height = "0";
		});
	});
}
