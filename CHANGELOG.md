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
- Visual indicator ("Added" button state) on product listings for items currently in the cart.
- Pagination for product listings and search results (8 items per page).

### Changed
- Product catalog (`products.json`) updated with image URLs and prices.
- Refactored JavaScript for new UI structure and page navigation.
- Styling primarily handled by Tailwind CSS; `style.css` cleared.
- App name updated to "Grocy" across relevant files.
- Service worker cache versioning implemented.
- Updated UI to a new, cleaner design based on user-provided mockups.
- Implemented a new color scheme (`#f8fcfa`, `#0c1c17`, `#46a080`) and fonts (`Plus Jakarta Sans`, `Noto Sans`).
- Redesigned product cards on the listing page.
- Redesigned the header and navigation components.
- Hid product images on the cart page for a cleaner look.
- Replaced the share icon with the classic WhatsApp icon on the share button.
- Added a separator line below the search bar on the cart page for UI consistency.

### Fixed
- CORS errors when running locally by recommending an HTTP server.
- Initial page load issues where search bar might not appear or data not loaded correctly.
- Alignment issues with header elements.
- JavaScript errors related to removed UI elements.
- Addressed "whitespace" issue for missing product images by adding background and adjusting `background-size` for fallback icons.
- Cart page not rendering due to a JavaScript error.

### Removed
- Redundant cart icon from the header of the product listing page.