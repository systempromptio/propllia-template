use axum::extract::State;
use axum::response::{IntoResponse, Response};
use axum::Json;

use crate::api::generic::AdminState;

pub async fn dashboard_handler(State(state): State<AdminState>) -> Response {
    let pool = &*state.pool;

    let (
        properties_count,
        income_totals,
        properties_by_status,
        overdue,
        expiring,
        recent_activity,
        by_payee,
        by_property,
    ) = tokio::join!(
        // Total properties
        sqlx::query_scalar::<_, i64>("SELECT COUNT(*)::bigint FROM admin_properties")
            .fetch_one(pool),
        // Income totals
        sqlx::query_as::<_, (f64, f64, f64, i64)>(
            "SELECT \
                COALESCE(SUM(amount), 0)::float8, \
                COALESCE(SUM(paid), 0)::float8, \
                COALESCE(SUM(amount - paid), 0)::float8, \
                COUNT(*) FILTER (WHERE status IN ('Unpaid', 'Partial'))::bigint \
             FROM admin_invoices WHERE type = 'income'"
        ).fetch_one(pool),
        // Properties by status
        sqlx::query_scalar::<_, serde_json::Value>(
            "SELECT json_agg(row_to_json(t)) FROM (\
                SELECT status, COUNT(*)::int as count FROM admin_properties GROUP BY status ORDER BY count DESC\
             ) t"
        ).fetch_one(pool),
        // Overdue invoices (unpaid/partial income, older than 15 days)
        sqlx::query_scalar::<_, serde_json::Value>(
            "SELECT COALESCE(json_agg(row_to_json(t)), '[]') FROM (\
                SELECT * FROM admin_invoices \
                WHERE status IN ('Unpaid', 'Partial') AND type = 'income' \
                AND invoice_date < CURRENT_DATE - INTERVAL '15 days' ORDER BY invoice_date ASC\
             ) t"
        ).fetch_one(pool),
        // Expiring leases (within 90 days)
        sqlx::query_scalar::<_, serde_json::Value>(
            "SELECT COALESCE(json_agg(row_to_json(t)), '[]') FROM (\
                SELECT * FROM admin_properties \
                WHERE end_date IS NOT NULL AND end_date <= CURRENT_DATE + INTERVAL '90 days' \
                AND status = 'Let' ORDER BY end_date ASC\
             ) t"
        ).fetch_one(pool),
        // Recent activity (last 5 audit entries)
        sqlx::query_scalar::<_, serde_json::Value>(
            "SELECT COALESCE(json_agg(row_to_json(t)), '[]') FROM (\
                SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT 5\
             ) t"
        ).fetch_one(pool),
        // Financial by payee
        sqlx::query_scalar::<_, serde_json::Value>(
            "SELECT COALESCE(json_agg(row_to_json(t)), '[]') FROM (\
                SELECT payee, \
                    SUM(amount)::float8 as total_invoiced, \
                    SUM(paid)::float8 as total_collected, \
                    SUM(amount - paid)::float8 as total_outstanding, \
                    COUNT(DISTINCT property_name)::int as num_properties \
                FROM admin_invoices WHERE type = 'income' \
                GROUP BY payee ORDER BY total_invoiced DESC\
             ) t"
        ).fetch_one(pool),
        // Financial by property
        sqlx::query_scalar::<_, serde_json::Value>(
            "SELECT COALESCE(json_agg(row_to_json(t)), '[]') FROM (\
                SELECT property_name, \
                    SUM(amount)::float8 as total_invoiced, \
                    SUM(paid)::float8 as total_collected, \
                    SUM(amount - paid)::float8 as total_outstanding, \
                    COUNT(*)::int as num_invoices \
                FROM admin_invoices WHERE type = 'income' \
                GROUP BY property_name ORDER BY total_invoiced DESC\
             ) t"
        ).fetch_one(pool),
    );

    let total_properties = properties_count.unwrap_or(0);
    let (total_invoiced, total_collected, total_outstanding, pending_count) =
        income_totals.unwrap_or((0.0, 0.0, 0.0, 0));
    let collection_rate = if total_invoiced > 0.0 {
        (total_collected / total_invoiced * 1000.0).round() / 10.0
    } else {
        0.0
    };

    let result = serde_json::json!({
        "total_properties": total_properties,
        "total_invoiced": total_invoiced,
        "total_collected": total_collected,
        "total_outstanding": total_outstanding,
        "pending_count": pending_count,
        "collection_rate": collection_rate,
        "properties_by_status": properties_by_status.unwrap_or(serde_json::Value::Null),
        "overdue_invoices": overdue.unwrap_or(serde_json::json!([])),
        "expiring_leases": expiring.unwrap_or(serde_json::json!([])),
        "recent_activity": recent_activity.unwrap_or(serde_json::json!([])),
        "financial_by_payee": by_payee.unwrap_or(serde_json::json!([])),
        "financial_by_property": by_property.unwrap_or(serde_json::json!([])),
    });

    Json(result).into_response()
}
