import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import authorRoutes from './authorRoutes';
import bookRoutes from './bookRoutes';
import exportRoutes from './exportRoutes';

const router = Router();

// Auth routes (public and protected)
router.use(authRoutes);

// Protected resource routes
router.use('/users', userRoutes);
router.use('/authors', authorRoutes);
router.use('/books', bookRoutes);
router.use('/export', exportRoutes);

export default router;

