import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { PAGES, SEO, pageUrl, type PageSeo } from "../lib/seo";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

export function applyPageSeo(page: PageSeo) {
  const url = pageUrl(page.path ?? "/");
  document.title = page.title;
  upsertMeta("name", "description", page.description);
  upsertMeta("name", "keywords", SEO.keywords);
  upsertLink("canonical", url);
  upsertMeta("property", "og:title", page.title);
  upsertMeta("property", "og:description", page.description);
  upsertMeta("property", "og:url", url);
  upsertMeta("property", "og:image", SEO.ogImage);
  upsertMeta("name", "twitter:title", page.title);
  upsertMeta("name", "twitter:description", page.description);
  upsertMeta("name", "twitter:image", SEO.ogImage);
}

/** Updates document title + meta tags on SPA route changes (Google reads post-hydration too). */
export default function SeoHead({ page }: { page?: PageSeo }) {
  const { pathname } = useLocation();

  useEffect(() => {
    const resolved =
      page ??
      (pathname.startsWith("/achievements") || pathname.startsWith("/changelog")
        ? PAGES.achievements
        : pathname.startsWith("/docs")
          ? PAGES.docs
          : PAGES.home);
    applyPageSeo(resolved);
  }, [pathname, page]);

  return null;
}
