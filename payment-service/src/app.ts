import express from 'express';
import cors from 'cors';
import paymentRoutes from './routes/paymentRoutes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/payments', paymentRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'payment-service' });
});

export default app;
