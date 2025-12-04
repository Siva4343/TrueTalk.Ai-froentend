// src/services/productService.js

// IMPORTANT: Update this to match your backend URL
const API_BASE_URL = 'http://localhost:8000/api';

// Helper function to convert base64 to blob
const base64ToBlob = (base64Data) => {
  try {
    // Extract the base64 data without the prefix
    const base64Match = base64Data.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error('Invalid base64 image data');
    }
    
    const mimeType = base64Match[1];
    const base64String = base64Match[2];
    const byteCharacters = atob(base64String);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    return new Blob(byteArrays, { type: mimeType });
  } catch (error) {
    console.error('Error converting base64 to blob:', error);
    throw error;
  }
};

// Get all products
export const getAllProducts = async () => {
  try {
    console.log('🔄 Fetching products from backend...');
    const response = await fetch(`${API_BASE_URL}/products`, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Fetched ${data.length} products from backend`);
    return data;
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    // Return empty array if backend is not available
    return [];
  }
};

// Create new product
export const createProduct = async (productData) => {
  try {
    console.log('🔄 Creating product in backend...', {
      name: productData.name,
      price: productData.price,
      category: productData.category
    });

    const formData = new FormData();
    
    // Add all product fields
    formData.append('name', productData.name);
    formData.append('price', productData.price.toString());
    formData.append('category', productData.category);
    formData.append('description', productData.description);
    formData.append('stock', productData.stock.toString());
    formData.append('status', productData.status);
    
    // Add features if they exist
    if (productData.features && Array.isArray(productData.features)) {
      formData.append('features', JSON.stringify(productData.features));
    }
    
    // Handle image upload
    if (productData.image) {
      if (productData.image.startsWith('data:image')) {
        // Convert base64 to blob
        const blob = base64ToBlob(productData.image);
        formData.append('image', blob, 'product.jpg');
      } else {
        formData.append('image', productData.image);
      }
    }

    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      body: formData,
      // Note: Don't set Content-Type header for FormData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error response:', errorText);
      throw new Error(`Failed to create product: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Product created successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error creating product:', error);
    throw error;
  }
};

// Get product by ID
export const getProductById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    throw error;
  }
};

// Update product
export const updateProduct = async (id, productData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update product: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ Error updating product:', error);
    throw error;
  }
};

// Delete product
export const deleteProduct = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete product: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    throw error;
  }
};