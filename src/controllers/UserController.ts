import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { validationResult } from 'express-validator';

export class UserController {
  static index(_req: Request, res: Response): void {
    const users = UserModel.findAll();
    res.status(200).json(users);
  }

  static async store(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({
        error: 'Validation failed',
        messages: errors.array(),
      });
      return;
    }

    const { name, email, password } = req.body;

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
      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Could not create user' });
    }
  }

  static show(req: Request, res: Response): void {
    const id = parseInt(req.params.id);
    const user = UserModel.findById(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json(user);
  }

  static async update(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({
        error: 'Validation failed',
        messages: errors.array(),
      });
      return;
    }

    const id = parseInt(req.params.id);
    const user = UserModel.findById(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { name, email, password } = req.body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (password !== undefined) updateData.password = password;

    try {
      const updatedUser = UserModel.update(id, updateData);
      if (!updatedUser) {
        res.status(500).json({ error: 'Could not update user' });
        return;
      }

      res.status(200).json({
        message: 'User updated successfully',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          created_at: updatedUser.created_at,
          updated_at: updatedUser.updated_at,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Could not update user' });
    }
  }

  static destroy(req: Request, res: Response): void {
    const id = parseInt(req.params.id);
    const user = UserModel.findById(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const deleted = UserModel.delete(id);
    if (deleted) {
      res.status(200).json({ message: 'User deleted successfully' });
    } else {
      res.status(500).json({ error: 'Could not delete user' });
    }
  }
}

