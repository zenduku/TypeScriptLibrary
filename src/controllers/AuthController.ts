import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { generateToken } from '../utils/jwt';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({
        error: 'Validation failed',
        messages: errors.array(),
      });
      return;
    }

    const { email, password } = req.body;

    const user = UserModel.findByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isValidPassword = UserModel.verifyPassword(user, password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    try {
      const token = generateToken(user);
      res.status(200).json({
        token,
        token_type: 'bearer',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Could not create token' });
    }
  }

  static async register(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({
        error: 'Validation failed',
        messages: errors.array(),
      });
      return;
    }

    const { name, email, password } = req.body;

    // Verificar si el email ya existe
    const existingUser = UserModel.findByEmail(email);
    if (existingUser) {
      res.status(422).json({
        error: 'Validation failed',
        messages: { email: ['The email has already been taken.'] },
      });
      return;
    }

    try {
      const user = UserModel.create({ name, email, password });
      const token = generateToken(user);

      res.status(201).json({
        message: 'User registered successfully',
        token,
        token_type: 'bearer',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Could not create user' });
    }
  }

  static async me(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }

    const user = UserModel.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at,
    });
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    // En JWT stateless, el logout se maneja en el cliente
    // Aquí solo confirmamos que el token fue válido
    res.status(200).json({ message: 'Successfully logged out' });
  }

  static async refresh(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }

    const user = UserModel.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    try {
      const token = generateToken(user);
      res.status(200).json({
        token,
        token_type: 'bearer',
      });
    } catch (error) {
      res.status(500).json({ error: 'Could not refresh token' });
    }
  }
}

