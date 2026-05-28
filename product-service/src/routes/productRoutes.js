/**
 * Product Routes
 * 
 * Defines REST API endpoints for product management operations.
 * All routes require authentication (enforced by authGuard middleware).
 */

import express from 'express';
import * as productService from '../services/productService.js';
import { authGuard } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const products = await productService.getAllProducts();
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const product = await productService.getProductById(id);
    res.json(product);
  } catch (err) {
    if (err.message === 'Product not found') {
      return res.status(404).json({ error: err.message });
    }
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const product = await productService.createProduct(req.body, req.user);
    res.status(201).json(product);
  } catch (err) {
    if (err.message === 'title and author required') {
      return res.status(400).json({ error: err.message });
    }
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const product = await productService.updateProduct(id, req.body);
    res.json(product);
  } catch (err) {
    if (err.message === 'Product not found') {
      return res.status(404).json({ error: err.message });
    }
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await productService.deleteProduct(id, req.user);
    res.json({ message: 'Deleted', ...result });
  } catch (err) {
    if (err.message === 'Product not found') {
      return res.status(404).json({ error: err.message });
    }
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

