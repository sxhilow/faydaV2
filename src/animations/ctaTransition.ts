import { gsap } from "gsap";

const CTA_REVEAL_DISTANCE = 500;
const CTA_HOLD_DISTANCE = 250;
const CTA_COLLAPSE_DISTANCE = 900;
const BADGE_FOLLOW_DISTANCE = 1200;

export function initCtaTransition(): void {
    const cta = document.querySelector<HTMLElement>("[data-cta]");
    const content = document.querySelector<HTMLElement>("[data-cta-content]");
    const badge = document.querySelector<HTMLElement>("[data-floating-badge]");
    const footer = document.querySelector<HTMLElement>("footer");

    if (!cta || !badge || !content || !footer) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(cta, { clipPath: "none" });
        gsap.set(badge, { opacity: 0 });
        return;
    }

    const getStartInset = () => `inset(0px 0px ${cta.offsetHeight}px 0px round 0px)`;
    const getOpenInset = () => `inset(0px 0px 0px 0px round 0px)`;
    const getBallInset = () => {
        const h = cta.offsetHeight;
        const w = cta.offsetWidth;
        const radius = 16;
        const insetY = h / 2 - radius;
        const insetX = w / 2 - radius;
        return `inset(${insetY}px ${insetX}px ${insetY}px ${insetX}px round ${radius}px)`;
    };

    gsap.set(cta, { clipPath: getStartInset(), opacity: 1 });
    gsap.set(badge, { opacity: 0, xPercent: -50, yPercent: -50, x: 0, y: 0 });

    const ctaTimeline = gsap.timeline({
        scrollTrigger: {
            trigger: cta,
            start: "top top",
            end: `+=${CTA_REVEAL_DISTANCE + CTA_HOLD_DISTANCE + CTA_COLLAPSE_DISTANCE}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
        },
    });

    // Curtain drop
    ctaTimeline.to(cta, {
        clipPath: () => getOpenInset(),
        duration: CTA_REVEAL_DISTANCE,
        ease: "none",
    });

    // Hold
    ctaTimeline.to({}, { duration: CTA_HOLD_DISTANCE });


    // reserve the last 150px of the pin as a "buffer zone" to absorb the scrub lag.
    const bufferDistance = 150;
    const collapseDuration = CTA_COLLAPSE_DISTANCE - bufferDistance;

    ctaTimeline.addLabel("collapse");

    // Shrinking the blue background
    ctaTimeline.to(
        cta,
        {
            clipPath: () => getBallInset(),
            duration: collapseDuration,
            ease: "power2.inOut",
        },
        "collapse"
    );

    //  content fade out  ONLY during the final 30% of the collapse phase
    const contentFadeDuration = collapseDuration * 0.3;
    const contentFadeStart = collapseDuration - contentFadeDuration;

    ctaTimeline.to(
        content,
        {
            opacity: 0,
            duration: contentFadeDuration,
            ease: "power2.out",
        },
        `collapse+=${contentFadeStart}`
    );

    // SVG badge fade in concurrently with the text fading out
    ctaTimeline.to(
        badge,
        {
            opacity: 1,
            duration: contentFadeDuration,
            ease: "none",
        },
        `collapse+=${contentFadeStart}`
    );

    // 6. Instantly hide the pinned CTA right after the collapse finishes
    ctaTimeline.set(cta, { opacity: 0 });

    // empty buffer to the timeline so the pin holds for an extra 150px
    // This allows the visual swap to fully complete before the element unpins.
    ctaTimeline.to({}, { duration: bufferDistance });

    // Fixed Badge Follows to Footer
    gsap.to(badge, {
        y: window.innerHeight * 0.4,
        rotation: 180,
        ease: "none",
        scrollTrigger: {
            trigger: footer,
            start: "top bottom",
            end: `+=${BADGE_FOLLOW_DISTANCE}`,
            scrub: 1,
        },
    });
}