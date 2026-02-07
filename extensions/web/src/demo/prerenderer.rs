use std::path::PathBuf;

use anyhow::Result;
use async_trait::async_trait;
use systemprompt::template_provider::{PagePrepareContext, PagePrerenderer, PageRenderSpec};

use super::config::DemoPage;

pub struct DemoPagePrerenderer {
    page: DemoPage,
    page_type_id: &'static str,
}

impl DemoPagePrerenderer {
    #[must_use]
    pub fn new(page: DemoPage) -> Self {
        let page_type_id: &'static str =
            Box::leak(format!("demo-page-{}", page.slug).into_boxed_str());
        Self { page, page_type_id }
    }
}

#[async_trait]
impl PagePrerenderer for DemoPagePrerenderer {
    fn page_type(&self) -> &'static str {
        self.page_type_id
    }

    fn priority(&self) -> u32 {
        50
    }

    async fn prepare(&self, ctx: &PagePrepareContext<'_>) -> Result<Option<PageRenderSpec>> {
        let page_data = serde_json::to_value(&self.page)?;

        let base_data = serde_json::json!({
            "demo": page_data,
            "site": ctx.web_config,
        });

        let output_path = if self.page.slug.is_empty() {
            PathBuf::from("demo/index.html")
        } else {
            PathBuf::from(format!("demo/{}/index.html", self.page.slug))
        };

        Ok(Some(PageRenderSpec::new(
            "demo-page",
            base_data,
            output_path,
        )))
    }
}
