use anyhow::Result;
use systemprompt::database::DbPool;
use systemprompt::models::Config;
use systemprompt::traits::{Job, JobContext, JobResult};

#[derive(Debug, Clone, Copy, Default)]
pub struct RegisterOAuthClientJob;

#[async_trait::async_trait]
impl Job for RegisterOAuthClientJob {
    fn name(&self) -> &'static str {
        "register_oauth_client"
    }

    fn description(&self) -> &'static str {
        "Registers OAuth client redirect URI using api_external_url from profile"
    }

    fn schedule(&self) -> &'static str {
        "0 0 0 31 2 *"
    }

    fn run_on_startup(&self) -> bool {
        true
    }

    async fn execute(&self, ctx: &JobContext) -> Result<JobResult> {
        let config = Config::get()?;
        let redirect_uri = format!("{}/admin/login", config.api_external_url);

        let db = ctx
            .db_pool::<DbPool>()
            .ok_or_else(|| anyhow::anyhow!("Database not available"))?;
        let pool = db
            .pool()
            .ok_or_else(|| anyhow::anyhow!("PgPool not available"))?;

        sqlx::query!(
            "INSERT INTO oauth_client_redirect_uris (client_id, redirect_uri, is_primary)
             VALUES ('property-admin', $1, true)
             ON CONFLICT (client_id, redirect_uri) DO NOTHING",
            &redirect_uri,
        )
        .execute(pool.as_ref())
        .await?;

        sqlx::query!(
            "DELETE FROM oauth_client_redirect_uris
             WHERE client_id = 'property-admin' AND redirect_uri = '/admin/login'",
        )
        .execute(pool.as_ref())
        .await?;

        tracing::info!(redirect_uri = %redirect_uri, "OAuth client redirect URI registered");

        Ok(JobResult::success().with_message(format!("Registered redirect URI: {redirect_uri}")))
    }
}
