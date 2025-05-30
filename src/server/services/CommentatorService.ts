import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface Commentator {
  id: string;
  name: string;
  username: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentatorSession {
  id: string;
  commentatorId: string;
  token: string;
  expiresAt: Date;
}

export class CommentatorService {
  constructor(private pool: Pool) {}

  async getAllCommentators(): Promise<Commentator[]> {
    const result = await this.pool.query(
      'SELECT id, name, username, is_active, created_at, updated_at FROM commentators ORDER BY created_at DESC'
    );
    return result.rows;
  }

  async addCommentator(name: string, username: string, password: string): Promise<Commentator> {
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await this.pool.query(
      'INSERT INTO commentators (id, name, username, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, username, is_active, created_at, updated_at',
      [id, name, username, passwordHash]
    );
    return result.rows[0];
  }

  async generateInviteCode(): Promise<string> {
    const inviteCode = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour expiration

    await this.pool.query(
      'INSERT INTO commentators (id, name, username, password_hash, invite_code, invite_expires_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [uuidv4(), 'Pending', 'pending', '', inviteCode, expiresAt]
    );

    return inviteCode;
  }

  async validateInviteCode(code: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT id FROM commentators WHERE invite_code = $1 AND invite_expires_at > NOW()',
      [code]
    );
    return result.rows.length > 0;
  }

  async signupWithInvite(
    inviteCode: string,
    username: string,
    password: string,
    name: string
  ): Promise<Commentator> {
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await this.pool.query(
      `UPDATE commentators 
       SET name = $1, username = $2, password_hash = $3, invite_code = NULL, invite_expires_at = NULL
       WHERE invite_code = $4 AND invite_expires_at > NOW()
       RETURNING id, name, username, is_active, created_at, updated_at`,
      [name, username, passwordHash, inviteCode]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired invite code');
    }

    return result.rows[0];
  }

  async login(username: string, password: string): Promise<CommentatorSession> {
    const result = await this.pool.query(
      'SELECT id, password_hash FROM commentators WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const commentator = result.rows[0];
    const isValid = await bcrypt.compare(password, commentator.password_hash);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { commentatorId: commentator.id },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    const session = await this.createSession(commentator.id, token);
    return session;
  }

  private async createSession(
    commentatorId: string,
    token: string
  ): Promise<CommentatorSession> {
    const id = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const result = await this.pool.query(
      'INSERT INTO commentator_sessions (id, commentator_id, token, expires_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, commentatorId, token, expiresAt]
    );

    return result.rows[0];
  }

  async validateSession(token: string): Promise<boolean> {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { commentatorId: string };
      const result = await this.pool.query(
        'SELECT id FROM commentator_sessions WHERE token = $1 AND expires_at > NOW()',
        [token]
      );
      return result.rows.length > 0;
    } catch {
      return false;
    }
  }

  async toggleCommentator(id: string, isActive: boolean): Promise<Commentator> {
    const result = await this.pool.query(
      'UPDATE commentators SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, username, is_active, created_at, updated_at',
      [isActive, id]
    );
    return result.rows[0];
  }

  async deleteCommentator(id: string): Promise<void> {
    await this.pool.query('DELETE FROM commentators WHERE id = $1', [id]);
  }

  async isCommentatorActive(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT is_active FROM commentators WHERE id = $1',
      [id]
    );
    return result.rows[0]?.is_active || false;
  }
} 