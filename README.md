# Grocy - PWA Grocery List App

Grocy is a Progressive Web Application (PWA) designed to help users quickly create and share grocery shopping lists. It features a simple search interface, a dynamic shopping cart, and integration for sharing the list via WhatsApp.

## Features

*   **Product Search:** Search for products from a catalog (name, make, description).
*   **Dynamic Shopping List:** Add items to a cart, adjust quantities, and remove items.
*   **WhatsApp Integration:** Share the formatted shopping list directly to a WhatsApp chat.
*   **PWA Capabilities:**
    *   Installable on home screens.
    *   Offline support via Service Worker caching of app shell and product data.
    *   Responsive design for mobile devices.
*   **UI based on provided designs:** Utilizes Tailwind CSS for styling.

## Technologies Used

*   HTML5
*   CSS3 (Tailwind CSS)
*   JavaScript (ES6+)
*   Progressive Web App (PWA) concepts:
    *   Web App Manifest (`manifest.json`)
    *   Service Workers (`service-worker.js`)

## Getting Started

To run Grocy locally:

1.  **Clone the repository (or ensure you have the files):**
    ```bash
    # If you haven't cloned it yet from GitHub after pushing
    # git clone https://github.com/shinexavier/grocy.git
    # cd grocy
    ```

2.  **Serve the files using a local HTTP server.**
    PWAs require being served over HTTP/HTTPS for features like Service Workers to function correctly. Opening `index.html` directly via `file:///` will lead to CORS errors and other issues.

    *   **Using Python 3:**
        ```bash
        python3 -m http.server 8000
        ```
    *   **Using Python 2:**
        ```bash
        python -m SimpleHTTPServer 8000
        ```
    *   **Using Node.js (with `http-server`):**
        ```bash
        npx http-server -p 8000
        # Or if installed globally: http-server -p 8000
        ```
        (You can replace `8000` with any available port number.)

3.  **Open your browser** and navigate to `http://localhost:8000` (or the port you used).

## Project Structure

*   `index.html`: Main HTML file for the application.
*   `script.js`: Core JavaScript logic for search, cart, PWA features, and UI rendering.
*   `style.css`: Minimal CSS (styling primarily handled by Tailwind CSS via CDN).
*   `products.json`: Sample product catalog data.
*   `manifest.json`: Web App Manifest for PWA configuration.
*   `service-worker.js`: Service Worker script for offline caching.
*   `icons/`: Directory containing PWA icons and favicons.
*   `design/`: Directory containing original design mockups/HTML (for reference).

## Notes

*   The application uses placeholder images for products in `products.json`. These can be updated with actual image URLs.
*   The WhatsApp sharing feature opens a `wa.me` link with a pre-filled message. The user needs to have WhatsApp installed.