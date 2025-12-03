import React from "react";
import { Link } from "react-router-dom";
import { getImageUrl, getFallbackImage } from "../../utils/imageHelper";
import { parseCurrency } from "../../utils/currencyParser";

const ProductList = ({ 
  products, 
  onToggleWishlist, 
  onAddToCart, 
  wishlist = [], 
  cart = [],
  showSeller = true 
}) => {
  // Mock seller data for ProductList component
  const mockSellers = [
    { id: 1, name: "Tech World", shop_name: "Tech World Electronics", rating: 4.5 },
    { id: 2, name: "Fashion Hub", shop_name: "Fashion Hub Store", rating: 4.2 },
    { id: 3, name: "Home Essentials", shop_name: "Home Essentials", rating: 4.7 },
    { id: 4, name: "Book Paradise", shop_name: "Book Paradise", rating: 4.8 },
    { id: 5, name: "Sports Gear", shop_name: "Sports Gear Pro", rating: 4.3 },
    { id: 6, name: "Toy Land", shop_name: "Toy Land Store", rating: 4.6 },
  ];

  // Get seller for a product
  const getProductSeller = (product) => {
    if (product.seller && product.seller.id) {
      return product.seller;
    }
    // If no seller in API response, use mock data
    const sellerIndex = product.id ? product.id % mockSellers.length : 0;
    return mockSellers[sellerIndex];
  };

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <svg 
          className="mx-auto h-12 w-12 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
        <p className="mt-1 text-sm text-gray-500">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => {
        const imageUrl = getImageUrl(product.image);
        const price = parseCurrency(product.price);
        const stock = parseFloat(product.stock) || 0;
        const isInWishlist = wishlist.includes(product.id);
        const isInCart = cart.includes(product.id);
        const isLowStock = stock <= 5;
        const isActive = product.status === "active";
        const seller = getProductSeller(product);

        if (!isActive) return null;

        return (
          <div
            key={product.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            <div className="relative">
              <img
                className="w-full h-48 object-cover"
                src={imageUrl || getFallbackImage()}
                alt={product.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = getFallbackImage();
                }}
              />
              
              {onToggleWishlist && (
                <button
                  onClick={() => onToggleWishlist(product.id)}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors"
                >
                  {isInWishlist ? "❤️" : "🤍"}
                </button>
              )}
              
              {isLowStock && (
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    Only {stock} left!
                  </span>
                </div>
              )}
              
              {seller.rating > 4 && (
                <div className="absolute bottom-2 left-2">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    ⭐ {seller.rating}
                  </span>
                </div>
              )}
            </div>

            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold truncate">{product.name}</h3>
                <div className="text-right">
                  <div className="text-blue-600 font-bold text-xl">${price.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">per unit</div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {product.description}
              </p>

              <div className="flex justify-between text-sm text-gray-500 mb-4">
                <span>{product.category || "Uncategorized"}</span>
                <span className={isLowStock ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                  {stock > 0 ? `${stock} in stock` : "Out of stock"}
                </span>
              </div>

              {showSeller && (
                <div className="mb-4 p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-medium">
                          {seller.name ? seller.name.charAt(0).toUpperCase() : "S"}
                        </span>
                      </div>
                    </div>
                    <div className="ml-2">
                      <p className="text-xs font-medium text-gray-900">
                        {seller.shop_name || seller.name || "Unknown Seller"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Link
                  to={`/product/${product.id}`}
                  className="flex-1 px-3 py-2 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-center"
                >
                  View Details
                </Link>
                
                {onAddToCart && (
                  <button
                    onClick={() => onAddToCart(product.id)}
                    disabled={isInCart || stock === 0}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                      isInCart
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : stock === 0
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isInCart ? "In Cart" : stock === 0 ? "Out of Stock" : "Add to Cart"}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductList;