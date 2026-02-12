use axum::http::header::SET_COOKIE;
use axum::http::HeaderMap;
use axum::Json;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct SetSessionRequest {
    pub access_token: String,
    pub expires_in: Option<i64>,
}

pub async fn set_session(
    Json(body): Json<SetSessionRequest>,
) -> (HeaderMap, Json<serde_json::Value>) {
    let max_age = body.expires_in.unwrap_or(3600);
    let cookie = format!(
        "access_token={}; Path=/; SameSite=Lax; Max-Age={}",
        body.access_token, max_age
    );

    let mut headers = HeaderMap::new();
    if let Ok(val) = cookie.parse() {
        headers.insert(SET_COOKIE, val);
    }

    (headers, Json(serde_json::json!({ "ok": true })))
}

pub async fn clear_session() -> (HeaderMap, Json<serde_json::Value>) {
    let cookie = "access_token=; Path=/; SameSite=Lax; Max-Age=0";

    let mut headers = HeaderMap::new();
    if let Ok(val) = cookie.parse() {
        headers.insert(SET_COOKIE, val);
    }

    (headers, Json(serde_json::json!({ "ok": true })))
}
