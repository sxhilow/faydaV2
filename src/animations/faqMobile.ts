export function initFaqMobile(): void {
	const items = document.querySelectorAll<HTMLElement>("[data-faq-item]");
	if (items.length === 0) return;

	items.forEach((item) => {
		item.addEventListener("click", () => {
			const wasActive = item.classList.contains("is-active");
			items.forEach((i) => i.classList.remove("is-active"));
			if (!wasActive) item.classList.add("is-active");
		});
	});
}
