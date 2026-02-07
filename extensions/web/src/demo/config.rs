use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DemoConfig {
    pub pages: Vec<DemoPage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DemoPage {
    pub slug: String,
    pub title: String,
}
