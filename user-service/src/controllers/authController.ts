import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { userService } from '../services/userService';

export async function register(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }

    const result = await userService.register({ email, password, name });
    res.status(201).json(result);
  } catch (error: any) {
    if (error.message === 'Email already registered') {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Registration failed' });
    }
  }
}

export async function login(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const result = await userService.login({ email, password });
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Invalid credentials') {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Login failed' });
    }
  }
}

export async function validate(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.body?.token;
    
    if (!token) {
      res.status(401).json({ valid: false, error: 'Missing token' });
      return;
    }

    const result = await userService.validateToken(token);
    
    if (!result.valid) {
      res.status(401).json({ valid: false, error: 'Invalid or expired token' });
      return;
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ valid: false, error: error.message || 'Validation failed' });
  }
}
