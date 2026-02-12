use std::sync::Arc;

use axum::extract::{Path, Query, State};
use axum::response::{IntoResponse, Response};
use axum::Json;
use sqlx::PgPool;
use uuid::Uuid;

use super::types::{
    created_response, error_response, not_found, success_response, PaginatedResponse,
    PaginationQuery,
};

/// Trait that each entity implements to define its table and query behavior.
pub trait AdminEntity: Send + Sync + 'static {
    const TABLE_NAME: &'static str;
    const ENTITY_LABEL: &'static str;
    /// Fields searched with ILIKE when ?search= is provided
    const SEARCH_FIELDS: &'static [&'static str];
    /// Fields allowed as exact-match query filters
    const FILTER_FIELDS: &'static [&'static str];
    /// Whitelist of columns allowed in ORDER BY
    const SORTABLE_FIELDS: &'static [&'static str];
    /// Columns accepted for INSERT/UPDATE (excludes id, created_at, updated_at)
    const WRITABLE_FIELDS: &'static [&'static str];
    /// Default ORDER BY column
    const DEFAULT_SORT: &'static str;
}

// ── Entity definitions ──────────────────────────────────────────────────

pub struct PropertyEntity;
impl AdminEntity for PropertyEntity {
    const TABLE_NAME: &'static str = "admin_properties";
    const ENTITY_LABEL: &'static str = "properties";
    const SEARCH_FIELDS: &'static [&'static str] =
        &["property_name", "address", "contract_ref", "status", "image_folder"];
    const FILTER_FIELDS: &'static [&'static str] = &["status"];
    const SORTABLE_FIELDS: &'static [&'static str] = &[
        "property_name",
        "address",
        "status",
        "rent",
        "start_date",
        "end_date",
        "created_at",
        "updated_at",
    ];
    const WRITABLE_FIELDS: &'static [&'static str] = &[
        "property_name",
        "address",
        "contract_ref",
        "status",
        "rent",
        "start_date",
        "end_date",
        "tags",
        "image_folder",
    ];
    const DEFAULT_SORT: &'static str = "created_at";
}

pub struct TenantEntity;
impl AdminEntity for TenantEntity {
    const TABLE_NAME: &'static str = "admin_tenants";
    const ENTITY_LABEL: &'static str = "tenants";
    const SEARCH_FIELDS: &'static [&'static str] =
        &["name", "tax_id", "email", "phone", "property_name"];
    const FILTER_FIELDS: &'static [&'static str] = &["is_legacy"];
    const SORTABLE_FIELDS: &'static [&'static str] =
        &["name", "email", "property_name", "created_at", "updated_at"];
    const WRITABLE_FIELDS: &'static [&'static str] = &[
        "name",
        "tax_id",
        "email",
        "phone",
        "address",
        "bank_account",
        "property_name",
        "property_address",
        "is_legacy",
    ];
    const DEFAULT_SORT: &'static str = "created_at";
}

pub struct OwnerEntity;
impl AdminEntity for OwnerEntity {
    const TABLE_NAME: &'static str = "admin_owners";
    const ENTITY_LABEL: &'static str = "owners";
    const SEARCH_FIELDS: &'static [&'static str] =
        &["name", "tax_id", "email", "phone", "property_name"];
    const FILTER_FIELDS: &'static [&'static str] = &[];
    const SORTABLE_FIELDS: &'static [&'static str] =
        &["name", "email", "property_name", "created_at", "updated_at"];
    const WRITABLE_FIELDS: &'static [&'static str] = &[
        "name",
        "tax_id",
        "email",
        "phone",
        "address",
        "bank_account",
        "property_name",
        "property_address",
    ];
    const DEFAULT_SORT: &'static str = "created_at";
}

pub struct ContractEntity;
impl AdminEntity for ContractEntity {
    const TABLE_NAME: &'static str = "admin_contracts";
    const ENTITY_LABEL: &'static str = "contracts";
    const SEARCH_FIELDS: &'static [&'static str] =
        &["contract_ref", "property_name", "address", "tenant_name", "status"];
    const FILTER_FIELDS: &'static [&'static str] = &["status"];
    const SORTABLE_FIELDS: &'static [&'static str] = &[
        "contract_ref",
        "property_name",
        "tenant_name",
        "status",
        "rent",
        "total_value",
        "start_date",
        "end_date",
        "created_at",
        "updated_at",
    ];
    const WRITABLE_FIELDS: &'static [&'static str] = &[
        "contract_ref",
        "property_name",
        "address",
        "tenant_name",
        "status",
        "rent",
        "total_value",
        "start_date",
        "end_date",
        "tags",
        "doc_count",
    ];
    const DEFAULT_SORT: &'static str = "created_at";
}

pub struct InvoiceEntity;
impl AdminEntity for InvoiceEntity {
    const TABLE_NAME: &'static str = "admin_invoices";
    const ENTITY_LABEL: &'static str = "invoices";
    const SEARCH_FIELDS: &'static [&'static str] = &[
        "reference",
        "description",
        "contract_ref",
        "property_name",
        "payer",
        "payee",
        "status",
    ];
    const FILTER_FIELDS: &'static [&'static str] = &["status", "type", "expense_category", "payee"];
    const SORTABLE_FIELDS: &'static [&'static str] = &[
        "reference",
        "description",
        "property_name",
        "payer",
        "payee",
        "status",
        "amount",
        "paid",
        "invoice_date",
        "payment_date",
        "type",
        "created_at",
        "updated_at",
    ];
    const WRITABLE_FIELDS: &'static [&'static str] = &[
        "reference",
        "description",
        "contract_ref",
        "property_name",
        "payer",
        "payee",
        "status",
        "amount",
        "paid",
        "vat",
        "currency",
        "invoice_date",
        "payment_date",
        "type",
        "expense_category",
        "notes",
    ];
    const DEFAULT_SORT: &'static str = "invoice_date";
}

pub struct DepositEntity;
impl AdminEntity for DepositEntity {
    const TABLE_NAME: &'static str = "admin_deposits";
    const ENTITY_LABEL: &'static str = "deposits";
    const SEARCH_FIELDS: &'static [&'static str] =
        &["property_name", "contract_ref", "payer", "payee", "status"];
    const FILTER_FIELDS: &'static [&'static str] = &["status", "deposit_type"];
    const SORTABLE_FIELDS: &'static [&'static str] = &[
        "property_name",
        "contract_ref",
        "status",
        "amount",
        "deposit_date",
        "created_at",
        "updated_at",
    ];
    const WRITABLE_FIELDS: &'static [&'static str] = &[
        "deposit_date",
        "payment_date",
        "refund_date",
        "property_name",
        "contract_ref",
        "payer",
        "payee",
        "deposit_type",
        "status",
        "amount",
        "paid",
        "refunded",
    ];
    const DEFAULT_SORT: &'static str = "created_at";
}

pub struct SepaBatchEntity;
impl AdminEntity for SepaBatchEntity {
    const TABLE_NAME: &'static str = "admin_sepa_batches";
    const ENTITY_LABEL: &'static str = "sepa_batches";
    const SEARCH_FIELDS: &'static [&'static str] = &[
        "batch_id",
        "creditor",
        "creditor_iban",
        "debtor",
        "debtor_iban",
        "reference",
    ];
    const FILTER_FIELDS: &'static [&'static str] = &[];
    const SORTABLE_FIELDS: &'static [&'static str] = &[
        "batch_id",
        "collection_date",
        "creditor",
        "amount",
        "debtor",
        "created_at",
        "updated_at",
    ];
    const WRITABLE_FIELDS: &'static [&'static str] = &[
        "batch_id",
        "collection_date",
        "creditor",
        "creditor_iban",
        "amount",
        "currency",
        "debtor",
        "debtor_iban",
        "mandate_id",
        "reference",
    ];
    const DEFAULT_SORT: &'static str = "created_at";
}

pub struct IssueEntity;
impl AdminEntity for IssueEntity {
    const TABLE_NAME: &'static str = "admin_issues";
    const ENTITY_LABEL: &'static str = "issues";
    const SEARCH_FIELDS: &'static [&'static str] =
        &["property_name", "title", "description", "priority", "status"];
    const FILTER_FIELDS: &'static [&'static str] = &["status", "priority"];
    const SORTABLE_FIELDS: &'static [&'static str] = &[
        "property_name",
        "title",
        "priority",
        "status",
        "cost",
        "created_at",
        "updated_at",
    ];
    const WRITABLE_FIELDS: &'static [&'static str] =
        &["property_name", "title", "description", "priority", "status", "cost"];
    const DEFAULT_SORT: &'static str = "created_at";
}

pub struct InsuranceEntity;
impl AdminEntity for InsuranceEntity {
    const TABLE_NAME: &'static str = "admin_insurance";
    const ENTITY_LABEL: &'static str = "insurance";
    const SEARCH_FIELDS: &'static [&'static str] =
        &["property_name", "insurance_type", "company", "policy_number", "status"];
    const FILTER_FIELDS: &'static [&'static str] = &["status", "insurance_type"];
    const SORTABLE_FIELDS: &'static [&'static str] = &[
        "property_name",
        "company",
        "insurance_type",
        "status",
        "premium",
        "start_date",
        "end_date",
        "created_at",
        "updated_at",
    ];
    const WRITABLE_FIELDS: &'static [&'static str] = &[
        "property_name",
        "insurance_type",
        "company",
        "policy_number",
        "start_date",
        "end_date",
        "premium",
        "status",
        "notes",
    ];
    const DEFAULT_SORT: &'static str = "created_at";
}

pub struct AlertEntity;
impl AdminEntity for AlertEntity {
    const TABLE_NAME: &'static str = "admin_alerts";
    const ENTITY_LABEL: &'static str = "alerts";
    const SEARCH_FIELDS: &'static [&'static str] =
        &["type", "entity_type", "title", "description", "status"];
    const FILTER_FIELDS: &'static [&'static str] = &["status", "priority", "type"];
    const SORTABLE_FIELDS: &'static [&'static str] = &[
        "type",
        "entity_type",
        "title",
        "status",
        "priority",
        "created_at",
        "updated_at",
    ];
    const WRITABLE_FIELDS: &'static [&'static str] = &[
        "type",
        "entity_type",
        "entity_id",
        "title",
        "description",
        "status",
        "priority",
    ];
    const DEFAULT_SORT: &'static str = "created_at";
}

pub struct ContactEntity;
impl AdminEntity for ContactEntity {
    const TABLE_NAME: &'static str = "admin_contacts";
    const ENTITY_LABEL: &'static str = "contacts";
    const SEARCH_FIELDS: &'static [&'static str] =
        &["name", "email", "phone", "contact_type"];
    const FILTER_FIELDS: &'static [&'static str] = &["contact_type"];
    const SORTABLE_FIELDS: &'static [&'static str] = &[
        "name",
        "email",
        "contact_type",
        "created_at",
        "updated_at",
    ];
    const WRITABLE_FIELDS: &'static [&'static str] = &[
        "name",
        "tax_id",
        "iban",
        "email",
        "phone",
        "address",
        "contact_type",
        "notes",
    ];
    const DEFAULT_SORT: &'static str = "created_at";
}

pub struct LeadEntity;
impl AdminEntity for LeadEntity {
    const TABLE_NAME: &'static str = "admin_leads";
    const ENTITY_LABEL: &'static str = "leads";
    const SEARCH_FIELDS: &'static [&'static str] =
        &["name", "email", "phone", "company", "property_name", "status"];
    const FILTER_FIELDS: &'static [&'static str] = &["status", "source", "interest_type", "assigned_to"];
    const SORTABLE_FIELDS: &'static [&'static str] = &[
        "name",
        "company",
        "status",
        "source",
        "score",
        "contact_date",
        "follow_up_date",
        "created_at",
        "updated_at",
    ];
    const WRITABLE_FIELDS: &'static [&'static str] = &[
        "name",
        "email",
        "phone",
        "company",
        "source",
        "status",
        "interest_type",
        "property_name",
        "budget_min",
        "budget_max",
        "min_bedrooms",
        "min_sqm",
        "preferred_area",
        "contact_date",
        "follow_up_date",
        "assigned_to",
        "score",
        "notes",
    ];
    const DEFAULT_SORT: &'static str = "created_at";
}

pub struct LeadNoteEntity;
impl AdminEntity for LeadNoteEntity {
    const TABLE_NAME: &'static str = "admin_lead_notes";
    const ENTITY_LABEL: &'static str = "lead_notes";
    const SEARCH_FIELDS: &'static [&'static str] =
        &["content", "author"];
    const FILTER_FIELDS: &'static [&'static str] = &["lead_id", "author"];
    const SORTABLE_FIELDS: &'static [&'static str] = &[
        "author",
        "created_at",
        "updated_at",
    ];
    const WRITABLE_FIELDS: &'static [&'static str] = &[
        "lead_id",
        "content",
        "author",
    ];
    const DEFAULT_SORT: &'static str = "created_at";
}

// ── Shared state ────────────────────────────────────────────────────────

#[derive(Clone)]
pub struct AdminState {
    pub pool: Arc<PgPool>,
}

impl AdminState {
    pub fn new(pool: Arc<PgPool>) -> Self {
        Self { pool }
    }
}

// ── Query builder helpers ───────────────────────────────────────────────

struct QueryBuilder {
    conditions: Vec<String>,
    bind_values: Vec<String>,
}

impl QueryBuilder {
    fn new() -> Self {
        Self {
            conditions: Vec::new(),
            bind_values: Vec::new(),
        }
    }

    fn add_search(&mut self, search: &str, fields: &[&str]) {
        if search.is_empty() || fields.is_empty() {
            return;
        }
        let idx = self.bind_values.len() + 1;
        let conds: Vec<String> = fields
            .iter()
            .map(|f| format!("{f}::text ILIKE ${idx}"))
            .collect();
        self.conditions.push(format!("({})", conds.join(" OR ")));
        self.bind_values.push(format!("%{search}%"));
    }

    fn add_filter(&mut self, field: &str, value: &str) {
        let idx = self.bind_values.len() + 1;
        self.conditions.push(format!("{field} = ${idx}"));
        self.bind_values.push(value.to_string());
    }

    fn where_clause(&self) -> String {
        if self.conditions.is_empty() {
            String::new()
        } else {
            format!("WHERE {}", self.conditions.join(" AND "))
        }
    }

    async fn fetch_json(
        &self,
        sql: &str,
        pool: &PgPool,
    ) -> Result<Vec<serde_json::Value>, sqlx::Error> {
        let mut query = sqlx::query_scalar::<_, serde_json::Value>(sql);
        for val in &self.bind_values {
            query = query.bind(val.as_str());
        }
        query.fetch_all(pool).await
    }

    async fn fetch_count(&self, sql: &str, pool: &PgPool) -> Result<i64, sqlx::Error> {
        let mut query = sqlx::query_scalar::<_, i64>(sql);
        for val in &self.bind_values {
            query = query.bind(val.as_str());
        }
        query.fetch_one(pool).await
    }
}

fn validated_sort<E: AdminEntity>(params: &PaginationQuery) -> (&str, &str) {
    let sort_field = params
        .sort
        .as_deref()
        .filter(|s| E::SORTABLE_FIELDS.contains(s))
        .unwrap_or(E::DEFAULT_SORT);
    let sort_order = match params.order.as_deref() {
        Some("asc") => "ASC",
        _ => "DESC",
    };
    (sort_field, sort_order)
}

fn build_filters<E: AdminEntity>(params: &PaginationQuery) -> QueryBuilder {
    let mut qb = QueryBuilder::new();
    if let Some(ref search) = params.search {
        qb.add_search(search, E::SEARCH_FIELDS);
    }
    for field in E::FILTER_FIELDS {
        if let Some(value) = params.filters.get(*field) {
            if !value.is_empty() {
                qb.add_filter(field, value);
            }
        }
    }
    qb
}

// ── Generic handlers ────────────────────────────────────────────────────

pub async fn generic_list<E: AdminEntity>(
    State(state): State<AdminState>,
    Query(params): Query<PaginationQuery>,
) -> Response {
    let qb = build_filters::<E>(&params);
    let where_clause = qb.where_clause();
    let (sort_field, sort_order) = validated_sort::<E>(&params);

    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(25);
    let limit_offset = if per_page > 0 {
        format!("LIMIT {per_page} OFFSET {}", (page - 1) * per_page)
    } else {
        String::new()
    };

    let data_sql = format!(
        "SELECT row_to_json(t) FROM (SELECT * FROM {} {} ORDER BY {} {} {}) t",
        E::TABLE_NAME,
        where_clause,
        sort_field,
        sort_order,
        limit_offset
    );
    let count_sql = format!(
        "SELECT COUNT(*)::bigint FROM {} {}",
        E::TABLE_NAME, where_clause
    );

    let pool = &*state.pool;
    let (data_result, count_result) =
        tokio::join!(qb.fetch_json(&data_sql, pool), qb.fetch_count(&count_sql, pool));

    match (data_result, count_result) {
        (Ok(data), Ok(total)) => Json(PaginatedResponse { data, total }).into_response(),
        (Err(e), _) | (_, Err(e)) => {
            tracing::error!(error = %e, table = E::TABLE_NAME, "List query failed");
            error_response(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                &e.to_string(),
            )
        }
    }
}

pub async fn generic_get_by_id<E: AdminEntity>(
    State(state): State<AdminState>,
    Path(id): Path<Uuid>,
) -> Response {
    let sql = format!(
        "SELECT row_to_json(t) FROM (SELECT * FROM {} WHERE id = $1) t",
        E::TABLE_NAME
    );

    match sqlx::query_scalar::<_, serde_json::Value>(&sql)
        .bind(id)
        .fetch_optional(&*state.pool)
        .await
    {
        Ok(Some(row)) => Json(row).into_response(),
        Ok(None) => not_found(E::ENTITY_LABEL),
        Err(e) => {
            tracing::error!(error = %e, "Get by ID failed");
            error_response(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                &e.to_string(),
            )
        }
    }
}

pub async fn generic_create<E: AdminEntity>(
    State(state): State<AdminState>,
    Json(body): Json<serde_json::Value>,
) -> Response {
    let obj = match body.as_object() {
        Some(o) => o,
        None => return error_response(axum::http::StatusCode::BAD_REQUEST, "Expected JSON object"),
    };

    let mut columns = vec!["id".to_string()];
    let mut placeholders = vec!["gen_random_uuid()".to_string()];
    let mut values: Vec<String> = Vec::new();
    let mut idx = 1usize;

    for field in E::WRITABLE_FIELDS {
        if let Some(val) = obj.get(*field) {
            columns.push((*field).to_string());
            placeholders.push(format!("${idx}"));
            values.push(json_to_sql_string(val));
            idx += 1;
        }
    }

    let sql = format!(
        "INSERT INTO {} ({}) VALUES ({}) RETURNING id::text",
        E::TABLE_NAME,
        columns.join(", "),
        placeholders.join(", ")
    );

    let mut query = sqlx::query_scalar::<_, String>(&sql);
    for val in &values {
        query = query.bind(val.as_str());
    }

    match query.fetch_one(&*state.pool).await {
        Ok(id) => {
            let _ = write_audit(&state.pool, E::ENTITY_LABEL, &id, "create", None, Some(&body)).await;
            created_response(id)
        }
        Err(e) => {
            tracing::error!(error = %e, "Create failed");
            error_response(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                &e.to_string(),
            )
        }
    }
}

pub async fn generic_update<E: AdminEntity>(
    State(state): State<AdminState>,
    Path(id): Path<Uuid>,
    Json(body): Json<serde_json::Value>,
) -> Response {
    let obj = match body.as_object() {
        Some(o) => o,
        None => return error_response(axum::http::StatusCode::BAD_REQUEST, "Expected JSON object"),
    };

    let mut sets: Vec<String> = Vec::new();
    let mut values: Vec<String> = Vec::new();
    let mut idx = 1usize;

    for field in E::WRITABLE_FIELDS {
        if let Some(val) = obj.get(*field) {
            sets.push(format!("{field} = ${idx}"));
            values.push(json_to_sql_string(val));
            idx += 1;
        }
    }

    if sets.is_empty() {
        return error_response(axum::http::StatusCode::BAD_REQUEST, "No valid fields to update");
    }

    sets.push(format!("updated_at = NOW()"));

    let sql = format!(
        "UPDATE {} SET {} WHERE id = ${} RETURNING id::text",
        E::TABLE_NAME,
        sets.join(", "),
        idx
    );

    let mut query = sqlx::query_scalar::<_, String>(&sql);
    for val in &values {
        query = query.bind(val.as_str());
    }
    query = query.bind(id);

    match query.fetch_optional(&*state.pool).await {
        Ok(Some(id_str)) => {
            let _ = write_audit(&state.pool, E::ENTITY_LABEL, &id_str, "update", None, Some(&body)).await;
            success_response()
        }
        Ok(None) => not_found(E::ENTITY_LABEL),
        Err(e) => {
            tracing::error!(error = %e, "Update failed");
            error_response(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                &e.to_string(),
            )
        }
    }
}

pub async fn generic_delete<E: AdminEntity>(
    State(state): State<AdminState>,
    Path(id): Path<Uuid>,
) -> Response {
    let sql = format!(
        "DELETE FROM {} WHERE id = $1 RETURNING id::text",
        E::TABLE_NAME
    );

    match sqlx::query_scalar::<_, String>(&sql)
        .bind(id)
        .fetch_optional(&*state.pool)
        .await
    {
        Ok(Some(id_str)) => {
            let _ = write_audit(&state.pool, E::ENTITY_LABEL, &id_str, "delete", None, None).await;
            success_response()
        }
        Ok(None) => not_found(E::ENTITY_LABEL),
        Err(e) => {
            tracing::error!(error = %e, "Delete failed");
            error_response(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                &e.to_string(),
            )
        }
    }
}

// ── Audit helper ────────────────────────────────────────────────────────

pub async fn write_audit(
    pool: &PgPool,
    entity_type: &str,
    entity_id: &str,
    action: &str,
    old_values: Option<&serde_json::Value>,
    new_values: Option<&serde_json::Value>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO admin_audit_log (entity_type, entity_id, action, old_values, new_values, changed_fields) \
         VALUES ($1, $2::uuid, $3, $4, $5, '{}')"
    )
    .bind(entity_type)
    .bind(entity_id)
    .bind(action)
    .bind(old_values)
    .bind(new_values)
    .execute(pool)
    .await?;
    Ok(())
}

// ── Helpers ─────────────────────────────────────────────────────────────

fn json_to_sql_string(val: &serde_json::Value) -> String {
    match val {
        serde_json::Value::String(s) => s.clone(),
        serde_json::Value::Number(n) => n.to_string(),
        serde_json::Value::Bool(b) => b.to_string(),
        serde_json::Value::Null => String::new(),
        serde_json::Value::Array(arr) => {
            // Convert JSON array to PostgreSQL array literal
            let items: Vec<String> = arr
                .iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect();
            format!("{{{}}}", items.join(","))
        }
        other => other.to_string(),
    }
}
