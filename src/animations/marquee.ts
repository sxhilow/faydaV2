const SLOW_RATE = 0.2;

export function initMarquee(): void {
	const track = document.querySelector<HTMLElement>("[data-marquee-track]");
	if (!track) return;
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

	const getLoop = (): Animation | null => {
		for (const animation of track.getAnimations()) {
			const cssAnimation = animation as unknown as { animationName?: string };
			if (cssAnimation.animationName === "marquee") return animation;
		}
		return null;
	};

	track.addEventListener("mouseenter", () => getLoop()?.updatePlaybackRate(SLOW_RATE));
	track.addEventListener("mouseleave", () => getLoop()?.updatePlaybackRate(1));
}
