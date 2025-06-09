document.addEventListener('DOMContentLoaded', () => {
    // Page view container
    const pageView = document.getElementById('page-view');

    // Templates
    const listingPageTemplate = document.getElementById('listing-page-template');
    const cartPageTemplate = document.getElementById('cart-page-template');

    // Navigation elements
    const navHome = document.getElementById('nav-home');
    const navCart = document.getElementById('nav-cart');

    // Cart item count badges (will be accessed after templates are cloned)
    let cartItemCountBadgeNav; // cartItemCountBadgeHeader removed

    let productCatalog = [];
    let shoppingCart = []; // Structure: { id, name, make, description, category, price, imageUrl, quantity }
    let currentView = 'listing'; // 'listing' or 'cart'
    let fetchErrored = false; // Flag to track if product loading failed

    // --- 1. LOAD PRODUCT CATALOG (CALLED ONCE ON STARTUP) ---
    async function loadProductCatalogAndUpdateView() {
        fetchErrored = false; // Reset error state
        try {
            const response = await fetch('products.json');
            if (!response.ok) {
                fetchErrored = true;
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            productCatalog = await response.json();
            console.log('Product catalog successfully loaded. Number of products:', productCatalog.length, productCatalog); // Enhanced log
        } catch (error) {
            console.error('Failed to load product catalog:', error);
            fetchErrored = true;
            productCatalog = []; // Ensure catalog is empty on error
        }

        // After fetch attempt (success or fail), update the product grid if we're on the listing page
        if (currentView === 'listing') {
            const productGrid = pageView.querySelector('#product-grid');
            const productListTitle = pageView.querySelector('#product-list-title');
            const noProductsMessage = pageView.querySelector('#no-products-message');
            const searchBar = pageView.querySelector('#search-bar');

            if (productGrid && productListTitle && noProductsMessage) { // Ensure elements are there
                if (fetchErrored) {
                    productListTitle.textContent = 'Error';
                    renderProductGrid([], productGrid, noProductsMessage, "Could not load products. Please try again later.");
                } else {
                    // If there's an active search term from a previous state (unlikely on initial load here, but good for robustness)
                    if (searchBar && searchBar.value.length >= 2) {
                        searchBar.dispatchEvent(new Event('input'));
                    } else {
                        productListTitle.textContent = 'Recommended';
                        renderProductGrid(productCatalog.slice(0, 8), productGrid, noProductsMessage, "No products available at the moment.");
                    }
                }
            }
        }
    }

    // --- 2. PAGE NAVIGATION & RENDERING ---
    function clearPageView() {
        pageView.innerHTML = '';
    }

    function showListingPage() { // Parameter 'showRecommended' removed for simplification
        currentView = 'listing';
        clearPageView();
        const listingContent = listingPageTemplate.content.cloneNode(true);
        pageView.appendChild(listingContent);

        // Update nav active state
        navHome.classList.remove('text-neutral-500');
        navHome.classList.add('text-[#141414]');
        navCart.classList.remove('text-[#141414]');
        navCart.classList.add('text-neutral-500');

        const searchBar = pageView.querySelector('#search-bar');
        const productGrid = pageView.querySelector('#product-grid');
        const productListTitle = pageView.querySelector('#product-list-title');
        const noProductsMessage = pageView.querySelector('#no-products-message');
        // headerCartButton and cartItemCountBadgeHeader removed

        if (!searchBar || !productGrid || !productListTitle || !noProductsMessage) { // headerCartButton removed from check
            console.error("Critical listing page elements not found after template clone!");
            pageView.innerHTML = "<p class='text-red-500 p-4 text-center'>Error: UI components failed to load. Please refresh.</p>";
            return;
        }

        searchBar.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            console.log('Search input event. Term:', searchTerm, 'Current productCatalog size:', productCatalog.length); // Log search term and catalog size

            if (fetchErrored) {
                productListTitle.textContent = 'Error';
                renderProductGrid([], productGrid, noProductsMessage, "Product catalog unavailable. Search disabled.");
                return;
            }

            if (searchTerm.length === 0) {
                productListTitle.textContent = 'Recommended';
                renderProductGrid(productCatalog.slice(0, 8), productGrid, noProductsMessage, "No products available at the moment.");
                return;
            }
            if (searchTerm.length < 2) {
                productGrid.innerHTML = ''; // Clear grid if search term is too short
                noProductsMessage.style.display = 'none';
                return;
            }

            const filteredProducts = productCatalog.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                (product.make && product.make.toLowerCase().includes(searchTerm)) ||
                (product.description && product.description.toLowerCase().includes(searchTerm))
            );
            console.log('Filtered products count:', filteredProducts.length); // Log filtered products count
            productListTitle.textContent = 'Search Results';
            renderProductGrid(filteredProducts, productGrid, noProductsMessage); // Uses default "No products found."
        });
        
        // headerCartButton.addEventListener('click', showCartPage); // Listener removed

        // Determine initial content for the product grid when showListingPage is called
        if (fetchErrored) { // If a previous fetch (or current if loadProductCatalogAndUpdateView already ran) failed
            productListTitle.textContent = 'Error';
            renderProductGrid([], productGrid, noProductsMessage, "Could not load products. Please try again later.");
        } else if (productCatalog.length > 0) { // Catalog is loaded and has items
            const currentSearchTerm = searchBar.value; // Preserve search if navigating back
            if (currentSearchTerm && currentSearchTerm.length >= 2) {
                 searchBar.dispatchEvent(new Event('input')); // Re-trigger search
            } else {
                productListTitle.textContent = 'Recommended';
                renderProductGrid(productCatalog.slice(0, 8), productGrid, noProductsMessage, "No products available at the moment.");
            }
        } else { // Catalog not yet loaded (productCatalog is empty, fetchErrored is false) or loaded but empty
            productListTitle.textContent = 'Recommended';
            renderProductGrid([], productGrid, noProductsMessage, "Loading products...");
        }
        updateCartBadges();
    }

    function renderProductGrid(productsToDisplay, gridElement, noProductsMessageElement, customNoProductsText = "No products found.") {
        console.log('Rendering product grid. Products to display:', productsToDisplay.length, productsToDisplay); // Log products being rendered
        gridElement.innerHTML = '';
        if (productsToDisplay.length === 0) {
            noProductsMessageElement.textContent = customNoProductsText;
            noProductsMessageElement.style.display = 'block';
            return;
        }
        noProductsMessageElement.style.display = 'none';

        productsToDisplay.forEach(product => {
            const itemContainer = document.createElement('div');
            itemContainer.className = 'flex items-center gap-3 p-3 border-b border-gray-200 product-item hover:bg-gray-50'; // List item style
            itemContainer.dataset.productId = product.id;

            // Image Thumbnail
            const imageDiv = document.createElement('div');
            imageDiv.className = 'w-16 h-16 bg-center bg-no-repeat bg-cover rounded-md bg-gray-100 shrink-0'; // Fixed size thumbnail
            imageDiv.style.backgroundImage = `url("${product.imageUrl || 'icons/icon-72x72.png'}")`; // Smaller fallback
            if (!product.imageUrl) {
                imageDiv.style.backgroundSize = 'contain';
            } else {
                imageDiv.style.backgroundSize = 'cover';
            }

            // Info Div (Name, Price) - takes remaining space
            const infoDiv = document.createElement('div');
            infoDiv.className = 'flex-grow min-w-0'; // min-w-0 for proper truncation
            const nameP = document.createElement('p');
            nameP.className = 'text-[#141414] text-base font-medium leading-normal product-name truncate';
            nameP.textContent = product.name;
            const priceP = document.createElement('p');
            priceP.className = 'text-neutral-500 text-sm font-normal leading-normal product-price';
            priceP.textContent = product.price || '$?.??';
            infoDiv.appendChild(nameP);
            infoDiv.appendChild(priceP);

            // Add to Cart Button - aligned to the right
            const addButton = document.createElement('button');
            addButton.className = 'add-to-cart-button bg-[#141414] hover:bg-neutral-700 text-white font-bold py-2 px-3 rounded text-sm shrink-0';
            addButton.textContent = 'Add'; // Shorter text for smaller button
            addButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering click on itemContainer if needed
                addProductToCart(product);
            });

            itemContainer.appendChild(imageDiv);
            itemContainer.appendChild(infoDiv);
            itemContainer.appendChild(addButton);
            gridElement.appendChild(itemContainer);
        });
    }

    function showCartPage() {
        currentView = 'cart';
        clearPageView();
        const cartContent = cartPageTemplate.content.cloneNode(true);
        pageView.appendChild(cartContent);

        // Update nav active state
        navCart.classList.remove('text-neutral-500');
        navCart.classList.add('text-[#141414]');
        navHome.classList.remove('text-[#141414]');
        navHome.classList.add('text-neutral-500');

        const backButton = pageView.querySelector('#back-to-listing-button');
        const cartItemsContainer = pageView.querySelector('#cart-items-container');
        const emptyCartMessage = pageView.querySelector('#empty-cart-message');
        const whatsappButton = pageView.querySelector('#whatsapp-button');

        backButton.addEventListener('click', () => showListingPage(false)); // show all products or last search
        whatsappButton.addEventListener('click', handleWhatsappShare);

        renderCartItems(cartItemsContainer, emptyCartMessage);
        updateCartBadges();
    }

    function renderCartItems(container, emptyMessageElement) {
        container.innerHTML = '';
        if (shoppingCart.length === 0) {
            emptyMessageElement.style.display = 'block';
            container.style.display = 'none'; // Hide container if empty
            return;
        }
        emptyMessageElement.style.display = 'none';
        container.style.display = 'block'; // Show container

        shoppingCart.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'flex items-center gap-4 bg-neutral-50 px-4 min-h-[72px] py-3 cart-item border-b border-gray-100';
            itemDiv.dataset.productId = item.id;

            const imgDiv = document.createElement('div');
            imgDiv.className = 'bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-14 product-image';
            imgDiv.style.backgroundImage = `url("${item.imageUrl || 'icons/icon-192x192.png'}")`;

            const descDiv = document.createElement('div');
            descDiv.className = 'flex-grow flex flex-col justify-center';
            const nameP = document.createElement('p');
            nameP.className = 'text-[#141414] text-base font-medium leading-normal line-clamp-1 product-name';
            nameP.textContent = item.name;
            const priceP = document.createElement('p');
            priceP.className = 'text-neutral-500 text-sm font-normal leading-normal line-clamp-2 product-price-info';
            priceP.textContent = `${item.price || '$?.??'}`; // Could add 'per unit' if available

            descDiv.appendChild(nameP);
            descDiv.appendChild(priceP);

            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'flex items-center gap-2';
            const minusBtn = document.createElement('button');
            minusBtn.className = 'quantity-change text-lg font-bold p-1 rounded-full hover:bg-gray-200 w-6 h-6 flex items-center justify-center';
            minusBtn.dataset.change = '-1';
            minusBtn.textContent = '-';
            const quantitySpan = document.createElement('span');
            quantitySpan.className = 'product-quantity text-base';
            quantitySpan.textContent = item.quantity;
            const plusBtn = document.createElement('button');
            plusBtn.className = 'quantity-change text-lg font-bold p-1 rounded-full hover:bg-gray-200 w-6 h-6 flex items-center justify-center';
            plusBtn.dataset.change = '1';
            plusBtn.textContent = '+';
            controlsDiv.appendChild(minusBtn);
            controlsDiv.appendChild(quantitySpan);
            controlsDiv.appendChild(plusBtn);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-item text-red-500 hover:text-red-700 ml-2';
            removeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path></svg>`;

            // Event listeners for cart item controls
            minusBtn.addEventListener('click', handleQuantityChange);
            plusBtn.addEventListener('click', handleQuantityChange);
            removeBtn.addEventListener('click', handleRemoveItem);

            itemDiv.appendChild(imgDiv);
            itemDiv.appendChild(descDiv);
            itemDiv.appendChild(controlsDiv);
            itemDiv.appendChild(removeBtn);
            container.appendChild(itemDiv);
        });
    }

    // --- 3. CART MANAGEMENT ---
    function addProductToCart(product) {
        const existingItem = shoppingCart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            shoppingCart.push({ ...product, quantity: 1 });
        }
        updateCartBadges();
        // Optionally, provide feedback like "Item added to cart"
        // If on cart page, re-render
        if (currentView === 'cart') {
            const cartItemsContainer = pageView.querySelector('#cart-items-container');
            const emptyCartMessage = pageView.querySelector('#empty-cart-message');
            if (cartItemsContainer && emptyCartMessage) {
                 renderCartItems(cartItemsContainer, emptyCartMessage);
            }
        }
        console.log('Cart:', shoppingCart);
    }

    function handleQuantityChange(event) {
        const productId = event.target.closest('.cart-item').dataset.productId;
        const change = parseInt(event.target.dataset.change, 10);
        const item = shoppingCart.find(p => p.id === productId);

        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                shoppingCart = shoppingCart.filter(p => p.id !== productId);
            }
        }
        // Re-render cart items if on cart page
        if (currentView === 'cart') {
            const cartItemsContainer = pageView.querySelector('#cart-items-container');
            const emptyCartMessage = pageView.querySelector('#empty-cart-message');
            renderCartItems(cartItemsContainer, emptyCartMessage);
        }
        updateCartBadges();
    }

    function handleRemoveItem(event) {
        const productId = event.target.closest('.cart-item').dataset.productId;
        shoppingCart = shoppingCart.filter(p => p.id !== productId);
        // Re-render cart items if on cart page
        if (currentView === 'cart') {
            const cartItemsContainer = pageView.querySelector('#cart-items-container');
            const emptyCartMessage = pageView.querySelector('#empty-cart-message');
            renderCartItems(cartItemsContainer, emptyCartMessage);
        }
        updateCartBadges();
    }

    function updateCartBadges() {
        const totalItems = shoppingCart.reduce((sum, item) => sum + item.quantity, 0);
        
        // Nav bar badge (always available in the main HTML)
        cartItemCountBadgeNav = document.getElementById('cart-item-count-badge'); // Re-fetch in case of template cloning
        if (cartItemCountBadgeNav) {
            if (totalItems > 0) {
                cartItemCountBadgeNav.textContent = totalItems;
                cartItemCountBadgeNav.style.display = 'flex';
            } else {
                cartItemCountBadgeNav.style.display = 'none';
            }
        }

        // Header badge logic removed as the header cart icon is no longer present.
    }

    // --- 4. WHATSAPP INTEGRATION ---
    function handleWhatsappShare() {
        if (shoppingCart.length === 0) {
            alert('Your shopping list is empty. Add some items first!');
            return;
        }

        let message = "Hello! I'd like to order the following items:\n\n";
        shoppingCart.forEach(item => {
            message += `- ${item.name} (Qty: ${item.quantity})\n`; // Updated format
        });
        message += "\nThank you!";

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }

    // --- 5. PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => console.log('ServiceWorker registration successful with scope: ', registration.scope))
                .catch(error => console.log('ServiceWorker registration failed: ', error));
        });
    }

    // --- INITIAL SETUP ---
    // 1. Render the initial page structure (listing page by default, shows "Loading...")
    showListingPage();

    // 2. Start loading the product catalog. This will update the view once done.
    loadProductCatalogAndUpdateView();

    // 3. Setup navigation listeners
    navHome.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentView !== 'listing') showListingPage(); // Will show current catalog or loading state
    });
    navCart.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentView !== 'cart') showCartPage();
    });
    // updateCartBadges() is called at the end of showListingPage/showCartPage
});