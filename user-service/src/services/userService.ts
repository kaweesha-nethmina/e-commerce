import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { userRepository, User } from '../repositories/userRepository';
import { publishUserRegistered } from '../publisher';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export interface AuthResponse {
  userId: string;
  token: string;
  expiresIn: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
}

export const userService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new Error('Email already registered');
    }

    const id = uuidv4();
    const hashedPassword = await userRepository.hashPassword(input.password);
    
    const user: User = {
      id,
      email: input.email,
      password: hashedPassword,
      name: input.name,
    };

    await userRepository.create(user);

    // Publish event to RabbitMQ
    publishUserRegistered(id, input.email, input.name);

    const token = jwt.sign({ sub: id, email: input.email }, JWT_SECRET, { expiresIn: '24h' });
    
    return {
      userId: id,
      token,
      expiresIn: '24h',
    };
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await userRepository.verifyPassword(input.password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    
    return {
      userId: user.id,
      token,
      expiresIn: '24h',
    };
  },

  async validateToken(token: string): Promise<{ valid: boolean; userId: string; email: string }> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; email: string };
      const user = await userRepository.findById(decoded.sub);
      
      if (!user) {
        return { valid: false, userId: '', email: '' };
      }

      return { valid: true, userId: user.id, email: user.email };
    } catch {
      return { valid: false, userId: '', email: '' };
    }
  },

  async getUserById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await userRepository.findById(id);
    if (!user) {
      return null;
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<Omit<User, 'password'> | null> {
    const updates: Partial<User> = {};
    
    if (input.name !== undefined) {
      updates.name = input.name;
    }
    
    if (input.email !== undefined) {
      const existing = await userRepository.findByEmail(input.email);
      if (existing && existing.id !== userId) {
        throw new Error('Email already in use');
      }
      updates.email = input.email;
    }

    const success = await userRepository.update(userId, updates);
    if (!success) {
      return null;
    }

    return this.getUserById(userId);
  },

  async deleteProfile(userId: string): Promise<boolean> {
    return userRepository.delete(userId);
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await userRepository.verifyPassword(currentPassword, user.password);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await userRepository.hashPassword(newPassword);
    return userRepository.update(userId, { password: hashedPassword } as any);
  },
};
