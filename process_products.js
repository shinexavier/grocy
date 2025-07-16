const fs = require('fs');
const path = require('path');

const stereotypes = JSON.parse(fs.readFileSync(path.join(__dirname, 'ref-data', 'product-stereotypes.json'), 'utf-8'));
const standardProducts = JSON.parse(fs.readFileSync(path.join(__dirname, 'products.json'), 'utf-8'));
const standardProductNames = new Set(standardProducts.map(p => p.name.toLowerCase()));

const allUnits = new Set();
for (const key in stereotypes) {
    stereotypes[key].mValues.forEach(unit => allUnits.add(unit.toLowerCase()));
}

const unitSynonyms = {
    'gm': 'g',
    'gram': 'g',
    'grams': 'g',
    'kg': 'kg',
    'kilogram': 'kg',
    'kilograms': 'kg',
    'ml': 'ml',
    'milliliter': 'ml',
    'milliliters': 'ml',
    'l': 'l',
    'liter': 'l',
    'liters': 'l',
    'pcs': 'piece',
    'pc': 'piece',
    'nos': 'piece',
    'pkt': 'packet'
};

function sanitizeVariant(variant) {
    const match = variant.match(/(\d+\.?\d*)\s*([a-zA-Z]+)/);
    if (match) {
        const value = match[1];
        let unit = match[2].toLowerCase();
        if (unitSynonyms[unit]) {
            unit = unitSynonyms[unit];
        }
        return `${value}${unit}`;
    }
    return variant;
}

function levenshtein(a, b) {
    const an = a ? a.length : 0;
    const bn = b ? b.length : 0;
    if (an === 0) {
        return bn;
    }
    if (bn === 0) {
        return an;
    }
    const matrix = new Array(bn + 1);
    for (let i = 0; i <= bn; ++i) {
        matrix[i] = new Array(an + 1);
    }
    for (let i = 0; i <= an; ++i) {
        matrix[0][i] = i;
    }
    for (let j = 0; j <= bn; ++j) {
        matrix[j][0] = j;
    }
    for (let j = 1; j <= bn; ++j) {
        for (let i = 1; i <= an; ++i) {
            const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,
                matrix[j - 1][i] + 1,
                matrix[j - 1][i - 1] + substitutionCost
            );
        }
    }
    return matrix[bn][an];
}

function findClosestMatch(name, standardNames) {
    let bestMatch = name;
    let minDistance = Infinity;

    for (const standardName of standardNames) {
        const distance = levenshtein(name.toLowerCase(), standardName);
        if (distance < minDistance) {
            minDistance = distance;
            bestMatch = standardName;
        }
    }
    // Only return a match if it's reasonably close
    if (minDistance <= 1) {
        return bestMatch.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    return name;
}


function sanitizeName(name, standardNames) {
    const cleanedName = name
        .trim()
        .replace(/\s+/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    
    return findClosestMatch(cleanedName, standardNames);
}


function parseProduct(line, standardNames) {
    line = line.trim().replace(/^[•*-]\s*/, '');

    let name = line;
    let name_ml = '';
    let price = null;
    let variant = '';
    let notes = '';

    if (name.endsWith('limited')) {
        notes = 'limited';
        name = name.replace(/limited$/, '').trim();
    }

    // Price
    const priceMatch = name.match(/(?:-?₹|₹\s*₹?)\s*(\d+\.?\d*)$/);
    if (priceMatch) {
        price = parseFloat(priceMatch[1]);
        name = name.replace(/(?:-?₹|₹\s*₹?)\s*(\d+\.?\d*)$/, '').trim();
    } else {
        const priceMatch2 = name.match(/(\d+\.?\d*)$/);
        if (priceMatch2) {
            const nameWithoutPrice = name.replace(/(\d+\.?\d*)$/, '').trim();
            if (nameWithoutPrice.endsWith('-') || nameWithoutPrice.endsWith(' ') || nameWithoutPrice.endsWith(')-')) {
                price = parseFloat(priceMatch2[1]);
                name = nameWithoutPrice.replace(/-$/, '').trim();
            }
        }
    }


    // Malayalam name
    const mlMatch = name.match(/\(([^)]+)\)/);
    if (mlMatch) {
        if (/[\u0D00-\u0D7F]/.test(mlMatch[1])) {
            name_ml = mlMatch[1].trim();
        }
        name = name.replace(/\(([^)]+)\)/g, '').trim();
    }
    
    // Variant / Quantity
    const variantRegex = /(\d+(\.\d+)?\s*(kg|g|ml|gm|pkt|pcs|pc|loaf|slices|L|roll|packet|pair|box|ream|bunch))/i;
    const variantMatch = name.match(variantRegex);
     if (variantMatch) {
        variant = variantMatch[0].trim();
        name = name.replace(variantRegex, '').trim();
    }
    
    name = name.replace(/-$/, '').trim();
    name = name.replace(/[()]/g, '').trim(); // Remove any remaining parentheses

    if (!name) {
        return null;
    }

    return { name: sanitizeName(name, standardNames), name_ml, price, variant, notes };
}


// Main function to process the file
const processFile = (filePath) => {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n');
  const products = [];
  let currentCategory = 'Uncategorized';
  let currentVariant = '';

  const categoryKeywords = {
      'Vegetables': ['Vegetables', 'Vegetables🥒🌶'],
      'Fruits': ['Fruits', 'Fruits 🥭🍉'],
      'Rice and Rice products': ['Rice and Rice products'],
      'Wheat and Wheat Products': ['Wheat and Wheat Products'],
      'Sweeteners': ['Sweeteners'],
      'Spices': ['Spices'],
      'Pulses and Lentils': ['Pulses and Lentils'],
      'Seeds and Millets': ['Seeds and Millets'],
      'Dry Fruits and Nuts': ['Dry Fruits and Nuts'],
      'Oils': ['Oils'],
      'Snacks and Miscellaneous': ['Snacks and Miscellaneous', 'Other Products'],
      'Beverages': ['Beverages'],
      'Personal care': ['Personal care'],
      'Soaps': ['Soaps'],
      'Salt': ['Salt'],
  };

  const findCategory = (line) => {
      for (const category in categoryKeywords) {
          for (const keyword of categoryKeywords[category]) {
              if (line.toLowerCase().startsWith(keyword.toLowerCase())) {
                  return category;
              }
          }
      }
      return null;
  }

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.length === 0 || trimmedLine.startsWith('Now available')) {
      continue;
    }

    if (trimmedLine.startsWith('***')) {
        currentVariant = ''; // Reset context
        continue;
    }

    if (trimmedLine.startsWith('Items - price/')) {
        const variantMatch = trimmedLine.match(/price\/(.*)/);
        if (variantMatch) {
            currentVariant = variantMatch[1];
        }
        continue;
    }

    const category = findCategory(trimmedLine);
    if (category) {
        currentCategory = category;
        continue;
    }

    const productInfo = parseProduct(trimmedLine, standardProductNames);
    if (productInfo && productInfo.name && productInfo.price !== null) {
      let variants = productInfo.variant ? [sanitizeVariant(productInfo.variant)] : [];
      if (variants.length === 0 && currentVariant) {
          variants.push(sanitizeVariant(currentVariant));
      }
      products.push({
        name: productInfo.name,
        name_ml: productInfo.name_ml,
        price: productInfo.price,
        category: currentCategory,
        make: 'Generic',
        description: productInfo.name,
        variants: variants,
        imageUrl: 'images/placeholder.jpg',
        notes: productInfo.notes,
        enabled: true,
        tags: []
      });
    }
  }

  return products;
};

// De-duplicate products based on name and category, and merge variants
const deduplicateAndMergeProducts = (products) => {
  const productMap = new Map();
  for (const product of products) {
    const key = `${product.name.toLowerCase().trim()}-${product.category}`;
    if (productMap.has(key)) {
        const existingProduct = productMap.get(key);
        if (product.variants.length > 0 && !existingProduct.variants.includes(product.variants[0])) {
            existingProduct.variants.push(product.variants[0]);
        }
    } else {
      productMap.set(key, product);
    }
  }
  return Array.from(productMap.values());
};

// File paths
const inputFilePath = path.join(__dirname, 'ref-data', 'set1.txt');
const outputFilePath = path.join(__dirname, 'thanal_products.json');

// Process the file and generate the output
try {
  const rawProducts = processFile(inputFilePath);
  const uniqueProducts = deduplicateAndMergeProducts(rawProducts);
  
  // Add id to each product
  let id = 1;
  const finalProducts = uniqueProducts.map(p => ({ id: (id++).toString(), ...p }));

  fs.writeFileSync(outputFilePath, JSON.stringify(finalProducts, null, 2));
  console.log('Product catalog generated successfully!');
} catch (error) {
  console.error('Error processing file:', error);
}