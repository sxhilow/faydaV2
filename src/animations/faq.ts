import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initFaq(): void {
    const faqItems = document.querySelectorAll<HTMLElement>("[data-faq-item]");

    if (faqItems.length === 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    // track of which item is hovered, and which item is centered by scroll
    let currentlyHoveredItem: HTMLElement | null = null;
    let currentlyScrolledItem: HTMLElement | null = null;

    // single source of truth for updating the active class
    const updateActiveState = () => {
        faqItems.forEach((item) => {
            // Hovering takes priority. If nothing is hovered, fallback to scroll.
            const shouldBeActive = currentlyHoveredItem
                ? item === currentlyHoveredItem
                : item === currentlyScrolledItem;

            if (shouldBeActive) {
                item.classList.add("is-active");
            } else {
                item.classList.remove("is-active");
            }
        });
    };

    faqItems.forEach((item) => {
        // Mouse Hover Events
        item.addEventListener("mouseenter", () => {
            currentlyHoveredItem = item;
            updateActiveState();
        });

        item.addEventListener("mouseleave", () => {
            if (currentlyHoveredItem === item) {
                currentlyHoveredItem = null;
            }
            updateActiveState();
        });

        // Scroll Trigger Events
        ScrollTrigger.create({
            trigger: item,
            start: "top center",
            end: "bottom center",

            onToggle: (self) => {
                if (self.isActive) {
                    currentlyScrolledItem = item;
                    updateActiveState();
                }
            }
        });
    });
}