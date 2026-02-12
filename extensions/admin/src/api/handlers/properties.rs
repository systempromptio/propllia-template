use axum::extract::{Path, State};
use axum::response::{IntoResponse, Response};
use axum::Json;
use uuid::Uuid;

use crate::api::generic::AdminState;
use crate::api::types::{error_response, not_found};

pub async fn property_detail_handler(
    State(state): State<AdminState>,
    Path(id): Path<Uuid>,
) -> Response {
    let pool = &*state.pool;

    let (property, financial, invoices) = tokio::join!(
        sqlx::query_scalar::<_, serde_json::Value>(
            "SELECT row_to_json(t) FROM (SELECT * FROM admin_properties WHERE id = $1) t"
        )
        .bind(id)
        .fetch_optional(pool),
        sqlx::query_as::<_, (f64, f64, f64)>(
            "SELECT \
                COALESCE(SUM(amount), 0)::float8, \
                COALESCE(SUM(paid), 0)::float8, \
                COALESCE(SUM(amount - paid), 0)::float8 \
             FROM admin_invoices \
             WHERE property_name = (SELECT property_name FROM admin_properties WHERE id = $1) AND type = 'income'"
        )
        .bind(id)
        .fetch_one(pool),
        sqlx::query_scalar::<_, serde_json::Value>(
            "SELECT COALESCE(json_agg(row_to_json(t)), '[]') FROM (\
                SELECT * FROM admin_invoices \
                WHERE property_name = (SELECT property_name FROM admin_properties WHERE id = $1) \
                ORDER BY invoice_date DESC LIMIT 10\
             ) t"
        )
        .bind(id)
        .fetch_one(pool),
    );

    let property = match property {
        Ok(Some(a)) => a,
        Ok(None) => return not_found("property"),
        Err(e) => {
            tracing::error!(error = %e, "Property detail query failed");
            return error_response(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                &e.to_string(),
            );
        }
    };

    let (total_invoiced, total_collected, total_outstanding) = financial.unwrap_or((0.0, 0.0, 0.0));

    Json(serde_json::json!({
        "property": property,
        "financial": {
            "total_invoiced": total_invoiced,
            "total_collected": total_collected,
            "total_outstanding": total_outstanding,
        },
        "invoices": invoices.unwrap_or(serde_json::json!([])),
        "images": [],
    }))
    .into_response()
}

pub async fn properties_names_handler(State(state): State<AdminState>) -> Response {
    match sqlx::query_scalar::<_, serde_json::Value>(
        "SELECT COALESCE(json_agg(row_to_json(t)), '[]') FROM (\
            SELECT id, property_name as name FROM admin_properties ORDER BY property_name\
         ) t",
    )
    .fetch_one(&*state.pool)
    .await
    {
        Ok(data) => Json(data).into_response(),
        Err(e) => {
            tracing::error!(error = %e, "Properties names query failed");
            error_response(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                &e.to_string(),
            )
        }
    }
}

pub async fn properties_images_handler(
    State(_state): State<AdminState>,
    Path(_folder): Path<String>,
) -> Response {
    // Images not stored in DB for demo -- return empty array
    Json(serde_json::json!([])).into_response()
}
