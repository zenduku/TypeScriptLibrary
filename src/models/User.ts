import db from '../database/database';
import bcrypt from 'bcryptjs';
import { User } from '../types';

export class UserModel {
  static findAll(): User[] {
    const stmt = db.prepare('SELECT id, name, email, created_at, updated_at FROM users');
    return stmt.all() as User[];
  }

  static findById(id: number): User | undefined {
    const stmt = db.prepare('SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?');
    return stmt.get(id) as User | undefined;
  }

  static findByEmail(email: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as User | undefined;
  }

  static create(userData: { name: string; email: string; password: string }): User {
    const hashedPassword = bcrypt.hashSync(userData.password, 10);
    
    const stmt = db.prepare(`
      INSERT INTO users (name, email, password)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(userData.name, userData.email, hashedPassword);
    
    const user = this.findById(result.lastInsertRowid as number);
    if (!user) {
      throw new Error('Failed to create user');
    }
    
    return user;
  }

  static update(id: number, userData: Partial<{ name: string; email: string; password: string }>): User | undefined {
    const updates: string[] = [];
    const values: any[] = [];

    if (userData.name !== undefined) {
      updates.push('name = ?');
      values.push(userData.name);
    }
    if (userData.email !== undefined) {
      updates.push('email = ?');
      values.push(userData.email);
    }
    if (userData.password !== undefined) {
      updates.push('password = ?');
      values.push(bcrypt.hashSync(userData.password, 10));
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE users SET ${updates.join(', ')} WHERE id = ?
    `);
    
    stmt.run(...values);
    return this.findById(id);
  }

  static delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static verifyPassword(user: User, password: string): boolean {
    const stmt = db.prepare('SELECT password FROM users WHERE id = ?');
    const result = stmt.get(user.id) as { password: string };
    return bcrypt.compareSync(password, result.password);
  }
}

