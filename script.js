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
    let cartItemCountBadgeNav, cartItemCountBadgeHeader;

    let productCatalog = [];
    let shoppingCart = []; // Structure: { id, name, make, description, category, price, imageUrl, quantity }
    let currentView = 'listing'; // 'listing' or 'cart'
    let fetchErrored = false; // Flag to track if product loading failed
    let currentActiveProductList = [];
    let currentCategory = 'All'; // To track the currently selected category
    
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

    function updateDisplayedProducts() {
       const productGrid = pageView.querySelector('#product-grid');
       const noProductsMessage = pageView.querySelector('#no-products-message');

       if (!productGrid || !noProductsMessage) {
           console.error("Product display elements not found!");
           return;
       }

       renderProductGrid(currentActiveProductList, productGrid, noProductsMessage);
   }


    function showListingPage() {
        currentView = 'listing';
        clearPageView();
        const listingContent = listingPageTemplate.content.cloneNode(true);
        pageView.appendChild(listingContent);

       navHome.classList.remove('text-[#46a080]');
       navHome.classList.add('text-[#0c1c17]');
       navCart.classList.remove('text-[#0c1c17]');
       navCart.classList.add('text-[#46a080]');

       const searchBar = pageView.querySelector('#search-bar');
       const categoryFiltersContainer = pageView.querySelector('#category-filters');
       const headerCartButton = pageView.querySelector('#nav-cart-button-header');

       if (!searchBar || !categoryFiltersContainer || !headerCartButton) {
           console.error("Critical listing page elements not found!");
           pageView.innerHTML = "<p class='text-red-500 p-4 text-center'>Error: UI components failed to load. Please refresh.</p>";
           return;
       }

       renderCategoryFilters(categoryFiltersContainer);

       searchBar.addEventListener('input', (e) => {
           const searchTerm = e.target.value.toLowerCase().trim();
           filterAndDisplayProducts(searchTerm, currentCategory);
       });

       headerCartButton.addEventListener('click', () => showCartPage());

       // Initial display logic
       const currentSearchTerm = searchBar.value.toLowerCase().trim();
       filterAndDisplayProducts(currentSearchTerm, currentCategory);
       updateDisplayedProducts();
        updateCartBadges();
    }

    function renderProductGrid(productsToDisplay, gridElement, noProductsMessageElement) {
        gridElement.innerHTML = '';
        if (productsToDisplay.length === 0) {
            noProductsMessageElement.textContent = "No products found.";
            noProductsMessageElement.style.display = 'block';
            return;
        }
        noProductsMessageElement.style.display = 'none';

        productsToDisplay.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'flex flex-col gap-3 pb-3 bg-white rounded-xl shadow-lg';

            const infoDiv = document.createElement('div');
            infoDiv.className = 'p-4 flex-grow';

            const nameMlP = document.createElement('p');
            nameMlP.className = 'text-[#0c1c17] text-base font-medium leading-normal';
            nameMlP.textContent = product.name_ml || product.name;
            infoDiv.appendChild(nameMlP);

            if (product.name_ml) {
                const nameEnP = document.createElement('p');
                nameEnP.className = 'text-[#46a080] text-sm font-normal leading-normal';
                nameEnP.textContent = product.name;
                infoDiv.appendChild(nameEnP);
            }
            
            productCard.appendChild(infoDiv);

            if (product.variants && product.variants.length > 0) {
                const variantContainer = document.createElement('div');
                variantContainer.className = 'flex flex-wrap gap-2 mt-auto px-4 pb-4';
                product.variants.forEach(variant => {
                    const variantButtonContainer = document.createElement('div');
                    variantButtonContainer.className = 'relative';

                    const variantButton = document.createElement('button');
                    variantButton.className = 'text-xs font-medium leading-normal px-3 py-1 rounded-full bg-[#e6f4ef] text-[#0c1c17] cursor-pointer';
                    variantButton.textContent = variant;
                    variantButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        addProductToCart(product, variant);
                    });

                    const cartId = `${product.id}-${variant}`;
                    const itemInCart = shoppingCart.find(item => item.cartId === cartId);
                    if (itemInCart) {
                        const quantityBadge = document.createElement('span');
                        quantityBadge.className = 'absolute -top-2 -right-2 bg-[#019863] text-white text-[10px] leading-none rounded-full h-4 w-4 flex items-center justify-center';
                        quantityBadge.textContent = itemInCart.quantity;
                        variantButtonContainer.appendChild(quantityBadge);
                    }
                    
                    variantButtonContainer.appendChild(variantButton);
                    variantContainer.appendChild(variantButtonContainer);
                });
                productCard.appendChild(variantContainer);
            } else {
                const addButtonContainer = document.createElement('div');
                addButtonContainer.className = 'relative px-4 pb-4 mt-auto';
                const addButton = document.createElement('button');
                addButton.className = 'text-sm font-bold leading-normal w-full mt-2 px-3 py-2 rounded-lg bg-[#019863] text-white cursor-pointer';
                addButton.textContent = 'Add to Cart';
                addButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    addProductToCart(product, null);
                });

                const cartId = product.id;
                const itemInCart = shoppingCart.find(item => item.cartId === cartId);
                if (itemInCart) {
                    const quantityBadge = document.createElement('span');
                    quantityBadge.className = 'absolute top-0 right-2 bg-[#019863] text-white text-[10px] leading-none rounded-full h-4 w-4 flex items-center justify-center';
                    quantityBadge.textContent = itemInCart.quantity;
                    addButtonContainer.appendChild(quantityBadge);
                }

                addButtonContainer.appendChild(addButton);
                productCard.appendChild(addButtonContainer);
            }

            gridElement.appendChild(productCard);
        });
    }

   function showCartPage() {
       currentView = 'cart';
       clearPageView();
       const cartContent = cartPageTemplate.content.cloneNode(true);
       pageView.appendChild(cartContent);

       // Update nav active state
       navCart.classList.remove('text-[#46a080]');
       navCart.classList.add('text-[#0c1c17]');
       navHome.classList.remove('text-[#0c1c17]');
       navHome.classList.add('text-[#46a080]');

       const backButton = pageView.querySelector('#back-to-listing-button');
       const cartItemsContainer = pageView.querySelector('#cart-items-container');
       const emptyCartMessage = pageView.querySelector('#empty-cart-message');
       const whatsappButton = pageView.querySelector('#whatsapp-button');
       const cartSearchBar = pageView.querySelector('#cart-search-bar');

       console.log('Shopping Cart:', shoppingCart);
       console.log('Cart Items Container:', cartItemsContainer);
       console.log('Empty Cart Message:', emptyCartMessage);


       backButton.addEventListener('click', () => showListingPage());
       whatsappButton.addEventListener('click', handleWhatsappShare);

       cartSearchBar.addEventListener('input', (e) => {
           const searchTerm = e.target.value.toLowerCase().trim();
           renderCartItems(cartItemsContainer, emptyCartMessage, searchTerm);
       });


       renderCartItems(cartItemsContainer, emptyCartMessage, '');
       updateCartBadges();
   }

   function renderCartItems(container, emptyMessageElement, searchTerm = '') {
       let filteredCart = shoppingCart;
       if (searchTerm) {
           filteredCart = shoppingCart.filter(item =>
               item.name.toLowerCase().includes(searchTerm) ||
               (item.name_ml && item.name_ml.toLowerCase().includes(searchTerm)) ||
               (item.make && item.make.toLowerCase().includes(searchTerm)) ||
               (item.description && item.description.toLowerCase().includes(searchTerm))
           );
       }
       console.log('Filtered Cart:', filteredCart);

        container.innerHTML = '';
        if (filteredCart.length === 0) {
            emptyMessageElement.textContent = searchTerm ? 'No items match your search.' : 'Your cart is empty. Add some items from the home page!';
            emptyMessageElement.style.display = 'block';
            container.style.display = 'none'; // Hide container if empty
            return;
        }
        emptyMessageElement.style.display = 'none';
        container.style.display = 'block'; // Show container

       filteredCart.forEach(item => {
           const itemDiv = document.createElement('div');
           itemDiv.className = 'flex gap-4 bg-[#f8fcfa] px-4 py-3 justify-between cart-item';
           itemDiv.dataset.cartId = item.cartId;

           const leftDiv = document.createElement('div');
           leftDiv.className = 'flex items-start gap-4';


           const infoDiv = document.createElement('div');
           infoDiv.className = 'flex flex-1 flex-col justify-center';
           const nameP = document.createElement('p');
           nameP.className = 'text-[#0c1c17] text-base font-medium leading-normal';
           nameP.textContent = item.name_ml || item.name;
           infoDiv.appendChild(nameP);

           if (item.variant) {
               const variantP = document.createElement('p');
               variantP.className = 'text-[#46a080] text-sm font-normal leading-normal';
               variantP.textContent = item.variant;
               infoDiv.appendChild(variantP);
           }
           leftDiv.appendChild(infoDiv);
           itemDiv.appendChild(leftDiv);

           const rightDiv = document.createElement('div');
           rightDiv.className = 'shrink-0';

           const controlsDiv = document.createElement('div');
           controlsDiv.className = 'flex items-center gap-2 text-[#0c1c17]';

           const minusBtn = document.createElement('button');
           minusBtn.className = 'text-base font-medium leading-normal flex h-7 w-7 items-center justify-center rounded-full bg-[#e6f4ef] cursor-pointer';
           minusBtn.textContent = '-';
           minusBtn.dataset.change = '-1';
           controlsDiv.appendChild(minusBtn);

           const quantityInput = document.createElement('input');
           quantityInput.className = 'text-base font-medium leading-normal w-4 p-0 text-center bg-transparent focus:outline-0 focus:ring-0 focus:border-none border-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';
           quantityInput.type = 'number';
           quantityInput.value = item.quantity;
           controlsDiv.appendChild(quantityInput);

           const plusBtn = document.createElement('button');
           plusBtn.className = 'text-base font-medium leading-normal flex h-7 w-7 items-center justify-center rounded-full bg-[#e6f4ef] cursor-pointer';
           plusBtn.textContent = '+';
           plusBtn.dataset.change = '1';
           controlsDiv.appendChild(plusBtn);
           rightDiv.appendChild(controlsDiv);
           itemDiv.appendChild(rightDiv);

           minusBtn.addEventListener('click', handleQuantityChange);
           plusBtn.addEventListener('click', handleQuantityChange);
           quantityInput.addEventListener('change', (e) => {
               const newQuantity = parseInt(e.target.value, 10);
               if (!isNaN(newQuantity) && newQuantity > 0) {
                   const item = shoppingCart.find(p => p.cartId === itemDiv.dataset.cartId);
                   if (item) {
                       item.quantity = newQuantity;
                       updateCartBadges();
                   }
               } else {
                   // If invalid input, remove item
                   shoppingCart = shoppingCart.filter(p => p.cartId !== itemDiv.dataset.cartId);
                   const searchTerm = pageView.querySelector('#cart-search-bar').value.toLowerCase().trim();
                   renderCartItems(container, emptyMessageElement, searchTerm);
                   updateCartBadges();
               }
           });

           container.appendChild(itemDiv);
       });
    }

    // --- 3. CART MANAGEMENT ---
    function addProductToCart(product, variant) {
        const cartId = variant ? `${product.id}-${variant}` : product.id;
        const existingItem = shoppingCart.find(item => item.cartId === cartId);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            shoppingCart.push({ ...product, quantity: 1, variant: variant, cartId: cartId });
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
        const cartId = event.target.closest('.cart-item').dataset.cartId;
        const change = parseInt(event.target.dataset.change, 10);
        const item = shoppingCart.find(p => p.cartId === cartId);

        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                shoppingCart = shoppingCart.filter(p => p.cartId !== cartId);
            }
        }
        // Re-render cart items if on cart page. If on listing page, re-render to update "Added" buttons.
        if (currentView === 'cart') {
            const cartItemsContainer = pageView.querySelector('#cart-items-container');
            const emptyCartMessage = pageView.querySelector('#empty-cart-message');
            const searchTerm = pageView.querySelector('#cart-search-bar').value.toLowerCase().trim();
            renderCartItems(cartItemsContainer, emptyCartMessage, searchTerm);
        } else if (currentView === 'listing') {
            showListingPage(); // Re-render listing page if an item might have been removed or added
        }
        updateCartBadges();
    }

    function handleRemoveItem(event) {
        const cartId = event.target.closest('.cart-item').dataset.cartId;
        shoppingCart = shoppingCart.filter(p => p.cartId !== cartId);
        // Re-render cart items if on cart page. If on listing page, re-render to update "Added" buttons.
        if (currentView === 'cart') {
            const cartItemsContainer = pageView.querySelector('#cart-items-container');
            const emptyCartMessage = pageView.querySelector('#empty-cart-message');
            const searchTerm = pageView.querySelector('#cart-search-bar').value.toLowerCase().trim();
            renderCartItems(cartItemsContainer, emptyCartMessage, searchTerm);
        } else if (currentView === 'listing') {
            showListingPage(); // Re-render listing page
        }
        updateCartBadges();
    }

    function updateCartBadges() {
        const totalItems = shoppingCart.reduce((sum, item) => sum + item.quantity, 0);
        
       cartItemCountBadgeNav = document.getElementById('cart-item-count-badge');
       cartItemCountBadgeHeader = document.getElementById('cart-item-count-badge-header');

       const badges = [cartItemCountBadgeNav, cartItemCountBadgeHeader];
       badges.forEach(badge => {
           if (badge) {
               if (totalItems > 0) {
                   badge.textContent = totalItems > 99 ? '99+' : totalItems;
                   badge.style.display = 'flex';
               } else {
                   badge.style.display = 'none';
               }
           }
       });
    }

    // --- 4. WHATSAPP INTEGRATION ---
    function handleWhatsappShare() {
        if (shoppingCart.length === 0) {
            alert('Your shopping list is empty. Add some items first!');
            return;
        }

        let message = "🚀 Hello! I'd like to order the following items:\n\n";
        shoppingCart.forEach((item, index) => {
            let nameText = item.name;
            if (item.name_ml) {
                nameText = `${item.name_ml} (${item.name})`;
            }
            
            let itemIdentifier = `${index + 1}. ${nameText}`;

            if (item.variant) {
                if (item.variant.toLowerCase() === '1 pc' || item.variant.toLowerCase() === '1 bunch') {
                    itemIdentifier += ` - ${item.quantity} ${item.variant.toLowerCase() === '1 pc' ? 'pieces' : 'bunches'}`;
                    message += `${itemIdentifier} ✅\n`;
                } else {
                    itemIdentifier += ` - ${item.variant}`;
                    message += `${itemIdentifier} (Qty: ${item.quantity}) ✅\n`;
                }
            } else {
                message += `${itemIdentifier} (Qty: ${item.quantity}) ✅\n`;
            }
        });
        message += "\nThank you!\n\n---\n🛍️ Created with GROCY App";

        console.log("Generated WhatsApp Message:\n", message);

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }

    // --- 5. CATEGORY FILTERING ---
    function renderCategoryFilters(container) {
        const categories = ['All', ...new Set(productCatalog.map(p => p.category).filter(Boolean))];
        container.innerHTML = '';

        categories.forEach(category => {
           const button = document.createElement('div');
           button.className = 'flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-xl bg-[#e6f4ef] pl-4 pr-4 cursor-pointer';
           const p = document.createElement('p');
           p.className = 'text-[#0c1c17] text-sm font-medium leading-normal';
           p.textContent = category;
           button.appendChild(p);
           button.dataset.category = category;

           if (category === currentCategory) {
               button.classList.remove('bg-[#e6f4ef]');
               button.classList.add('bg-[#019863]');
               p.classList.add('text-white');
           }

            button.addEventListener('click', () => {
                currentCategory = category;
                currentPage = 1;
                const searchTerm = pageView.querySelector('#search-bar').value.toLowerCase().trim();
                filterAndDisplayProducts(searchTerm, currentCategory);
                // Re-render buttons to update active state
                renderCategoryFilters(container);
            });

            container.appendChild(button);
        });
    }

    function filterAndDisplayProducts(searchTerm, category) {
       if (fetchErrored) {
           currentActiveProductList = [];
       } else {
           let filteredProducts = productCatalog;

           // Filter by category
           if (category !== 'All') {
               filteredProducts = filteredProducts.filter(product => product.category === category);
           }

            // Filter by search term
            if (searchTerm.length >= 2) {
                filteredProducts = filteredProducts.filter(product =>
                    product.name.toLowerCase().includes(searchTerm) ||
                    (product.name_ml && product.name_ml.toLowerCase().includes(searchTerm)) ||
                    (product.make && product.make.toLowerCase().includes(searchTerm)) ||
                    (product.description && product.description.toLowerCase().includes(searchTerm))
                );
            } else {
            }
            currentActiveProductList = filteredProducts;
        }
        updateDisplayedProducts();
    }

    // --- 6. PWA Service Worker Registration ---
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