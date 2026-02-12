use systemprompt::extension::AssetDefinition;

pub fn web_assets(paths: &dyn systemprompt::extension::AssetPaths) -> Vec<AssetDefinition> {
    let storage_css = paths.storage_files().join("css");
    let storage_js = paths.storage_files().join("js");


    vec![
        AssetDefinition::css(
            storage_css.join("core/variables.css"),
            "css/core/variables.css",
        ),
        AssetDefinition::css(storage_css.join("core/fonts.css"), "css/core/fonts.css"),
        AssetDefinition::css(storage_css.join("core/reset.css"), "css/core/reset.css"),
        AssetDefinition::css(
            storage_css.join("components/header.css"),
            "css/components/header.css",
        ),
        AssetDefinition::css(
            storage_css.join("components/footer.css"),
            "css/components/footer.css",
        ),
        AssetDefinition::css(
            storage_css.join("components/mobile-menu.css"),
            "css/components/mobile-menu.css",
        ),
        AssetDefinition::css(storage_css.join("homepage.css"), "css/homepage.css"),
        AssetDefinition::css(
            storage_css.join("homepage-hero.css"),
            "css/homepage-hero.css",
        ),
        AssetDefinition::css(
            storage_css.join("homepage-demo.css"),
            "css/homepage-demo.css",
        ),
        AssetDefinition::css(
            storage_css.join("homepage-sections.css"),
            "css/homepage-sections.css",
        ),
        AssetDefinition::css(
            storage_css.join("homepage-playbooks.css"),
            "css/homepage-playbooks.css",
        ),
        AssetDefinition::css(
            storage_css.join("homepage-contact.css"),
            "css/homepage-contact.css",
        ),
        AssetDefinition::css(storage_css.join("blog.css"), "css/blog.css"),
        AssetDefinition::css(storage_css.join("blog-code.css"), "css/blog-code.css"),
        AssetDefinition::css(storage_css.join("blog-layout.css"), "css/blog-layout.css"),
        AssetDefinition::css(storage_css.join("blog-print.css"), "css/blog-print.css"),
        AssetDefinition::css(
            storage_css.join("blog-typography.css"),
            "css/blog-typography.css",
        ),
        AssetDefinition::css(storage_css.join("docs.css"), "css/docs.css"),
        AssetDefinition::css(storage_css.join("paper.css"), "css/paper.css"),
        AssetDefinition::css(storage_css.join("feature-page.css"), "css/feature-page.css"),
        AssetDefinition::css(
            storage_css.join("syntax-highlight.css"),
            "css/syntax-highlight.css",
        ),
        AssetDefinition::css(storage_css.join("feature-base.css"), "css/feature-base.css"),
        AssetDefinition::css(
            storage_css.join("content-cards.css"),
            "css/content-cards.css",
        ),
        AssetDefinition::css(storage_css.join("playbook.css"), "css/playbook.css"),
        AssetDefinition::js(storage_js.join("analytics.js"), "js/analytics.js"),
        AssetDefinition::js(storage_js.join("docs.js"), "js/docs.js"),
        AssetDefinition::js(storage_js.join("mobile-menu.js"), "js/mobile-menu.js"),
        AssetDefinition::js(storage_js.join("terminal-demo.js"), "js/terminal-demo.js"),
        AssetDefinition::js(storage_js.join("blog-images.js"), "js/blog-images.js"),
        AssetDefinition::js(storage_js.join("homepage.js"), "js/homepage.js"),
        // Admin CSS (for demo section)
        AssetDefinition::css(storage_css.join("admin.css"), "css/admin.css"),
        AssetDefinition::css(storage_css.join("admin/tokens.css"), "css/admin/tokens.css"),
        AssetDefinition::css(storage_css.join("admin/base.css"), "css/admin/base.css"),
        AssetDefinition::css(
            storage_css.join("admin/sidebar.css"),
            "css/admin/sidebar.css",
        ),
        AssetDefinition::css(
            storage_css.join("admin/controls.css"),
            "css/admin/controls.css",
        ),
        AssetDefinition::css(storage_css.join("admin/tables.css"), "css/admin/tables.css"),
        AssetDefinition::css(storage_css.join("admin/panels.css"), "css/admin/panels.css"),
        AssetDefinition::css(
            storage_css.join("admin/dashboard.css"),
            "css/admin/dashboard.css",
        ),
        AssetDefinition::css(
            storage_css.join("admin/gallery.css"),
            "css/admin/gallery.css",
        ),
        AssetDefinition::css(
            storage_css.join("admin/feedback.css"),
            "css/admin/feedback.css",
        ),
        AssetDefinition::css(
            storage_css.join("admin/responsive.css"),
            "css/admin/responsive.css",
        ),
        AssetDefinition::css(
            storage_css.join("admin/split-layout.css"),
            "css/admin/split-layout.css",
        ),
        AssetDefinition::css(
            storage_css.join("admin/detail-page.css"),
            "css/admin/detail-page.css",
        ),
        // Admin JS (for demo section)
        AssetDefinition::js(storage_js.join("admin-bundle.js"), "js/admin.js"),
        AssetDefinition::js(storage_js.join("demo-mock.js"), "js/demo-mock.js"),
        // Demo HTML pages are now rendered via DemoPagePrerenderer (not static assets)
    ]
}
