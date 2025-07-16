document.addEventListener('DOMContentLoaded', () => {
    const productList = document.getElementById('product-list');
    const searchBar = document.getElementById('search-bar');
    const proceedToEditButton = document.getElementById('proceed-to-edit');
    let products = [];
    let selectedProducts = new Set();

    // Fetch product data
    fetch('thanal_products.json')
        .then(response => response.json())
        .then(data => {
            products = data;
            displayProducts(products);
        });

    // Display products
    function displayProducts(productsToDisplay) {
        productList.innerHTML = '';
        productsToDisplay.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.dataset.productId = product.id;
            productCard.innerHTML = `
                <img src="${product.imageUrl}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p>Category: ${product.category}</p>
                <p>Price: ₹${product.price}</p>
                <div class="variants">
                    ${product.variants.map(variant => `<span>${variant}</span>`).join('')}
                </div>
            `;
            if (selectedProducts.has(product.id)) {
                productCard.classList.add('selected');
            }
            productCard.addEventListener('click', () => toggleProductSelection(product.id, productCard));
            productList.appendChild(productCard);
        });
    }

    // Toggle product selection
    function toggleProductSelection(productId, card) {
        if (selectedProducts.has(productId)) {
            selectedProducts.delete(productId);
            card.classList.remove('selected');
        } else {
            selectedProducts.add(productId);
            card.classList.add('selected');
        }
    }

    // Search functionality
    searchBar.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredProducts = products.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
        displayProducts(filteredProducts);
    });

    // Proceed to edit
    proceedToEditButton.addEventListener('click', () => {
        if (selectedProducts.size > 0) {
            localStorage.setItem('productsToEdit', JSON.stringify(Array.from(selectedProducts)));
            window.location.href = 'edit.html';
        } else {
            alert('Please select at least one product to edit.');
        }
    });
});