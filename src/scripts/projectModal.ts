import { ScrollSmoother } from "gsap/ScrollSmoother";

export function initProjectModals(): void {
	if (document.body.dataset.projectModalBound) return;
	document.body.dataset.projectModalBound = "1";

	const dialogs = () =>
		Array.from(
			document.querySelectorAll<HTMLDialogElement>("[data-project-modal]"),
		);

	const lockScroll = (locked: boolean) => {
		ScrollSmoother.get()?.paused(locked);
		document.documentElement.style.overflow = locked ? "hidden" : "";
	};

	const openModal = (id: string) => {
		const target = document.querySelector<HTMLDialogElement>(
			`[data-project-modal="${id}"]`,
		);
		if (!target || target.open) return;

		dialogs().forEach((d) => d.open && d.close());
		target.showModal();
		target.focus();
		const scroller = target.querySelector<HTMLElement>("[data-modal-scroll]");
		if (scroller) scroller.scrollTop = 0;
		lockScroll(true);
	};

	// Openers: card "View Details" buttons and the modal's own switcher cards.
	// Navigation is suppressed only when a matching dialog exists — the plain
	// href stays as the no-JS fallback.
	document.addEventListener("click", (e) => {
		const opener = (e.target as HTMLElement).closest<HTMLElement>(
			"[data-open-modal]",
		);
		if (!opener) return;
		const id = opener.dataset.openModal;
		if (!id || !document.querySelector(`[data-project-modal="${id}"]`)) return;
		e.preventDefault();
		openModal(id);
	});

	// Clicking the backdrop region (the dialog itself, outside the sheet)
	// or pressing ESC are the primary close paths.
	dialogs().forEach((dialog) => {
		if (dialog.dataset.modalBound) return;
		dialog.dataset.modalBound = "1";
		dialog.addEventListener("click", (e) => {
			if (e.target === dialog) dialog.close();
		});
	});

	// Native close path (button, ESC, backdrop) always releases the lock
	document.addEventListener("close", (e) => {
		if ((e.target as HTMLElement).matches?.("[data-project-modal]")) {
			lockScroll(false);
		}
	}, true);
}
