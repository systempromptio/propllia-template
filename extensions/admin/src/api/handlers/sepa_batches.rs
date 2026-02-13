use axum::extract::State;
use axum::response::{IntoResponse, Response};
use axum::Json;

use crate::api::generic::AdminState;
use crate::api::types::error_response;

pub async fn sepa_batches_creditors_handler(State(state): State<AdminState>) -> Response {
    match sqlx::query_scalar::<_, serde_json::Value>(
        "SELECT COALESCE(json_agg(t.creditor), '[]') FROM (\
            SELECT DISTINCT creditor FROM admin_sepa_batches WHERE creditor != '' ORDER BY creditor\
         ) t",
    )
    .fetch_one(&*state.pool)
    .await
    {
        Ok(data) => Json(data).into_response(),
        Err(e) => {
            tracing::error!(error = %e, "SEPA creditors query failed");
            error_response(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                &e.to_string(),
            )
        }
    }
}
