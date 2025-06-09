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
    let currentPage = 1;
    const itemsPerPage = 8; // Number of items to display per page
    let currentActiveProductList = []; // Holds the full list being paginated (either all products or filtered results)
    
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

        // After fetch attempt (success or fail), update the listing page if it's the current view.
        if (currentView === 'listing') {
            showListingPage(); // This will now handle pagination correctly
        }
    }

    // --- 2. PAGE NAVIGATION & RENDERING ---
    function clearPageView() {
        pageView.innerHTML = '';
    }

    function updateDisplayedProductsAndPagination() {
        const productGrid = pageView.querySelector('#product-grid');
        const noProductsMessage = pageView.querySelector('#no-products-message');
        const productListTitle = pageView.querySelector('#product-list-title');
        const prevPageButton = pageView.querySelector('#prev-page-button');
        const nextPageButton = pageView.querySelector('#next-page-button');
        const pageInfo = pageView.querySelector('#page-info');
        const paginationControls = pageView.querySelector('#pagination-controls');

        if (!productGrid || !noProductsMessage || !prevPageButton || !nextPageButton || !pageInfo || !paginationControls || !productListTitle) {
            console.error("Pagination or product display elements not found!");
            return;
        }

        const totalItems = currentActiveProductList.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        // Ensure currentPage is within valid bounds
        if (currentPage < 1) currentPage = 1;
        if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
        if (totalPages === 0) currentPage = 1; // if no items, still page 1 of 0 or 1 of 1

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const productsToDisplayThisPage = currentActiveProductList.slice(startIndex, endIndex);

        renderProductGrid(productsToDisplayThisPage, productGrid, noProductsMessage, productListTitle.textContent === 'Search Results' ? "No products match your search." : "No products available at the moment.");
        
        pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
        prevPageButton.disabled = currentPage === 1;
        nextPageButton.disabled = currentPage === totalPages || totalPages === 0;

        if (totalPages <= 1) {
            paginationControls.style.display = 'none';
        } else {
            paginationControls.style.display = 'flex';
        }
    }


    function showListingPage() {
        currentView = 'listing';
        clearPageView();
        const listingContent = listingPageTemplate.content.cloneNode(true);
        pageView.appendChild(listingContent);

        navHome.classList.remove('text-neutral-500');
        navHome.classList.add('text-[#141414]');
        navCart.classList.remove('text-[#141414]');
        navCart.classList.add('text-neutral-500');

        const searchBar = pageView.querySelector('#search-bar');
        const productListTitle = pageView.querySelector('#product-list-title');
        const prevPageButton = pageView.querySelector('#prev-page-button');
        const nextPageButton = pageView.querySelector('#next-page-button');

        if (!searchBar || !productListTitle || !prevPageButton || !nextPageButton) {
            console.error("Critical listing page elements (search, title, pagination buttons) not found!");
            pageView.innerHTML = "<p class='text-red-500 p-4 text-center'>Error: UI components failed to load. Please refresh.</p>";
            return;
        }
        
        searchBar.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            currentPage = 1; // Reset to first page on new search

            if (fetchErrored) {
                productListTitle.textContent = 'Error';
                currentActiveProductList = [];
            } else if (searchTerm.length === 0) {
                productListTitle.textContent = 'Recommended';
                currentActiveProductList = productCatalog;
            } else if (searchTerm.length < 2) {
                productListTitle.textContent = 'Search Results'; // Or 'Type more to search'
                currentActiveProductList = []; // Clear list if search term too short, effectively showing no results via pagination
            } else {
                productListTitle.textContent = 'Search Results';
                currentActiveProductList = productCatalog.filter(product =>
                    product.name.toLowerCase().includes(searchTerm) ||
                    (product.make && product.make.toLowerCase().includes(searchTerm)) ||
                    (product.description && product.description.toLowerCase().includes(searchTerm))
                );
            }
            updateDisplayedProductsAndPagination();
        });

        prevPageButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                updateDisplayedProductsAndPagination();
            }
        });

        nextPageButton.addEventListener('click', () => {
            // Total pages needs to be calculated based on currentActiveProductList
            const totalPages = Math.ceil(currentActiveProductList.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                updateDisplayedProductsAndPagination();
            }
        });

        // Initial display logic
        const currentSearchTerm = searchBar.value.toLowerCase().trim();
        if (fetchErrored) {
            productListTitle.textContent = 'Error';
            currentActiveProductList = [];
        } else if (currentSearchTerm.length >= 2) { // If there was a search term (e.g. navigating back)
            productListTitle.textContent = 'Search Results';
             currentActiveProductList = productCatalog.filter(product =>
                product.name.toLowerCase().includes(currentSearchTerm) ||
                (product.make && product.make.toLowerCase().includes(currentSearchTerm)) ||
                (product.description && product.description.toLowerCase().includes(currentSearchTerm))
            );
        } else { // Default view (no search or short search term)
            productListTitle.textContent = 'Recommended';
            currentActiveProductList = productCatalog;
        }
        // currentPage should be preserved if navigating back, otherwise default to 1.
        // For simplicity now, let's assume it might have been set by a previous view or defaults to 1.
        // A more robust solution might store/restore currentPage with search term.
        updateDisplayedProductsAndPagination();
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
            priceP.textContent = `₹${product.price || '?.??'}`;
            infoDiv.appendChild(nameP);
            infoDiv.appendChild(priceP);

            // Add to Cart Button - aligned to the right
            const addButton = document.createElement('button');
            const isInCart = shoppingCart.some(item => item.id === product.id);

            if (isInCart) {
                addButton.className = 'add-to-cart-button bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-3 rounded text-sm shrink-0';
                addButton.textContent = 'Add'; // Changed from 'Added'
            } else {
                addButton.className = 'add-to-cart-button bg-[#141414] hover:bg-neutral-700 text-white font-bold py-2 px-3 rounded text-sm shrink-0';
                addButton.textContent = 'Add';
            }
            
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
            priceP.textContent = `₹${item.price || '?.??'}`; // Could add 'per unit' if available

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
        // If on cart page, re-render. If on listing page, re-render to update "Added" buttons.
        if (currentView === 'cart') {
            const cartItemsContainer = pageView.querySelector('#cart-items-container');
            const emptyCartMessage = pageView.querySelector('#empty-cart-message');
            if (cartItemsContainer && emptyCartMessage) {
                 renderCartItems(cartItemsContainer, emptyCartMessage);
            }
        } else if (currentView === 'listing') {
            showListingPage(); // Re-render listing page to update button states
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
        // Re-render cart items if on cart page. If on listing page, re-render to update "Added" buttons.
        if (currentView === 'cart') {
            const cartItemsContainer = pageView.querySelector('#cart-items-container');
            const emptyCartMessage = pageView.querySelector('#empty-cart-message');
            renderCartItems(cartItemsContainer, emptyCartMessage);
        } else if (currentView === 'listing') {
            showListingPage(); // Re-render listing page if an item might have been removed or added
        }
        updateCartBadges();
    }

    function handleRemoveItem(event) {
        const productId = event.target.closest('.cart-item').dataset.productId;
        shoppingCart = shoppingCart.filter(p => p.id !== productId);
        // Re-render cart items if on cart page. If on listing page, re-render to update "Added" buttons.
        if (currentView === 'cart') {
            const cartItemsContainer = pageView.querySelector('#cart-items-container');
            const emptyCartMessage = pageView.querySelector('#empty-cart-message');
            renderCartItems(cartItemsContainer, emptyCartMessage);
        } else if (currentView === 'listing') {
            showListingPage(); // Re-render listing page
        }
        updateCartBadges();
    }

    function updateCartBadges() {
        const totalItems = shoppingCart.reduce((sum, item) => sum + item.quantity, 0);
        
        // Nav bar badge (always available in the main HTML)
        cartItemCountBadgeNav = document.getElementById('cart-item-count-badge'); // Re-fetch in case of template cloning
        if (cartItemCountBadgeNav) {
            if (totalItems > 0) {
                cartItemCountBadgeNav.textContent = totalItems > 99 ? '99+' : totalItems;
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