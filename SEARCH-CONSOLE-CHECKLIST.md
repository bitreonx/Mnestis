# Search Console Checklist — Mnestis

## Property setup
- [ ] Add property: `https://mnestis.vercel.app` (Domain or URL prefix)
- [ ] Verify via Vercel DNS TXT or HTML file in `web/public/`
- [ ] Submit sitemap: `https://mnestis.vercel.app/sitemap.xml`
- [ ] Confirm `robots.txt` allows `/`, `/docs`, `/achievements`

## Indexing requests (after rename approval)
- [ ] Request indexing: `/`
- [ ] Request indexing: `/docs`
- [ ] Request indexing: `/achievements`
- [ ] Request indexing: `/og.png`

## Structured data
- [ ] Validate JSON-LD SoftwareApplication in homepage (Rich Results Test)
- [ ] Fix any Lighthouse SEO issues below 95

## Keywords to monitor
- mnestis, mnemos, codebase memory, graphify alternative, AI agent memory, cursor mcp memory

## Post-rename (when approved)
- [ ] Add 301 from old domain if migrating
- [ ] Update npm homepage + repository URL
- [ ] Resubmit sitemap with new canonical URLs
- [ ] Add `formerly mnemos` to meta descriptions (already in llms.txt)

## Weekly
- [ ] Check Coverage report for 404s on `/docs/*`
- [ ] Review Performance → Core Web Vitals on mobile
