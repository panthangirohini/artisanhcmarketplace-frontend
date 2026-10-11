// src/api.js
// Central axios instance — automatically attaches JWT to every request

import axios from "axios";

// Backend base URL, configured via REACT_APP_API_URL in .env
export const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

// Warm-toned SVG placeholder shown when a product has no image
const placeholder = (label = "✦") =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f8e9d2"/><stop offset="1" stop-color="#e9cfa8"/>
      </linearGradient></defs>
      <rect width="400" height="300" fill="url(#g)"/>
      <circle cx="200" cy="150" r="70" fill="#fff" fill-opacity="0.35"/>
      <text x="200" y="150" font-size="64" text-anchor="middle" dominant-baseline="central">${label}</text>
    </svg>`
  );

// Resolve a product's imageUrl: full URLs are used as-is, bare file names come from the backend's /uploads
export const imageSrc = (imageUrl, label) => {
  if (!imageUrl) return placeholder(label);
  if (/^(https?:|data:)/.test(imageUrl)) return imageUrl;
  return `${API_URL}/uploads/${imageUrl}`;
};

const api = axios.create({
  baseURL: API_URL,
});

// Attach JWT token from localStorage to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 (token expired/invalid), log the user out.
// Skip when there's no session, so a failed login just shows its error.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/"; // redirect to login
    }
    return Promise.reject(err);
  }
);

export default api;
