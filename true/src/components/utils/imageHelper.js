/**
 * Get fallback image URL
 * @returns {string} Fallback image URL
 */
export const getFallbackImage = () => {
  return 'https://via.placeholder.com/300x200/CCCCCC/969696?text=No+Image';
};

/**
 * Get image URL - handles different types of image paths
 * @param {string} path - Image path
 * @returns {string} Full image URL
 */
export const getImageUrl = (path) => {
  if (!path || typeof path !== 'string' || path.trim() === '') {
    return getFallbackImage();
  }
  
  const trimmedPath = path.trim();
  
  // If it's already a full URL, return as is
  if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
    return trimmedPath;
  }
  
  // If it's a data URL (base64 image)
  if (trimmedPath.startsWith('data:')) {
    return trimmedPath;
  }
  
  // If it starts with /uploads/, it's from the backend
  if (trimmedPath.startsWith('/uploads/')) {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    return `${API_BASE_URL}${trimmedPath}`;
  }
  
  // For relative paths in public folder
  if (trimmedPath.startsWith('/')) {
    return trimmedPath;
  }
  
  // Return as-is (could be a relative path or filename)
  return trimmedPath;
};

/**
 * Get product image URL with proper formatting
 * @param {string} imageName - Product image name or path
 * @returns {string} Product image URL
 */
export const getProductImageUrl = (imageName) => {
  if (!imageName || typeof imageName !== 'string' || imageName.trim() === '') {
    return getFallbackImage();
  }
  
  const trimmedImageName = imageName.trim();
  
  // If imageName is already a URL
  if (trimmedImageName.includes('://') || trimmedImageName.startsWith('data:')) {
    return trimmedImageName;
  }
  
  // If it starts with /uploads/, use getImageUrl
  if (trimmedImageName.startsWith('/uploads/')) {
    return getImageUrl(trimmedImageName);
  }
  
  // If it's just a filename, construct URL for product images
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  return `${API_BASE_URL}/uploads/products/${trimmedImageName}`;
};

/**
 * Get avatar image URL
 * @param {string} avatarPath - Avatar image path
 * @returns {string} Avatar image URL
 */
export const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) {
    return getFallbackImage();
  }
  
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  
  if (avatarPath.startsWith('/uploads/avatars/')) {
    return `${API_BASE_URL}${avatarPath}`;
  }
  
  if (avatarPath.includes('/')) {
    return getImageUrl(avatarPath);
  }
  
  return `${API_BASE_URL}/uploads/avatars/${avatarPath}`;
};