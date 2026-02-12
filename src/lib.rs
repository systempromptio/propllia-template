//! `SystemPrompt` Template
//!
//! This crate re-exports extensions for use with the `SystemPrompt` runtime.
//! Extensions are automatically discovered via the `inventory` crate.

pub use systemprompt::cli;
pub use systemprompt::*;
pub use systemprompt_admin_extension as admin;
pub use systemprompt_web_extension as web;
