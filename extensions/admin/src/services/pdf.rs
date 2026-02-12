use std::io::BufWriter;
use std::path::PathBuf;

use chrono::{Datelike, NaiveDate};
use printpdf::*;

use crate::error::AdminError;

// ── Layout constants (A4, millimetres) ──────────────────────────────────────
const PAGE_W: f32 = 210.0;
const PAGE_H: f32 = 297.0;
const ML: f32 = 25.0; // left margin
const MR: f32 = 25.0; // right margin
const MT: f32 = 20.0; // top margin
const CONTENT_W: f32 = PAGE_W - ML - MR;

// ── Brand colours (r, g, b  0.0-1.0) ───────────────────────────────────────
const ACCENT: (f32, f32, f32) = (0.118, 0.227, 0.478); // #1E3A7A dark blue
const DARK: (f32, f32, f32) = (0.133, 0.133, 0.133); // #222222
const MID: (f32, f32, f32) = (0.333, 0.333, 0.333); // #555555
const LIGHT: (f32, f32, f32) = (0.533, 0.533, 0.533); // #888888
const BORDER: (f32, f32, f32) = (0.800, 0.800, 0.800); // #CCCCCC

/// Invoice data from the database.
#[derive(Debug)]
pub struct InvoiceData {
    pub reference: String,
    pub description: String,
    pub property_name: String,
    pub payer: String,
    pub payee: String,
    pub status: String,
    pub amount: f64,
    pub paid: f64,
    pub vat: f64,
    pub currency: String,
    pub invoice_date: Option<NaiveDate>,
    pub payment_date: Option<NaiveDate>,
    pub invoice_type: String,
    pub notes: String,
}

/// Additional data from owner/tenant lookups for enriching the invoice.
#[derive(Debug, Default)]
pub struct InvoiceEnrichment {
    pub payee_tax_id: Option<String>,
    pub payee_address: Option<String>,
    pub payee_email: Option<String>,
    pub payee_phone: Option<String>,
    pub payer_tax_id: Option<String>,
    pub payer_address: Option<String>,
    pub payer_email: Option<String>,
    pub payer_phone: Option<String>,
    pub property_address: Option<String>,
}

pub struct PdfService;

impl PdfService {
    /// Generate a styled invoice PDF using printpdf (pure Rust).
    pub fn generate_invoice_pdf(
        entry: &InvoiceData,
        enrichment: &InvoiceEnrichment,
    ) -> Result<Vec<u8>, AdminError> {
        let (doc, page, layer) =
            PdfDocument::new("Invoice", Mm(PAGE_W), Mm(PAGE_H), "Layer 1");

        let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
        let fonts_dir = cwd.join("storage/files/fonts/Nunito");

        let font_regular = load_font(&doc, &fonts_dir.join("Nunito-Regular.ttf"))?;
        let font_medium = load_font(&doc, &fonts_dir.join("Nunito-Medium.ttf"))?;
        let font_bold = load_font(&doc, &fonts_dir.join("Nunito-Bold.ttf"))?;
        let font_extrabold = load_font(&doc, &fonts_dir.join("Nunito-ExtraBold.ttf"))?;

        let fonts = Fonts {
            regular: &font_regular,
            medium: &font_medium,
            bold: &font_bold,
            extrabold: &font_extrabold,
        };

        let current_layer = doc.get_page(page).get_layer(layer);
        let mut y = PAGE_H - MT;

        y = draw_header(&current_layer, &fonts, y);
        y = draw_invoice_details(&current_layer, &fonts, entry, y);
        y = draw_parties(&current_layer, &fonts, entry, enrichment, y);
        y = draw_line_items_header(&current_layer, &fonts, y);
        y = draw_line_items(&current_layer, &fonts, entry, y);
        y = draw_totals(&current_layer, &fonts, entry, y);
        draw_footer(&current_layer, &fonts, entry, y);

        let mut buf = BufWriter::new(Vec::new());
        doc.save(&mut buf)
            .map_err(|e| AdminError::PdfGeneration(format!("PDF save error: {e}")))?;

        buf.into_inner()
            .map_err(|e| AdminError::PdfGeneration(format!("Buffer error: {e}")))
    }
}

// ── Font bundle ─────────────────────────────────────────────────────────────

struct Fonts<'a> {
    regular: &'a IndirectFontRef,
    medium: &'a IndirectFontRef,
    bold: &'a IndirectFontRef,
    extrabold: &'a IndirectFontRef,
}

fn load_font(
    doc: &PdfDocumentReference,
    path: &std::path::Path,
) -> Result<IndirectFontRef, AdminError> {
    let bytes = std::fs::read(path).map_err(|e| {
        AdminError::PdfGeneration(format!("Font not found at {}: {e}", path.display()))
    })?;
    doc.add_external_font(bytes.as_slice())
        .map_err(|e| AdminError::PdfGeneration(format!("Font load error: {e}")))
}

// ── Drawing helpers ─────────────────────────────────────────────────────────

fn rgb((r, g, b): (f32, f32, f32)) -> Color {
    Color::Rgb(Rgb::new(r, g, b, None))
}

fn stroke_line(
    layer: &PdfLayerReference,
    x1: f32,
    x2: f32,
    y: f32,
    thickness: f32,
    color: (f32, f32, f32),
) {
    layer.set_outline_color(rgb(color));
    layer.set_outline_thickness(thickness);
    let line = Line {
        points: vec![
            (Point::new(Mm(x1), Mm(y)), false),
            (Point::new(Mm(x2), Mm(y)), false),
        ],
        is_closed: false,
    };
    layer.add_line(line);
}

fn txt(
    layer: &PdfLayerReference,
    s: &str,
    x: f32,
    y: f32,
    size: f32,
    font: &IndirectFontRef,
    color: (f32, f32, f32),
) {
    layer.set_fill_color(rgb(color));
    layer.use_text(s, size, Mm(x), Mm(y), font);
}

fn txt_right(
    layer: &PdfLayerReference,
    s: &str,
    right_x: f32,
    y: f32,
    size: f32,
    font: &IndirectFontRef,
    color: (f32, f32, f32),
) {
    #[allow(clippy::cast_precision_loss)]
    let approx_w = s.len() as f32 * size * 0.20;
    txt(layer, s, right_x - approx_w, y, size, font, color);
}

fn txt_center(
    layer: &PdfLayerReference,
    s: &str,
    center_x: f32,
    y: f32,
    size: f32,
    font: &IndirectFontRef,
    color: (f32, f32, f32),
) {
    #[allow(clippy::cast_precision_loss)]
    let approx_w = s.len() as f32 * size * 0.20;
    txt(layer, s, center_x - approx_w / 2.0, y, size, font, color);
}

fn fmt_amount(d: f64) -> String {
    format!("{d:.2}")
}

fn fmt_date(dt: &NaiveDate) -> String {
    dt.format("%d/%m/%Y").to_string()
}

fn currency_sym(entry: &InvoiceData) -> &'static str {
    match entry.currency.as_str() {
        "USD" | "usd" => "$",
        "EUR" | "eur" => "\u{20ac}",
        _ => "\u{00a3}", // GBP pound sign
    }
}

fn english_month(month: u32) -> &'static str {
    match month {
        1 => "January",
        2 => "February",
        3 => "March",
        4 => "April",
        5 => "May",
        6 => "June",
        7 => "July",
        8 => "August",
        9 => "September",
        10 => "October",
        11 => "November",
        12 => "December",
        _ => "\u{2014}",
    }
}

fn truncate_to_width(s: &str, max_mm: f32, font_size: f32) -> String {
    let char_w = font_size * 0.20;
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    let max_chars = (max_mm / char_w) as usize;
    if s.len() <= max_chars {
        return s.to_string();
    }
    if max_chars <= 3 {
        return s.chars().take(max_chars).collect();
    }
    let truncated: String = s.chars().take(max_chars - 3).collect();
    format!("{truncated}...")
}

fn txt_amount_right(
    layer: &PdfLayerReference,
    number: &str,
    sym: &str,
    right_x: f32,
    y: f32,
    size: f32,
    font: &IndirectFontRef,
    color: (f32, f32, f32),
) {
    let sym_x = right_x - size * 0.30;
    txt(layer, sym, sym_x, y, size, font, color);
    let num_right = sym_x - size * 0.08;
    txt_right(layer, number, num_right, y, size, font, color);
}

// ── Section renderers ───────────────────────────────────────────────────────

fn draw_header(
    layer: &PdfLayerReference,
    fonts: &Fonts<'_>,
    top: f32,
) -> f32 {
    let mut y = top;

    txt(layer, "PROPERTY MANAGEMENT", ML, y - 6.0, 16.0, fonts.extrabold, ACCENT);
    y -= 14.0;

    // Accent line above title
    stroke_line(layer, ML, PAGE_W - MR, y, 0.5, ACCENT);
    y -= 10.0;

    // Title: RENTAL INVOICE
    txt_center(
        layer,
        "RENTAL INVOICE",
        PAGE_W / 2.0,
        y,
        18.0,
        fonts.extrabold,
        DARK,
    );
    y -= 6.0;

    // Accent line below title
    stroke_line(layer, ML, PAGE_W - MR, y, 0.5, ACCENT);
    y -= 10.0;

    y
}

fn draw_invoice_details(
    layer: &PdfLayerReference,
    fonts: &Fonts<'_>,
    entry: &InvoiceData,
    top: f32,
) -> f32 {
    let cx = PAGE_W / 2.0;
    let mut y = top;

    // Section header
    txt_center(layer, "INVOICE DETAILS", cx, y, 9.0, fonts.bold, MID);
    y -= 8.0;

    let label_x = cx - 35.0;
    let value_x = cx + 5.0;
    let row_h = 5.5;

    // Reference
    txt(layer, "Reference", label_x, y, 9.0, fonts.medium, MID);
    txt(layer, &entry.reference, value_x, y, 9.0, fonts.bold, DARK);
    y -= row_h;

    // Invoice date
    if let Some(ref date) = entry.invoice_date {
        txt(layer, "Invoice date", label_x, y, 9.0, fonts.medium, MID);
        txt(layer, &fmt_date(date), value_x, y, 9.0, fonts.bold, DARK);
        y -= row_h;

        // Billing period
        let period = format!(
            "{} {}",
            english_month(date.month()),
            date.year()
        );
        txt(layer, "Billing period", label_x, y, 9.0, fonts.medium, MID);
        txt(layer, &period, value_x, y, 9.0, fonts.bold, DARK);
        y -= row_h;
    }

    // Payment method
    txt(layer, "Payment method", label_x, y, 9.0, fonts.medium, MID);
    txt(layer, "Bank transfer", value_x, y, 9.0, fonts.bold, DARK);
    y -= 10.0;

    y
}

fn draw_parties(
    layer: &PdfLayerReference,
    fonts: &Fonts<'_>,
    entry: &InvoiceData,
    enrichment: &InvoiceEnrichment,
    top: f32,
) -> f32 {
    let lx = ML;
    let rx = ML + CONTENT_W / 2.0 + 5.0;
    let left_max_w = CONTENT_W / 2.0 - 2.0;
    let right_max_w = PAGE_W - MR - rx;

    // Left: LANDLORD DETAILS (payee = landlord/property owner)
    let mut yl = top;
    txt(layer, "LANDLORD DETAILS", lx, yl, 8.0, fonts.bold, LIGHT);
    yl -= 6.0;

    txt(layer, &entry.payee, lx, yl, 12.0, fonts.bold, DARK);
    yl -= 5.5;

    if let Some(ref tax_id) = enrichment.payee_tax_id {
        if !tax_id.is_empty() {
            txt(layer, &format!("Tax ID: {tax_id}"), lx, yl, 9.0, fonts.regular, MID);
            yl -= 4.5;
        }
    }
    if let Some(ref dir) = enrichment.payee_address {
        if !dir.is_empty() {
            let dir_t = truncate_to_width(dir, left_max_w, 9.0);
            txt(layer, &dir_t, lx, yl, 9.0, fonts.regular, MID);
            yl -= 4.5;
        }
    }

    // Right: TENANT DETAILS (payer = tenant)
    let mut yr = top;
    txt(layer, "TENANT DETAILS", rx, yr, 8.0, fonts.bold, LIGHT);
    yr -= 6.0;

    txt(layer, &entry.payer, rx, yr, 12.0, fonts.bold, DARK);
    yr -= 5.5;

    if let Some(ref tax_id) = enrichment.payer_tax_id {
        if !tax_id.is_empty() {
            txt(layer, &format!("Tax ID: {tax_id}"), rx, yr, 9.0, fonts.regular, MID);
            yr -= 4.5;
        }
    }
    if let Some(ref dir) = enrichment.property_address {
        if !dir.is_empty() {
            let dir_t = truncate_to_width(dir, right_max_w, 9.0);
            txt(layer, &dir_t, rx, yr, 9.0, fonts.regular, MID);
            yr -= 4.5;
        }
    }

    yl.min(yr) - 10.0
}

fn draw_line_items_header(
    layer: &PdfLayerReference,
    fonts: &Fonts<'_>,
    top: f32,
) -> f32 {
    let cx = PAGE_W / 2.0;
    let mut y = top;

    txt_center(layer, "INVOICE BREAKDOWN", cx, y, 10.0, fonts.bold, DARK);
    y -= 3.0;

    let line_half = 30.0;
    stroke_line(layer, cx - line_half, cx + line_half, y, 0.5, ACCENT);
    y -= 8.0;

    y
}

fn draw_line_items(
    layer: &PdfLayerReference,
    fonts: &Fonts<'_>,
    entry: &InvoiceData,
    top: f32,
) -> f32 {
    let sym = currency_sym(entry);
    let base = entry.amount - entry.vat;
    let right_x = PAGE_W - MR;

    let mut y = top;

    // Column headers
    txt(layer, "Description", ML, y, 9.0, fonts.medium, MID);
    txt_right(layer, &format!("Amount ({sym})"), right_x, y, 9.0, fonts.medium, MID);
    y -= 2.5;

    stroke_line(layer, ML, PAGE_W - MR, y, 0.2, DARK);
    y -= 6.0;

    // Data row
    let description_display = truncate_to_width(&entry.description, CONTENT_W - 30.0, 10.0);
    txt(layer, &description_display, ML, y, 10.0, fonts.medium, DARK);
    txt_amount_right(layer, &fmt_amount(base), sym, right_x, y, 10.0, fonts.medium, DARK);
    y -= 10.0;

    y
}

fn draw_totals(
    layer: &PdfLayerReference,
    fonts: &Fonts<'_>,
    entry: &InvoiceData,
    top: f32,
) -> f32 {
    let sym = currency_sym(entry);
    let base = entry.amount - entry.vat;

    let label_x = ML;
    let right_x = PAGE_W - MR;
    let mut y = top;

    // Subtotal
    txt(layer, "Subtotal", label_x, y, 10.0, fonts.medium, MID);
    txt_amount_right(layer, &fmt_amount(base), sym, right_x, y, 10.0, fonts.medium, DARK);
    y -= 6.5;

    // VAT
    txt(layer, "VAT", label_x, y, 10.0, fonts.medium, MID);
    txt_amount_right(layer, &fmt_amount(entry.vat), sym, right_x, y, 10.0, fonts.medium, DARK);
    y -= 3.0;

    // Separator line
    stroke_line(layer, label_x, right_x, y, 0.15, BORDER);
    y -= 5.0;

    // Thin separator above total
    stroke_line(layer, label_x, right_x, y, 0.3, ACCENT);
    y -= 8.0;

    // Total due
    txt(layer, "Total due", label_x, y, 13.0, fonts.extrabold, DARK);
    txt_amount_right(layer, &fmt_amount(entry.amount), sym, right_x, y, 13.0, fonts.extrabold, DARK);

    y - 14.0
}

fn draw_footer(
    layer: &PdfLayerReference,
    fonts: &Fonts<'_>,
    _entry: &InvoiceData,
    _top: f32,
) {
    let y = 25.0;

    txt(
        layer,
        "This document serves as a valid receipt for rental payment.",
        ML,
        y,
        8.0,
        fonts.regular,
        LIGHT,
    );
}
