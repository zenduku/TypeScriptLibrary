import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User } from '../types';

export interface JWTPayload {
  id: number;
  email: string;
}

export function generateToken(user: User): string {
  const payload: JWTPayload = {
    id: user.id,
    email: user.email,
  };

  const secret = config.jwtSecret || 'default-secret';
  const expiresIn = config.jwtExpiresIn || '24h';

  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, config.jwtSecret) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

