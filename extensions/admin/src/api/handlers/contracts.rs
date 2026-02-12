use axum::extract::{Path, State};
use axum::response::{IntoResponse, Response};
use axum::Json;
use uuid::Uuid;

use crate::api::generic::AdminState;
use crate::api::types::{error_response, not_found};

pub async fn contract_detail_handler(
    State(state): State<AdminState>,
    Path(id): Path<Uuid>,
) -> Response {
    let pool = &*state.pool;

    let contract = match sqlx::query_scalar::<_, serde_json::Value>(
        "SELECT row_to_json(t) FROM (SELECT * FROM admin_contracts WHERE id = $1) t",
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    {
        Ok(Some(c)) => c,
        Ok(None) => return not_found("contract"),
        Err(e) => {
            tracing::error!(error = %e, "Contract detail query failed");
            return error_response(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                &e.to_string(),
            );
        }
    };

    Json(serde_json::json!({
        "contract": contract,
        "documents": [],
        "details": [],
    }))
    .into_response()
}

pub async fn contract_doc_text_handler(
    State(_state): State<AdminState>,
    Path(_id): Path<Uuid>,
) -> Response {
    // Document text extraction stub
    Json(serde_json::json!({
        "id": _id,
        "name": "Document",
        "content": "Document content not available in demo mode."
    }))
    .into_response()
}
