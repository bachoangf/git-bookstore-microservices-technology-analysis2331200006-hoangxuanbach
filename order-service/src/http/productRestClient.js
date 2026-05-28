/**
 * REST Client for Product Service
 *
 * Provides helper functions to interact with the Product Service over HTTP.
 */

import { PRODUCT_SERVICE_URL } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

/**
 * Fetches a product by ID via REST.
 *
 * @param {number} id - Product ID to fetch.
 * @returns {Promise<Object>} Product representation from Product Service.
 * @throws {HttpError} If the product is not found or the request fails.
 */
export async function fetchProductByIdRest(id) {
  const baseUrl = PRODUCT_SERVICE_URL.replace(/\/+$/, '');
  const url = `${baseUrl}/${id}`;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        accept: 'application/json'
      }
    });
  } catch (err) {
    throw new HttpError(503, `Failed to reach Product Service: ${err.message}`);
  }

  if (response.status === 404) {
    throw new HttpError(404, 'Product not found');
  }

  if (!response.ok) {
    const body = await safeParseJson(response);
    const message = body?.error || `Unexpected response (${response.status}) from Product Service`;
    throw new HttpError(mapStatusToHttp(response.status), message);
  }

  return response.json();
}

async function safeParseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function mapStatusToHttp(status) {
  if (status >= 500) {
    return 503;
  }
  if (status === 400) {
    return 400;
  }
  if (status === 401 || status === 403) {
    return 502;
  }
  return 500;
}

