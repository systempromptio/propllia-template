use axum::extract::State;
use axum::response::{IntoResponse, Response};
use axum::Json;

use crate::api::generic::AdminState;
use crate::api::types::error_response;

pub async fn arrears_handler(State(state): State<AdminState>) -> Response {
    match sqlx::query_scalar::<_, serde_json::Value>(
        "SELECT COALESCE(json_agg(row_to_json(t)), '[]') FROM (\
            SELECT payer, property_name, \
                COUNT(*)::int as outstanding_invoices, \
                SUM(amount)::float8 as total_outstanding, \
                SUM(paid)::float8 as total_paid, \
                SUM(amount - paid)::float8 as debt, \
                MIN(invoice_date) as oldest_date \
            FROM admin_invoices \
            WHERE status IN ('Unpaid', 'Partial') AND type = 'income' \
            GROUP BY payer, property_name \
            ORDER BY debt DESC\
         ) t",
    )
    .fetch_one(&*state.pool)
    .await
    {
        Ok(data) => Json(serde_json::json!({ "data": data })).into_response(),
        Err(e) => {
            tracing::error!(error = %e, "Arrears report failed");
            error_response(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                &e.to_string(),
            )
        }
    }
}

pub async fn profitability_handler(State(state): State<AdminState>) -> Response {
    match sqlx::query_scalar::<_, serde_json::Value>(
        "SELECT COALESCE(json_agg(row_to_json(t)), '[]') FROM (\
            SELECT property_name, \
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::float8 as income, \
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::float8 as expenses, \
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)::float8 as margin, \
                COALESCE(SUM(CASE WHEN type = 'income' THEN paid ELSE 0 END), 0)::float8 as collected \
            FROM admin_invoices \
            WHERE property_name != '' \
            GROUP BY property_name \
            ORDER BY margin DESC\
         ) t",
    )
    .fetch_one(&*state.pool)
    .await
    {
        Ok(data) => Json(serde_json::json!({ "data": data })).into_response(),
        Err(e) => {
            tracing::error!(error = %e, "Profitability report failed");
            error_response(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                &e.to_string(),
            )
        }
    }
}
