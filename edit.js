document.addEventListener('DOMContentLoaded', () => {
    const editGridContainer = document.getElementById('edit-grid-container');
    const saveChangesButton = document.getElementById('save-changes');
    const exportJsonButton = document.getElementById('export-json');
    let productsToEdit = [];
    let allProducts = [];

    // Load all products and the selected products
    Promise.all([
        fetch('thanal_products.json').then(res => res.json()),
        Promise.resolve(JSON.parse(localStorage.getItem('productsToEdit') || '[]'))
    ]).then(([products, productsToEditIds]) => {
        allProducts = products;
        productsToEdit = allProducts.filter(p => productsToEditIds.includes(p.id));
        displayEditableGrid(productsToEdit);
    });

    // Display editable grid
    function displayEditableGrid(products) {
        const table = document.createElement('table');
        table.className = 'editable-grid';
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Variants</th>
                <th>Today's Special</th>
                <th>Disabled</th>
            </tr>
        `;
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        products.forEach(product => {
            const row = document.createElement('tr');
            row.dataset.productId = product.id;
            row.innerHTML = `
                <td><input type="text" value="${product.name}"></td>
                <td><input type="text" value="${product.description}"></td>
                <td><input type="text" value="${product.variants.join(', ')}"></td>
                <td><input type="checkbox" ${product.todaySpecial ? 'checked' : ''}></td>
                <td><input type="checkbox" ${product.disabled ? 'checked' : ''}></td>
            `;
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        editGridContainer.appendChild(table);
    }

    // Save changes
    saveChangesButton.addEventListener('click', () => {
        const rows = document.querySelectorAll('.editable-grid tbody tr');
        rows.forEach(row => {
            const productId = row.dataset.productId;
            const product = allProducts.find(p => p.id === productId);
            if (product) {
                product.name = row.cells[0].querySelector('input').value;
                product.description = row.cells[1].querySelector('input').value;
                product.variants = row.cells[2].querySelector('input').value.split(',').map(v => v.trim());
                product.todaySpecial = row.cells[3].querySelector('input').checked;
                product.disabled = row.cells[4].querySelector('input').checked;
            }
        });
        alert('Changes saved locally. Please export the file to make them permanent.');
    });

    // Export as JSON
    exportJsonButton.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allProducts, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "thanal_products_updated.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });
});