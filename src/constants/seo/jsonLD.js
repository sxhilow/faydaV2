export default function jsonLDGenerator(siteData, overrides = {}) {
  const {
    title = siteData.title,
    description = siteData.description,
    url = siteData.url,
    image = siteData.image,
    type = "Organization",
  } = overrides;

  const baseSchema = {
    "@context": "https://schema.org",
    "@type": type,
    name: siteData.company.name,
    legalName: siteData.company.legalName,
    description,
    url,
    logo: new URL(siteData.logo.src, url).toString(),
    image: new URL(image.src, url).toString(),
    email: siteData.company.email,
    telephone: siteData.company.phone,
    foundingDate: siteData.company.foundingDate,
    founder: {
      "@type": "Person",
      name: siteData.company.founder.name,
      ...(siteData.company.founder.url
        ? { url: siteData.company.founder.url }
        : {}),
      ...(siteData.company.founder.sameAs?.length
        ? { sameAs: siteData.company.founder.sameAs }
        : {}),
    },
    areaServed: siteData.company.areaServed,
    knowsAbout: siteData.company.knowsAbout,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: siteData.company.phone,
      email: siteData.company.email,
      contactType: "customer service",
      areaServed: siteData.company.areaServed,
      availableLanguage: "English",
    },
  };

  if (type === "LocalBusiness") {
    baseSchema.priceRange = "$$";
  }

  if (siteData.services?.length > 0) {
    baseSchema.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: "Web Development Services",
      itemListElement: siteData.services.map((service, index) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.name,
          description: service.description,
        },
        position: index + 1,
      })),
    };
  }

  if (siteData.socialProfiles?.length > 0) {
    baseSchema.sameAs = siteData.socialProfiles;
  }

  return baseSchema;
}

export function generateWebSiteSchema({ url, name }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
  };
}

export function generateServiceSchema({
  serviceName,
  description,
  url,
  priceRange,
  provider,
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: serviceName,
    description,
    provider,
    areaServed: "Worldwide",
    offers: {
      "@type": "Offer",
      price: priceRange,
    },
  };
}
