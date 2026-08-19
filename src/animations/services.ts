import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initServices(): void {
    const badge = document.querySelector<HTMLElement>("[data-floating-badge]");
    const serviceCards = document.querySelectorAll<HTMLElement>(".service-card");

    if (!badge || serviceCards.length === 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    serviceCards.forEach((card) => {
        // 1. Toggle border illumination when the card is perfectly centered
        ScrollTrigger.create({
            trigger: card,
            start: "center center+=150",
            end: "center center-=150",
            onEnter: () => card.setAttribute("data-active", "true"),
            onLeave: () => card.setAttribute("data-active", "false"),
            onEnterBack: () => card.setAttribute("data-active", "true"),
            onLeaveBack: () => card.setAttribute("data-active", "false"),
        });

        // 2. Add a magnetic "snap" effect to the badge
        const badgeSnapTl = gsap.timeline({
            scrollTrigger: {
                trigger: card,
                start: "center center+=150",
                end: "center center-=150",
                scrub: 1,
            }
        });

        badgeSnapTl
            .to(badge, { scale: 1, rotation: "+=90", duration: 0.5, ease: "power2.out" })
            .to(badge, { scale: 1, rotation: "+=90", duration: 0.5, ease: "power2.in" });
    });
}