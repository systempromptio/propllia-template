use std::sync::Arc;

use systemprompt::database::Database;
use systemprompt::extension::prelude::*;
use systemprompt::extension::{AssetDefinition, AssetPaths};
use systemprompt::traits::Job;

pub const SCHEMA_ADMIN_TABLES: &str = include_str!("../schema/001_admin_tables.sql");
pub const SCHEMA_ADMIN_SEED: &str = include_str!("../schema/002_admin_seed.sql");

#[derive(Debug, Default, Clone)]
pub struct AdminExtension;

impl AdminExtension {
    pub const PREFIX: &'static str = "admin";

    #[must_use]
    pub const fn new() -> Self {
        Self
    }

    #[must_use]
    pub const fn base_path() -> &'static str {
        "/admin/api"
    }
}

impl Extension for AdminExtension {
    fn metadata(&self) -> ExtensionMetadata {
        ExtensionMetadata {
            id: "admin",
            name: "Admin - Property Management API",
            version: env!("CARGO_PKG_VERSION"),
        }
    }

    fn schemas(&self) -> Vec<SchemaDefinition> {
        vec![
            SchemaDefinition::inline("admin_tables", SCHEMA_ADMIN_TABLES),
            SchemaDefinition::inline("admin_seed", SCHEMA_ADMIN_SEED),
            SchemaDefinition::inline(
                "admin_oauth_client",
                r"
INSERT INTO oauth_clients (client_id, client_secret_hash, client_name, token_endpoint_auth_method, is_active)
VALUES ('property-admin', NULL, 'Property Management Admin', 'none', true)
ON CONFLICT (client_id) DO NOTHING;

INSERT INTO oauth_client_grant_types (client_id, grant_type)
VALUES ('property-admin', 'authorization_code')
ON CONFLICT (client_id, grant_type) DO NOTHING;

INSERT INTO oauth_client_grant_types (client_id, grant_type)
VALUES ('property-admin', 'refresh_token')
ON CONFLICT (client_id, grant_type) DO NOTHING;

INSERT INTO oauth_client_response_types (client_id, response_type)
VALUES ('property-admin', 'code')
ON CONFLICT (client_id, response_type) DO NOTHING;

INSERT INTO oauth_client_scopes (client_id, scope)
VALUES ('property-admin', 'admin')
ON CONFLICT (client_id, scope) DO NOTHING;
                ",
            ),
        ]
    }

    fn router(&self, ctx: &dyn ExtensionContext) -> Option<ExtensionRouter> {
        let db_handle = ctx.database();
        let db = db_handle.as_any().downcast_ref::<Database>()?;
        let pool = db.pool()?;

        let router = crate::api::router(pool);
        Some(ExtensionRouter::public(router, Self::base_path()))
    }

    fn site_auth(&self) -> Option<SiteAuthConfig> {
        Some(SiteAuthConfig {
            login_path: "/admin/login",
            protected_prefixes: &["/admin"],
            public_prefixes: &["/admin/login", "/admin/api/auth", "/admin/api"],
            required_scope: "admin",
        })
    }

    fn jobs(&self) -> Vec<Arc<dyn Job>> {
        vec![
            Arc::new(crate::jobs::DemoResetJob),
            Arc::new(crate::jobs::RegisterOAuthClientJob),
        ]
    }

    fn priority(&self) -> u32 {
        300
    }

    fn migration_weight(&self) -> u32 {
        300
    }

    fn config_prefix(&self) -> Option<&str> {
        Some(Self::PREFIX)
    }

    fn declares_assets(&self) -> bool {
        true
    }

    fn required_assets(
        &self,
        paths: &dyn AssetPaths,
    ) -> Vec<AssetDefinition> {
        vec![
            AssetDefinition::html(
                paths.storage_files().join("admin/login/index.html"),
                "admin/login/index.html",
            ),
        ]
    }
}

register_extension!(AdminExtension);
