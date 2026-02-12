use axum::extract::{Path, State};
use axum::http::header;
use axum::response::{IntoResponse, Response};
use uuid::Uuid;

use crate::api::generic::AdminState;
use crate::api::types::error_response;
use crate::services::pdf::PdfService;

pub async fn invoice_pdf_handler(
    State(state): State<AdminState>,
    Path(id): Path<Uuid>,
) -> Response {
    let pool = &*state.pool;

    // Fetch the invoice
    let invoice = match sqlx::query_as::<_, (
        String,  // reference
        String,  // description
        String,  // property_name
        String,  // payer
        String,  // payee
        String,  // status
        f64,     // amount
        f64,     // paid
        f64,     // vat
        String,  // currency
        Option<chrono::NaiveDate>, // invoice_date
        Option<chrono::NaiveDate>, // payment_date
        String,  // type
        String,  // notes
    )>(
        "SELECT reference, description, property_name, payer, payee, status, \
         amount::float8, paid::float8, vat::float8, currency, invoice_date, payment_date, \
         type, notes \
         FROM admin_invoices WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    {
        Ok(Some(row)) => row,
        Ok(None) => {
            return error_response(axum::http::StatusCode::NOT_FOUND, "Invoice not found")
        }
        Err(e) => {
            tracing::error!(error = %e, "Invoice PDF query failed");
            return error_response(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                &e.to_string(),
            );
        }
    };

    // Look up payee (owner) details
    let payee_details = sqlx::query_as::<_, (String, String, String, String)>(
        "SELECT COALESCE(tax_id, ''), COALESCE(address, ''), COALESCE(email, ''), COALESCE(phone, '') \
         FROM admin_owners WHERE name = $1 LIMIT 1",
    )
    .bind(&invoice.4)
    .fetch_optional(pool)
    .await
    .ok()
    .flatten();

    // Look up payer (tenant) details
    let payer_details = sqlx::query_as::<_, (String, String, String, String)>(
        "SELECT COALESCE(tax_id, ''), COALESCE(address, ''), COALESCE(email, ''), COALESCE(phone, '') \
         FROM admin_tenants WHERE name = $1 LIMIT 1",
    )
    .bind(&invoice.3)
    .fetch_optional(pool)
    .await
    .ok()
    .flatten();

    // Look up property address
    let property_address: Option<String> = sqlx::query_scalar(
        "SELECT address FROM admin_properties WHERE property_name = $1 LIMIT 1",
    )
    .bind(&invoice.2)
    .fetch_optional(pool)
    .await
    .ok()
    .flatten();

    let enrichment = crate::services::pdf::InvoiceEnrichment {
        payee_tax_id: payee_details.as_ref().map(|d| d.0.clone()),
        payee_address: payee_details.as_ref().map(|d| d.1.clone()),
        payee_email: payee_details.as_ref().map(|d| d.2.clone()),
        payee_phone: payee_details.as_ref().map(|d| d.3.clone()),
        payer_tax_id: payer_details.as_ref().map(|d| d.0.clone()),
        payer_address: payer_details.as_ref().map(|d| d.1.clone()),
        payer_email: payer_details.as_ref().map(|d| d.2.clone()),
        payer_phone: payer_details.as_ref().map(|d| d.3.clone()),
        property_address,
    };

    let invoice_data = crate::services::pdf::InvoiceData {
        reference: invoice.0,
        description: invoice.1,
        property_name: invoice.2,
        payer: invoice.3,
        payee: invoice.4,
        status: invoice.5,
        amount: invoice.6,
        paid: invoice.7,
        vat: invoice.8,
        currency: invoice.9,
        invoice_date: invoice.10,
        payment_date: invoice.11,
        invoice_type: invoice.12,
        notes: invoice.13,
    };

    match PdfService::generate_invoice_pdf(&invoice_data, &enrichment) {
        Ok(pdf_bytes) => {
            let filename = format!("invoice-{}.pdf", invoice_data.reference);
            (
                [
                    (header::CONTENT_TYPE, "application/pdf".to_string()),
                    (
                        header::CONTENT_DISPOSITION,
                        format!("attachment; filename=\"{filename}\""),
                    ),
                ],
                pdf_bytes,
            )
                .into_response()
        }
        Err(e) => {
            tracing::error!(error = %e, "PDF generation failed");
            error_response(
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                &format!("PDF generation failed: {e}"),
            )
        }
    }
}
