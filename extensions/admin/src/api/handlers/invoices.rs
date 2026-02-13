use axum::extract::{Query, State};
use axum::response::{IntoResponse, Response};
use axum::Json;

use crate::api::generic::{AdminEntity, AdminState, InvoiceEntity};
use crate::api::types::{error_response, PaginatedWithTotals, PaginationQuery};

/// Custom list handler that includes totals alongside paginated data.
pub async fn invoices_list_handler(
    State(state): State<AdminState>,
    Query(params): Query<PaginationQuery>,
) -> Response {
    let pool = &*state.pool;

    // Build WHERE clause
    let mut conditions: Vec<String> = Vec::new();
    let mut bind_values: Vec<String> = Vec::new();

    if let Some(ref search) = params.search {
        if !search.is_empty() {
            let idx = bind_values.len() + 1;
            let conds: Vec<String> = InvoiceEntity::SEARCH_FIELDS
                .iter()
                .map(|f| format!("{f}::text ILIKE ${idx}"))
                .collect();
            conditions.push(format!("({})", conds.join(" OR ")));
            bind_values.push(format!("%{search}%"));
        }
    }

    for field in InvoiceEntity::FILTER_FIELDS {
        if let Some(value) = params.filters.get(*field) {
            if !value.is_empty() {
                let idx = bind_values.len() + 1;
                conditions.push(format!("{field} = ${idx}"));
                bind_values.push(value.clone());
            }
        }
    }

    let where_clause = if conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", conditions.join(" AND "))
    };

    let sort_field = params
        .sort
        .as_deref()
        .filter(|s| InvoiceEntity::SORTABLE_FIELDS.contains(s))
        .unwrap_or(InvoiceEntity::DEFAULT_SORT);
    let sort_order = match params.order.as_deref() {
        Some("asc") => "ASC",
        _ => "DESC",
    };

    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(25);
    let limit_offset = if per_page > 0 {
        format!("LIMIT {per_page} OFFSET {}", (page - 1) * per_page)
    } else {
        String::new()
    };

    let data_sql = format!(
        "SELECT row_to_json(t) FROM (SELECT * FROM admin_invoices {where_clause} ORDER BY {sort_field} {sort_order} {limit_offset}) t"
    );
    let count_sql =
        format!("SELECT COUNT(*)::bigint FROM admin_invoices {where_clause}");
    let totals_sql = format!(
        "SELECT COALESCE(SUM(amount), 0)::float8, COALESCE(SUM(paid), 0)::float8 \
         FROM admin_invoices {where_clause}"
    );

    // Build queries with binds
    let mut data_q = sqlx::query_scalar::<_, serde_json::Value>(&data_sql);
    let mut count_q = sqlx::query_scalar::<_, i64>(&count_sql);
    let mut totals_q = sqlx::query_as::<_, (f64, f64)>(&totals_sql);
    for val in &bind_values {
        data_q = data_q.bind(val.as_str());
        count_q = count_q.bind(val.as_str());
        totals_q = totals_q.bind(val.as_str());
    }

    let (data_result, count_result, totals_result) = tokio::join!(
        data_q.fetch_all(pool),
        count_q.fetch_one(pool),
        totals_q.fetch_one(pool)
    );

    match (data_result, count_result, totals_result) {
        (Ok(data), Ok(total), Ok((sum_amount, sum_paid))) => {
            Json(PaginatedWithTotals {
                data,
                total,
                totals: serde_json::json!({
                    "amount": sum_amount,
                    "paid": sum_paid,
                }),
            })
            .into_response()
        }
        (Err(e), _, _) | (_, Err(e), _) => {
            tracing::error!(error = %e, "Invoices list query failed");
            error_response(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                &e.to_string(),
            )
        }
        (_, _, Err(e)) => {
            tracing::error!(error = %e, "Invoices totals query failed");
            error_response(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                &e.to_string(),
            )
        }
    }
}

pub async fn invoices_owners_handler(State(state): State<AdminState>) -> Response {
    match sqlx::query_scalar::<_, serde_json::Value>(
        "SELECT COALESCE(json_agg(row_to_json(t)), '[]') FROM (\
            SELECT id, name FROM admin_owners ORDER BY name\
         ) t",
    )
    .fetch_one(&*state.pool)
    .await
    {
        Ok(data) => Json(data).into_response(),
        Err(e) => {
            tracing::error!(error = %e, "Invoice owners query failed");
            error_response(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                &e.to_string(),
            )
        }
    }
}

pub async fn invoices_payees_handler(State(state): State<AdminState>) -> Response {
    match sqlx::query_scalar::<_, serde_json::Value>(
        "SELECT COALESCE(json_agg(t.payee), '[]') FROM (\
            SELECT DISTINCT payee FROM admin_invoices WHERE payee != '' ORDER BY payee\
         ) t",
    )
    .fetch_one(&*state.pool)
    .await
    {
        Ok(data) => Json(data).into_response(),
        Err(e) => {
            tracing::error!(error = %e, "Payees query failed");
            error_response(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                &e.to_string(),
            )
        }
    }
}
