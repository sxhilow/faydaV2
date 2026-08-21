import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger"; // Ensure this is imported

gsap.registerPlugin(ScrollTrigger, SplitText);

const BLUE_50 = "#e9eeff";
const BLUE_200 = "#9bb0ff";
const DESKTOP_SCROLL = 5000;
const MOBILE_SCROLL = 2000;
const PILL_FRACTION = 0.05;
const FEATURES_REVEAL_START = 1;
const FEATURES_REVEAL_DURATION = 0.25;

export function initWhyUs(): void {
    // 1. Target the OUTER section so the background pins with the text
    const section = document.querySelector<HTMLElement>("#why-us");
    const revealEl = document.querySelector<HTMLElement>("[data-why-us-reveal]");
    const pill = document.querySelector<HTMLElement>("#why-us [data-pill]");
    const features = document.querySelector<HTMLElement>("[data-overlapping]");

    if (!section || !revealEl) return;

    // 2. Use gsap.matchMedia to handle mobile address bar resizing natively
    const mm = gsap.matchMedia();

    mm.add({
        isDesktop: "(min-width: 1280px)",
        isMobile: "(max-width: 1279px)",
        reduceMotion: "(prefers-reduced-motion: reduce)"
    }, (context) => {
        // @ts-ignore - Context conditions are correctly populated by GSAP
        const { isDesktop, reduceMotion } = context.conditions;

        if (reduceMotion) return;

        const split = new SplitText(revealEl, { type: "words, chars" });
        const chars = split.chars;
        const charCount = chars.length;

        gsap.set(chars, { color: BLUE_200 });
        if (pill) gsap.set(pill, { opacity: 0 });

        const scrollDistance = isDesktop ? DESKTOP_SCROLL : MOBILE_SCROLL;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section, // Pin the parent wrapper!
                start: "top top",
                end: `+=${scrollDistance}`,
                pin: true,
                scrub: 1,
                anticipatePin: 1,
            },
        });

        if (pill) {
            tl.to(pill, { opacity: 1, duration: PILL_FRACTION, ease: "power2.out" }, 0);
        }

        chars.forEach((char, i) => {
            // Apply different timing logic based on the device
            const position = isDesktop 
                ? PILL_FRACTION + ((1 - PILL_FRACTION) * i) / charCount 
                : i / charCount; 
            
            tl.set(char, { color: BLUE_50 }, position);
        });

        if (isDesktop && features) {
            tl.to(
                features,
                { y: 0, duration: FEATURES_REVEAL_DURATION, ease: "none" },
                FEATURES_REVEAL_START
            );
        }

        // 3. Clean up the SplitText completely if the user rotates their device
        return () => split.revert();
    });
}