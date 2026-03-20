import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';
import { connectRabbitMQ } from './config/rabbitmq';

const PORT = process.env.PORT || 3005;

const startServer = async () => {
    try {
        await connectDB();
        await connectRabbitMQ();

        app.listen(PORT, () => {
            console.log(`Payment Service REST API running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start Payment Service:', error);
        process.exit(1);
    }
};

startServer();
