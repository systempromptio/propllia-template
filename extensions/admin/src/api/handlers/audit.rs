use axum::extract::{Path, Query, State};
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::Deserialize;
use uuid::Uuid;

use crate::api::generic::AdminState;
use crate::api::types::error_response;

#[derive(Deserialize)]
pub struct AuditQuery {
    pub limit: Option<i64>,
}

pub async fn audit_recent_handler(
    State(state): State<AdminState>,
    Query(params): Query<AuditQuery>,
) -> Response {
    let limit = params.limit.unwrap_or(50).min(500);

    match sqlx::query_scalar::<_, serde_json::Value>(
        "SELECT COALESCE(json_agg(row_to_json(t)), '[]') FROM (\
            SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT $1\
         ) t",
    )
    .bind(limit)
    .fetch_one(&*state.pool)
    .await
    {
        Ok(data) => Json(serde_json::json!({ "data": data, "total": limit })).into_response(),
        Err(e) => {
            tracing::error!(error = %e, "Audit recent query failed");
            error_response(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                &e.to_string(),
            )
        }
    }
}

pub async fn audit_entity_handler(
    State(state): State<AdminState>,
    Path((entity_type, entity_id)): Path<(String, Uuid)>,
) -> Response {
    match sqlx::query_scalar::<_, serde_json::Value>(
        "SELECT COALESCE(json_agg(row_to_json(t)), '[]') FROM (\
            SELECT * FROM admin_audit_log \
            WHERE entity_type = $1 AND entity_id = $2 \
            ORDER BY created_at DESC\
         ) t",
    )
    .bind(&entity_type)
    .bind(entity_id)
    .fetch_one(&*state.pool)
    .await
    {
        Ok(data) => Json(data).into_response(),
        Err(e) => {
            tracing::error!(error = %e, "Audit entity query failed");
            error_response(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                &e.to_string(),
            )
        }
    }
}
