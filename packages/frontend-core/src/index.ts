/**
 * Filcronet Frontend Core Package
 * Core utilities for Vue 3 frontend packages
 *
 * This package provides:
 * - HTTP client interface and Axios implementation
 * - Token storage interface and memory implementation (XSS-safe)
 * - JWT decoding and token refresh scheduling utilities
 *
 * @packageDocumentation
 */

// API - HTTP client
export * from "./http";

// Storage - Token storage
export * from "./storage";

// JWT - JWT utilities
export * from "./composables";
