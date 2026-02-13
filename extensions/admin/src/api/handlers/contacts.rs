use axum::extract::State;
use axum::response::{IntoResponse, Response};
use axum::Json;

use crate::api::generic::AdminState;
use crate::api::types::error_response;

pub async fn contacts_names_handler(State(state): State<AdminState>) -> Response {
    match sqlx::query_scalar::<_, serde_json::Value>(
        "SELECT COALESCE(json_agg(row_to_json(t)), '[]') FROM (\
            SELECT id, name FROM admin_contacts ORDER BY name\
         ) t",
    )
    .fetch_one(&*state.pool)
    .await
    {
        Ok(data) => Json(data).into_response(),
        Err(e) => {
            tracing::error!(error = %e, "Contacts names query failed");
            error_response(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                &e.to_string(),
            )
        }
    }
}
