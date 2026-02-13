pub mod generic;
pub mod handlers;
pub mod types;

use std::sync::Arc;

use axum::routing::{get, post};
use axum::Router;
use sqlx::PgPool;

use generic::{
    AdminState, AlertEntity, ContactEntity, ContractEntity, DepositEntity, InsuranceEntity,
    IssueEntity, LeadEntity, LeadNoteEntity, OwnerEntity, PropertyEntity, SepaBatchEntity,
    TenantEntity,
};

pub fn router(pool: Arc<PgPool>) -> Router {
    let state = AdminState::new(pool);

    Router::new()
        // ── Auth Session (public, no auth required) ──────────
        .route(
            "/auth/session",
            post(handlers::auth::set_session).delete(handlers::auth::clear_session),
        )
        // ── Dashboard & Reports ─────────────────────────────
        .route("/dashboard", get(handlers::dashboard::dashboard_handler))
        .route(
            "/reports/arrears",
            get(handlers::reports::arrears_handler),
        )
        .route(
            "/reports/profitability",
            get(handlers::reports::profitability_handler),
        )
        // ── Audit ───────────────────────────────────────────
        .route("/audit/recent", get(handlers::audit::audit_recent_handler))
        .route(
            "/audit/{entity_type}/{entity_id}",
            get(handlers::audit::audit_entity_handler),
        )
        // ── Properties (specific routes before generic) ──────
        .route(
            "/properties/names",
            get(handlers::properties::properties_names_handler),
        )
        .route(
            "/properties/images/{folder}",
            get(handlers::properties::properties_images_handler),
        )
        .route(
            "/properties/{id}/detail",
            get(handlers::properties::property_detail_handler),
        )
        // ── Contracts (specific) ────────────────────────────
        .route(
            "/contracts/{id}/detail",
            get(handlers::contracts::contract_detail_handler),
        )
        .route(
            "/contract-documents/{id}/text",
            post(handlers::contracts::contract_doc_text_handler),
        )
        // ── Tenants (specific) ─────────────────────────────
        .route(
            "/tenants/names",
            get(handlers::tenants::tenants_names_handler),
        )
        // ── Contacts (specific) ───────────────────────────
        .route(
            "/contacts/names",
            get(handlers::contacts::contacts_names_handler),
        )
        // ── SEPA Batches (specific) ───────────────────────
        .route(
            "/sepa-batches/creditors",
            get(handlers::sepa_batches::sepa_batches_creditors_handler),
        )
        // ── Invoices (custom list + payees + owners + PDF) ─
        .route(
            "/invoices/owners",
            get(handlers::invoices::invoices_owners_handler),
        )
        .route(
            "/invoices/payees",
            get(handlers::invoices::invoices_payees_handler),
        )
        .route(
            "/invoices/{id}/pdf",
            get(handlers::pdf::invoice_pdf_handler),
        )
        .route(
            "/invoices",
            get(handlers::invoices::invoices_list_handler)
                .post(generic::generic_create::<generic::InvoiceEntity>),
        )
        .route(
            "/invoices/{id}",
            get(generic::generic_get_by_id::<generic::InvoiceEntity>)
                .put(generic::generic_update::<generic::InvoiceEntity>)
                .delete(generic::generic_delete::<generic::InvoiceEntity>),
        )
        // ── Export ──────────────────────────────────────────
        .route("/export/{entity}", get(handlers::export::export_handler))
        // ── Generic CRUD: Properties ─────────────────────────
        .route(
            "/properties",
            get(generic::generic_list::<PropertyEntity>)
                .post(generic::generic_create::<PropertyEntity>),
        )
        .route(
            "/properties/{id}",
            get(generic::generic_get_by_id::<PropertyEntity>)
                .put(generic::generic_update::<PropertyEntity>)
                .delete(generic::generic_delete::<PropertyEntity>),
        )
        // ── Generic CRUD: Contracts ─────────────────────────
        .route(
            "/contracts",
            get(generic::generic_list::<ContractEntity>)
                .post(generic::generic_create::<ContractEntity>),
        )
        .route(
            "/contracts/{id}",
            get(generic::generic_get_by_id::<ContractEntity>)
                .put(generic::generic_update::<ContractEntity>)
                .delete(generic::generic_delete::<ContractEntity>),
        )
        // ── Generic CRUD: Tenants ───────────────────────────
        .route(
            "/tenants",
            get(generic::generic_list::<TenantEntity>)
                .post(generic::generic_create::<TenantEntity>),
        )
        .route(
            "/tenants/{id}",
            get(generic::generic_get_by_id::<TenantEntity>)
                .put(generic::generic_update::<TenantEntity>)
                .delete(generic::generic_delete::<TenantEntity>),
        )
        // ── Generic CRUD: Owners ────────────────────────────
        .route(
            "/owners",
            get(generic::generic_list::<OwnerEntity>)
                .post(generic::generic_create::<OwnerEntity>),
        )
        .route(
            "/owners/{id}",
            get(generic::generic_get_by_id::<OwnerEntity>)
                .put(generic::generic_update::<OwnerEntity>)
                .delete(generic::generic_delete::<OwnerEntity>),
        )
        // ── Generic CRUD: Deposits ──────────────────────────
        .route(
            "/deposits",
            get(generic::generic_list::<DepositEntity>)
                .post(generic::generic_create::<DepositEntity>),
        )
        .route(
            "/deposits/{id}",
            get(generic::generic_get_by_id::<DepositEntity>)
                .put(generic::generic_update::<DepositEntity>)
                .delete(generic::generic_delete::<DepositEntity>),
        )
        // ── Generic CRUD: SEPA Batches ──────────────────────
        .route(
            "/sepa-batches",
            get(generic::generic_list::<SepaBatchEntity>)
                .post(generic::generic_create::<SepaBatchEntity>),
        )
        .route(
            "/sepa-batches/{id}",
            get(generic::generic_get_by_id::<SepaBatchEntity>)
                .put(generic::generic_update::<SepaBatchEntity>)
                .delete(generic::generic_delete::<SepaBatchEntity>),
        )
        // ── Generic CRUD: Issues ────────────────────────────
        .route(
            "/issues",
            get(generic::generic_list::<IssueEntity>)
                .post(generic::generic_create::<IssueEntity>),
        )
        .route(
            "/issues/{id}",
            get(generic::generic_get_by_id::<IssueEntity>)
                .put(generic::generic_update::<IssueEntity>)
                .delete(generic::generic_delete::<IssueEntity>),
        )
        // ── Generic CRUD: Insurance ─────────────────────────
        .route(
            "/insurance",
            get(generic::generic_list::<InsuranceEntity>)
                .post(generic::generic_create::<InsuranceEntity>),
        )
        .route(
            "/insurance/{id}",
            get(generic::generic_get_by_id::<InsuranceEntity>)
                .put(generic::generic_update::<InsuranceEntity>)
                .delete(generic::generic_delete::<InsuranceEntity>),
        )
        // ── Generic CRUD: Alerts ────────────────────────────
        .route(
            "/alerts",
            get(generic::generic_list::<AlertEntity>)
                .post(generic::generic_create::<AlertEntity>),
        )
        .route(
            "/alerts/{id}",
            get(generic::generic_get_by_id::<AlertEntity>)
                .put(generic::generic_update::<AlertEntity>)
                .delete(generic::generic_delete::<AlertEntity>),
        )
        // ── Generic CRUD: Contacts ──────────────────────────
        .route(
            "/contacts",
            get(generic::generic_list::<ContactEntity>)
                .post(generic::generic_create::<ContactEntity>),
        )
        .route(
            "/contacts/{id}",
            get(generic::generic_get_by_id::<ContactEntity>)
                .put(generic::generic_update::<ContactEntity>)
                .delete(generic::generic_delete::<ContactEntity>),
        )
        // ── Generic CRUD: Leads ─────────────────────────────
        .route(
            "/leads",
            get(generic::generic_list::<LeadEntity>)
                .post(generic::generic_create::<LeadEntity>),
        )
        .route(
            "/leads/{id}",
            get(generic::generic_get_by_id::<LeadEntity>)
                .put(generic::generic_update::<LeadEntity>)
                .delete(generic::generic_delete::<LeadEntity>),
        )
        // ── Generic CRUD: Lead Notes ────────────────────────
        .route(
            "/lead-notes",
            get(generic::generic_list::<LeadNoteEntity>)
                .post(generic::generic_create::<LeadNoteEntity>),
        )
        .route(
            "/lead-notes/{id}",
            get(generic::generic_get_by_id::<LeadNoteEntity>)
                .put(generic::generic_update::<LeadNoteEntity>)
                .delete(generic::generic_delete::<LeadNoteEntity>),
        )
        .with_state(state)
}
