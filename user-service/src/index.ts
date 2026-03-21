import express from 'express';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { healthRouter } from './routes/health';
import { connectDB } from './repositories/userRepository';
import { initRabbitMQ } from './publisher';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Health check endpoint
app.use('/health', healthRouter);

// Authentication routes (public)
app.use('/auth', authRouter);

// User routes (public and protected)
app.use('/users', usersRouter);

// Legacy routes for backward compatibility
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);

connectDB()
  .then(async () => {
    await initRabbitMQ();
    app.listen(PORT, () => {
      console.log(`User Service listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
