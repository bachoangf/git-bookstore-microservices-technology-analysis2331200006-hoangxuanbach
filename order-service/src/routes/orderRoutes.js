/**
 * Order Routes
 * 
 * Defines REST API endpoints for order management operations.
 * All routes require authentication (enforced by authGuard middleware in app.js).
 */

import { Router } from 'express';
import { createOrder, getOrderById, listOrders } from '../services/orderService.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const order = await createOrder(req.body, req.user);
    return res.status(201).json({ message: 'Order created', order });
  } catch (err) {
    // Pass error to error handling middleware
    return next(err);
  }
});

router.get('/', async (_req, res, next) => {
  try {
    const orders = await listOrders();
    return res.json(orders);
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.id);
    return res.json(order);
  } catch (err) {
    return next(err);
  }
});

export default router;

