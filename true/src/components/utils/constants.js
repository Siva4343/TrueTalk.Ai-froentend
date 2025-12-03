// src/utils/constants.js

// API Configuration
// Hardcoded API base URL (remove process.env to fix ESLint error)
export const API_BASE = 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Authentication
  TOKEN: '/api/token/',
  TOKEN_REFRESH: '/api/token/refresh/',
  LOGIN: '/api/login/',
  LOGOUT: '/api/logout/',
  
  // Products
  PRODUCTS: '/api/products/',
  
  // Categories
  CATEGORIES: '/api/categories/',
  
  // Upload
  UPLOAD: '/api/upload/',
  
  // Cart
  CART: '/api/cart/',
  
  // Orders
  ORDERS: '/api/orders/',
  
  // Users
  USERS: '/api/users/',
  PROFILE: '/api/profile/',
};

// Product statuses
export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  DRAFT: 'draft',
  SOLD_OUT: 'sold_out',
  DISABLED: 'disabled',
};

// Product categories
export const PRODUCT_CATEGORIES = [
  'electronics',
  'clothing',
  'home & garden',
  'furniture',
  'books',
  'sports & outdoors',
  'toys & games',
  'health & beauty',
  'automotive',
  'groceries',
  'jewelry',
  'music',
  'movies & tv',
  'video games',
  'software',
  'office supplies',
  'industrial',
];

// Route paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  BUYER_DASHBOARD: '/buyer',
  SELLER_DASHBOARD: '/seller',
  ADD_PRODUCT: '/seller/add-product',
  MY_PRODUCTS: '/seller/products',
  CART: '/cart',
  ORDERS: '/orders',
  PRODUCT_DETAIL: '/product/:id',
  CHECKOUT: '/checkout',
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  CART: 'cart',
};