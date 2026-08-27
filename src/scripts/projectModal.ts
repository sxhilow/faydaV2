import { ScrollSmoother } from "gsap/ScrollSmoother";

export function initProjectModals(): void {
	if (document.body.dataset.projectModalBound) return;
	document.body.dataset.projectModalBound = "1";

	let savedScrollY = 0;

	const dialogs = () =>
		Array.from(
			document.querySelectorAll<HTMLDialogElement>("[data-project-modal]"),
		);

	const lockScroll = (locked: boolean) => {
		const smoother = ScrollSmoother.get();
		if (locked) {
			savedScrollY = window.scrollY;
			smoother?.paused(true);
			document.documentElement.style.overflow = "hidden";
		} else {
			document.documentElement.style.overflow = "";
			smoother?.paused(false);
			if (smoother) {
				smoother.scrollTo(savedScrollY, false);
			} else {
				window.scrollTo(0, savedScrollY);
			}
		}
	};

	const openModal = (id: string) => {
		const target = document.querySelector<HTMLDialogElement>(
			`[data-project-modal="${id}"]`,
		);
		if (!target || target.open) return;

		dialogs().forEach((d) => d.open && d.close());
		lockScroll(true);
		target.showModal();
		window.posthog?.capture("project_modal_opened", {
			project_slug: id,
		});

		// Reassert scroll position — guards against any residual UA scroll
		// triggered by showModal()'s internal focus step.
		const smoother = ScrollSmoother.get();
		if (smoother) smoother.scrollTo(savedScrollY, false);
		else window.scrollTo(0, savedScrollY);

		const scroller = target.querySelector<HTMLElement>("[data-modal-scroll]");
		if (scroller) scroller.scrollTop = 0;
	};

	// buttons and the modal's own switcher cards.
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

	// Native close path (ESC, backdrop) always releases the lock
	document.addEventListener("close", (e) => {
		if ((e.target as HTMLElement).matches?.("[data-project-modal]")) {
			lockScroll(false);
		}
	}, true);
}
