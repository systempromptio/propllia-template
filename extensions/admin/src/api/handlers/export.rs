use axum::extract::{Path, State};
use axum::http::header;
use axum::response::{IntoResponse, Response};

use crate::api::generic::AdminState;
use crate::api::types::error_response;

const ALLOWED_TABLES: &[(&str, &str)] = &[
    ("properties", "admin_properties"),
    ("tenants", "admin_tenants"),
    ("owners", "admin_owners"),
    ("contracts", "admin_contracts"),
    ("invoices", "admin_invoices"),
    ("deposits", "admin_deposits"),
    ("sepa-batches", "admin_sepa_batches"),
    ("issues", "admin_issues"),
    ("insurance", "admin_insurance"),
    ("alerts", "admin_alerts"),
    ("contacts", "admin_contacts"),
    ("leads", "admin_leads"),
    ("lead-notes", "admin_lead_notes"),
];

pub async fn export_handler(
    State(state): State<AdminState>,
    Path(entity): Path<String>,
) -> Response {
    let table = match ALLOWED_TABLES.iter().find(|(name, _)| *name == entity.as_str()) {
        Some((_, table)) => *table,
        None => {
            return error_response(
                axum::http::StatusCode::BAD_REQUEST,
                &format!("Unknown entity: {entity}"),
            )
        }
    };

    // Get column names
    let columns_sql = format!(
        "SELECT string_agg(column_name, ',') FROM information_schema.columns \
         WHERE table_name = '{table}' ORDER BY ordinal_position"
    );
    let columns: String = match sqlx::query_scalar(&columns_sql)
        .fetch_one(&*state.pool)
        .await
    {
        Ok(c) => c,
        Err(e) => {
            tracing::error!(error = %e, "Export columns query failed");
            return error_response(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                &e.to_string(),
            );
        }
    };

    // Get all rows as CSV-ish format
    let data_sql = format!(
        "SELECT row_to_json(t)::text FROM (SELECT * FROM {table} ORDER BY created_at DESC) t"
    );
    let rows: Vec<String> = match sqlx::query_scalar(&data_sql)
        .fetch_all(&*state.pool)
        .await
    {
        Ok(r) => r,
        Err(e) => {
            tracing::error!(error = %e, "Export data query failed");
            return error_response(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                &e.to_string(),
            );
        }
    };

    let mut csv = columns;
    csv.push('\n');
    for row in rows {
        csv.push_str(&row);
        csv.push('\n');
    }

    (
        [
            (header::CONTENT_TYPE, "text/csv; charset=utf-8"),
            (
                header::CONTENT_DISPOSITION,
                &format!("attachment; filename=\"{entity}.csv\""),
            ),
        ],
        csv,
    )
        .into_response()
}
