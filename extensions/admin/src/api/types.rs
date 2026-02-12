use std::collections::HashMap;

use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::{Deserialize, Serialize};

/// Query parameters for paginated list endpoints.
#[derive(Debug, Deserialize, Default)]
pub struct PaginationQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub search: Option<String>,
    pub sort: Option<String>,
    pub order: Option<String>,
    /// Catch-all for field-specific filters (e.g. ?status=Let)
    #[serde(flatten)]
    pub filters: HashMap<String, String>,
}

/// Standard paginated response: { data: [...], total: N }
#[derive(Debug, Serialize)]
pub struct PaginatedResponse {
    pub data: Vec<serde_json::Value>,
    pub total: i64,
}

/// Paginated response with totals row (for invoices): { data, total, totals }
#[derive(Debug, Serialize)]
pub struct PaginatedWithTotals {
    pub data: Vec<serde_json::Value>,
    pub total: i64,
    pub totals: serde_json::Value,
}

/// Success response for create operations: { success: true, id: "uuid" }
#[derive(Debug, Serialize)]
pub struct CreateResponse {
    pub success: bool,
    pub id: String,
}

/// Success response for update/delete: { success: true }
#[derive(Debug, Serialize)]
pub struct SuccessResponse {
    pub success: bool,
}

/// Error response: { error: "message" }
#[derive(Debug, Serialize)]
pub struct ErrorBody {
    pub error: String,
}

pub fn success_response() -> Response {
    Json(SuccessResponse { success: true }).into_response()
}

pub fn created_response(id: String) -> Response {
    (
        StatusCode::CREATED,
        Json(CreateResponse { success: true, id }),
    )
        .into_response()
}

pub fn error_response(status: StatusCode, message: &str) -> Response {
    (
        status,
        Json(ErrorBody {
            error: message.to_string(),
        }),
    )
        .into_response()
}

pub fn not_found(entity: &str) -> Response {
    error_response(StatusCode::NOT_FOUND, &format!("{entity} not found"))
}
