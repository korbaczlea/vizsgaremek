import { Helmet } from "react-helmet-async";

const DEFAULT_DESCRIPTION =
  "MandalArt — handmade mandalas, workshops, and custom orders. Create, decorate, inspire.";

function absoluteUrl(path) {
  if (typeof window === "undefined") return "";
  const base = import.meta.env.VITE_SITE_ORIGIN || window.location.origin;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/$/, "")}${p}`;
}

export default function PageHelmet({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  noindex = false,
}) {
  const fullTitle = title === "MandalArt" ? title : `${title} · MandalArt`;
  const url = path ? absoluteUrl(path) : typeof window !== "undefined" ? window.location.href : "";
  const imageUrl = absoluteUrl("/images/logo_mandalart.png");

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex ? <meta name="robots" content="noindex, nofollow" /> : null}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      {url ? <meta property="og:url" content={url} /> : null}
      {imageUrl ? <meta property="og:image" content={imageUrl} /> : null}
      <meta property="og:locale" content="en_GB" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {imageUrl ? <meta name="twitter:image" content={imageUrl} /> : null}
    </Helmet>
  );
}
