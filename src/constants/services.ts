import rocket from "@assets/icons/rocket.svg";
import figma from "@assets/icons/figma.svg";
import mobile from "@assets/icons/mobile.svg";
import code from "@assets/icons/code.svg";
import search from "@assets/icons/search.svg";
import revision from "@assets/icons/revision.svg";
import shield from "@assets/icons/shield.svg";
import navigation from "@assets/icons/navigation.svg";
import panel from "@assets/icons/panel.svg";
import trendUp from "@assets/icons/trend-up.svg";
import textEdit from "@assets/icons/text-edit.svg";

export const newWebsite = {
	eyebrow: "Want something from scratch?",
	title: "New Website",
	subtitle: "Designed around your business, audience, and goals.",
	items: [
		{ icon: rocket, label: "Delivered in 2–4 weeks" },
		{ icon: figma, label: "Custom Figma design" },
		{ icon: mobile, label: "Responsive across all devices" },
		{ icon: code, label: "Custom development" },
		{ icon: search, label: "SEO-ready setup" },
		{ icon: revision, label: "Flexible revisions" },
	],
};

export const websiteRefresh = {
	eyebrow: "Want to improve what you have?",
	title: "Website Refresh",
	subtitle: "Improve your existing website without starting from zero.",
	muted: true,
	items: [
		{ icon: shield, label: "Design & UX audit" },
		{ icon: navigation, label: "Improved navigation" },
		{ icon: mobile, label: "Mobile optimisation" },
		{ icon: panel, label: "Clearer page structure" },
		{ icon: trendUp, label: "Conversion improvements" },
		{ icon: textEdit, label: "Content refinement" },
	],
};

export const services = [newWebsite, websiteRefresh];
