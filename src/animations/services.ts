import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initServices(): void {
    const badge = document.querySelector<HTMLElement>("[data-floating-badge]");
    const serviceCards = document.querySelectorAll<HTMLElement>(".service-card");
    
    // Target the SVG directly so we don't twist the Y-axis of the container
    const badgeSvg = badge?.querySelector("svg");

    if (!badge || !badgeSvg || serviceCards.length === 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    serviceCards.forEach((card) => {
        ScrollTrigger.create({
            trigger: card,
            start: "center center+=150",
            end: "center center-=150",
            onEnter: () => card.setAttribute("data-active", "true"),
            onLeave: () => card.setAttribute("data-active", "false"),
            onEnterBack: () => card.setAttribute("data-active", "true"),
            onLeaveBack: () => card.setAttribute("data-active", "false"),
        });

        const badgeSnapTl = gsap.timeline({
            scrollTrigger: {
                trigger: card,
                start: "center center+=150",
                end: "center center-=150",
                scrub: 1,
            }
        });

        // rotate badgeSvg instead of badge
        badgeSnapTl
            .to(badgeSvg, { scale: 1, rotation: "+=90", duration: 0.5, ease: "power2.out" })
            .to(badgeSvg, { scale: 1, rotation: "+=90", duration: 0.5, ease: "power2.in" });
    });
}