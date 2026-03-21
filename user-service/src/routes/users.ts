import { Router } from 'express';
import { getUserById, getCurrentUserProfile, updateProfile, deleteProfile, changePassword } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

export const usersRouter = Router();

// Protected routes — must be defined BEFORE /:id to avoid Express matching "me" as an id
usersRouter.get('/me/profile', authenticate, getCurrentUserProfile);
usersRouter.put('/me/profile', authenticate, updateProfile);
usersRouter.put('/me/password', authenticate, changePassword);
usersRouter.delete('/me/profile', authenticate, deleteProfile);

// Public route - get user by ID (used by other services)
usersRouter.get('/:id', getUserById);
