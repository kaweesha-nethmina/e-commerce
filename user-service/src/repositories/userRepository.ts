import { MongoClient, Collection, Db } from 'mongodb';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = 'ctse_users';

let db: Db;
let usersCol: Collection<User>;

export async function connectDB(): Promise<void> {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  usersCol = db.collection<User>('users');

  // Create indexes for fast lookups
  await usersCol.createIndex({ id: 1 }, { unique: true });
  await usersCol.createIndex({ email: 1 }, { unique: true });

  console.log(`Connected to MongoDB → ${DB_NAME}`);
}

export const userRepository = {
  async create(user: User): Promise<void> {
    await usersCol.insertOne({
      ...user,
      role: user.role || 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  },

  async findById(id: string): Promise<User | null> {
    return usersCol.findOne({ id });
  },

  async findByEmail(email: string): Promise<User | null> {
    return usersCol.findOne({ email });
  },

  async update(id: string, updates: Partial<User>): Promise<boolean> {
    const result = await usersCol.updateOne(
      { id },
      { 
        $set: { 
          ...updates, 
          updatedAt: new Date() 
        } 
      }
    );
    return result.matchedCount > 0;
  },

  async delete(id: string): Promise<boolean> {
    const result = await usersCol.deleteOne({ id });
    return result.deletedCount > 0;
  },

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  },

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  },
};
