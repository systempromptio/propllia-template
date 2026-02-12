#![allow(clippy::missing_errors_doc)]
#![allow(clippy::missing_panics_doc)]
#![allow(clippy::must_use_candidate)]
#![allow(clippy::module_name_repetitions)]
#![allow(clippy::wildcard_imports)]
#![allow(clippy::uninlined_format_args)]

pub mod api;
pub mod error;
pub mod extension;
pub mod jobs;
pub mod services;

pub use extension::AdminExtension;
