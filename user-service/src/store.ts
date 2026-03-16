// Legacy store.ts - Deprecated
// This file is kept for backward compatibility during migration
// New code should use repositories/userRepository.ts instead

export { connectDB, userRepository as store } from './repositories/userRepository';
export type { User } from './repositories/userRepository';
