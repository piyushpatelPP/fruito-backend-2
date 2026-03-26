package com.fruito.backend.controller;

import com.fruito.backend.repository.FruitRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.stream.Collectors;

/**
 * Serves SEO-critical public files:
 *  GET /sitemap.xml  — dynamic product sitemap for Google/Bing indexing
 *  GET /robots.txt   — crawler instructions (replaces flat static file)
 */
@RestController
public class SeoController {

    private final FruitRepository fruitRepository;

    /** Set seo.frontend-url=https://yourfruito.vercel.app in application.properties */
    @Value("${seo.frontend-url:https://fruito.store}")
    private String frontendUrl;

    public SeoController(FruitRepository fruitRepository) {
        this.fruitRepository = fruitRepository;
    }

    // ─── Dynamic Sitemap ──────────────────────────────────────────────────────
    /**
     * Generates a sitemap listing:
     *   - Static pages (home, about, contact, shop)
     *   - Every fruit/product page  (/products/{id})
     *
     * Google crawls this to discover and index all pages automatically.
     * Cache for 24h so crawlers don't hammer the DB.
     */
    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> sitemap() {
        String today = LocalDate.now().toString();

        // Static pages
        String staticUrls = """
                <url>
                  <loc>%s/</loc>
                  <changefreq>weekly</changefreq>
                  <priority>1.0</priority>
                  <lastmod>%s</lastmod>
                </url>
                <url>
                  <loc>%s/shop</loc>
                  <changefreq>daily</changefreq>
                  <priority>0.9</priority>
                  <lastmod>%s</lastmod>
                </url>
                <url>
                  <loc>%s/about</loc>
                  <changefreq>monthly</changefreq>
                  <priority>0.5</priority>
                  <lastmod>%s</lastmod>
                </url>
                <url>
                  <loc>%s/contact</loc>
                  <changefreq>monthly</changefreq>
                  <priority>0.5</priority>
                  <lastmod>%s</lastmod>
                </url>
                """.formatted(
                frontendUrl, today,
                frontendUrl, today,
                frontendUrl, today,
                frontendUrl, today
        );

        // Dynamic product pages — one <url> per fruit in DB
        @SuppressWarnings("null")
        String productUrls = fruitRepository.findAll().stream()
                .map(fruit -> """
                        <url>
                          <loc>%s/products/%d</loc>
                          <changefreq>weekly</changefreq>
                          <priority>0.8</priority>
                          <lastmod>%s</lastmod>
                        </url>
                        """.formatted(frontendUrl, fruit.getId(), today))
                .collect(Collectors.joining("\n"));

        String sitemap = """
                <?xml version="1.0" encoding="UTF-8"?>
                <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                %s
                %s
                </urlset>
                """.formatted(staticUrls, productUrls);

        return ResponseEntity.ok()
                // Cache 24h — crawlers cache it, no DB hit on every request
                .header("Cache-Control", "public, max-age=86400")
                .body(sitemap);
    }

    // ─── robots.txt ───────────────────────────────────────────────────────────
    /**
     * Tells crawlers:
     *  - Allow everything public
     *  - Block admin + user private routes
     *  - Point to the sitemap  ← crucial for Google to find it
     */
    @GetMapping(value = "/robots.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> robots() {
        String robots = """
                User-agent: *
                Allow: /
                Disallow: /admin/
                Disallow: /user/
                Disallow: /auth/

                Sitemap: %s/sitemap.xml
                """.formatted(frontendUrl);

        return ResponseEntity.ok()
                .header("Cache-Control", "public, max-age=86400")
                .body(robots);
    }
}
