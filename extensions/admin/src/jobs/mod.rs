mod register_oauth_client;

use std::path::Path;

use async_trait::async_trait;
use systemprompt::database::DbPool;
use systemprompt::traits::{Job, JobContext, JobResult};

pub use register_oauth_client::RegisterOAuthClientJob;

#[derive(Debug, Clone, Copy, Default)]
pub struct DemoResetJob;

#[async_trait]
impl Job for DemoResetJob {
    fn name(&self) -> &'static str {
        "admin_demo_reset"
    }

    fn description(&self) -> &'static str {
        "Resets admin demo data to seed state every hour, cleans uploaded files"
    }

    fn schedule(&self) -> &'static str {
        "0 0 * * * *"
    }

    async fn execute(&self, ctx: &JobContext) -> anyhow::Result<JobResult> {
        let db = ctx
            .db_pool::<DbPool>()
            .ok_or_else(|| anyhow::anyhow!("Database not available in job context"))?;

        let pool = db
            .pool()
            .ok_or_else(|| anyhow::anyhow!("PgPool not available from database"))?;

        tracing::info!("Running admin demo reset job");

        // Reset all admin tables to seed state
        sqlx::query("SELECT admin_seed_demo_data()")
            .execute(&*pool)
            .await?;

        // Clean uploaded files from DB
        let deleted = sqlx::query_scalar::<_, i64>(
            "WITH d AS (DELETE FROM files RETURNING 1) SELECT COUNT(*) FROM d",
        )
        .fetch_one(&*pool)
        .await
        .unwrap_or(0);

        // Clean uploaded files from disk
        let uploads_dir = Path::new("storage/files/uploads");
        if uploads_dir.exists() {
            if let Err(e) = tokio::fs::remove_dir_all(uploads_dir).await {
                tracing::warn!(error = %e, "Failed to clean uploads directory");
            }
            let _ = tokio::fs::create_dir_all(uploads_dir).await;
        }

        tracing::info!(files_deleted = deleted, "Admin demo data reset complete");

        Ok(JobResult::success()
            .with_stats(1, 0)
            .with_message(format!(
                "Demo reset: 9 tables reseeded, {deleted} files cleaned"
            )))
    }
}
