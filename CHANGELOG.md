# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial PWA structure with HTML, CSS (Tailwind via CDN), and JavaScript.
- Product search functionality based on `products.json`.
- Dynamic shopping cart: add, update quantity, remove items.
- WhatsApp integration to share the shopping list.
- Web App Manifest (`manifest.json`) for PWA installability.
- Service Worker (`service-worker.js`) for basic offline caching of app shell and product data.
- Placeholder icons for PWA and favicon.
- UI updated to match provided designs from `design/` folder.
  - Two-page navigation (Listing/Search and Cart/Share).
  - Product display as a compact list with thumbnails.
  - Grocy logo and name in headers.
- `README.md` with project description and setup instructions.
- `CHANGELOG.md` to track project changes.

### Changed
- Product catalog (`products.json`) updated with image URLs and prices.
- Refactored JavaScript for new UI structure and page navigation.
- Styling primarily handled by Tailwind CSS; `style.css` cleared.
- App name updated to "Grocy" across relevant files.
- Service worker cache versioning implemented.

### Fixed
- CORS errors when running locally by recommending an HTTP server.
- Initial page load issues where search bar might not appear or data not loaded correctly.
- Alignment issues with header elements.
- JavaScript errors related to removed UI elements.
- Addressed "whitespace" issue for missing product images by adding background and adjusting `background-size` for fallback icons.

### Removed
- Redundant cart icon from the header of the product listing page.