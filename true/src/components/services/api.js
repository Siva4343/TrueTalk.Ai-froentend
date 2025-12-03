// src/services/api.js
import { API_BASE, API_ENDPOINTS } from "../utils/constants.js";

class ApiService {
  constructor() {
    this.baseURL = API_BASE;
  }

  getAuthHeaders(extra = {}) {
    const token = localStorage.getItem("token");
    return {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...extra,
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const isFormData = options.body instanceof FormData;

    const headers = isFormData
      ? this.getAuthHeaders()
      : this.getAuthHeaders({ "Content-Type": "application/json" });

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      localStorage.removeItem("token");
      throw new Error("401");
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.detail || "Request failed");
    }

    return data;
  }

  getSellerProducts() {
    return this.request(`${API_ENDPOINTS.PRODUCTS}seller/`);
  }

  delete(id) {
    return this.request(`${API_ENDPOINTS.PRODUCTS}${id}/`, {
      method: "DELETE",
    });
  }

  create(data) {
    return this.request(API_ENDPOINTS.PRODUCTS, {
      method: "POST",
      body: data,
    });
  }
}

export const productApi = new ApiService();
