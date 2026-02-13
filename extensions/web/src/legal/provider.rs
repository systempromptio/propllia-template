use anyhow::Result;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde_json::{json, Value};
use systemprompt::template_provider::{PageContext, PageDataProvider};

pub struct LegalPageDataProvider;

impl LegalPageDataProvider {
    #[must_use]
    pub const fn new() -> Self {
        Self
    }
}

impl Default for LegalPageDataProvider {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl PageDataProvider for LegalPageDataProvider {
    fn provider_id(&self) -> &'static str {
        "legal-metadata"
    }

    fn applies_to_pages(&self) -> Vec<String> {
        vec!["legal".to_string()]
    }

    async fn provide_page_data(&self, ctx: &PageContext<'_>) -> Result<Value> {
        let item = ctx
            .content_item()
            .ok_or_else(|| anyhow::anyhow!("Content item required for legal page"))?;

        let mut data = json!({});

        if let Some(obj) = data.as_object_mut() {
            // Basic fields
            if let Some(title) = item.get("title").and_then(|v| v.as_str()) {
                obj.insert("TITLE".to_string(), Value::String(title.to_string()));
            }
            if let Some(desc) = item.get("description").and_then(|v| v.as_str()) {
                obj.insert("DESCRIPTION".to_string(), Value::String(desc.to_string()));
            }
            if let Some(author) = item.get("author").and_then(|v| v.as_str()) {
                obj.insert("AUTHOR".to_string(), Value::String(author.to_string()));
            }
            if let Some(keywords) = item.get("keywords").and_then(|v| v.as_str()) {
                obj.insert("KEYWORDS".to_string(), Value::String(keywords.to_string()));
            }
            if let Some(slug) = item.get("slug").and_then(|v| v.as_str()) {
                obj.insert("SLUG".to_string(), Value::String(slug.to_string()));
            }

            // Image
            if let Some(image) = item.get("image").and_then(|v| v.as_str()) {
                obj.insert("IMAGE".to_string(), Value::String(image.to_string()));
            }

            // Dates
            if let Some(published) = item.get("published_at").and_then(|v| v.as_str()) {
                obj.insert("DATE_ISO".to_string(), Value::String(published.to_string()));
                obj.insert(
                    "DATE_PUBLISHED".to_string(),
                    Value::String(published.to_string()),
                );
                if let Ok(dt) = DateTime::parse_from_rfc3339(published) {
                    obj.insert(
                        "DATE".to_string(),
                        Value::String(dt.format("%B %d, %Y").to_string()),
                    );
                } else if let Ok(dt) = published.parse::<DateTime<Utc>>() {
                    obj.insert(
                        "DATE".to_string(),
                        Value::String(dt.format("%B %d, %Y").to_string()),
                    );
                }
            }
            if let Some(updated) = item.get("updated_at").and_then(|v| v.as_str()) {
                obj.insert(
                    "DATE_MODIFIED_ISO".to_string(),
                    Value::String(updated.to_string()),
                );
            }

            // Reading time
            if let Some(content) = item.get("content").and_then(|v| v.as_str()) {
                let word_count = content.split_whitespace().count();
                let read_time = (word_count / 200).max(1);
                obj.insert(
                    "READ_TIME".to_string(),
                    Value::String(read_time.to_string()),
                );
            }
        }

        Ok(data)
    }

    fn priority(&self) -> u32 {
        60
    }
}
