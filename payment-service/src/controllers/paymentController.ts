import { Request, Response } from 'express';
import axios from 'axios';
import Payment from '../models/paymentModel';
import { getChannel } from '../config/rabbitmq';

export const getPayments = async (req: Request, res: Response) => {
    try {
        const payments = await Payment.find().sort({ created_at: -1 });
        res.status(200).json(payments);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getPaymentById = async (req: Request, res: Response) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        res.status(200).json(payment);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getPaymentByOrder = async (req: Request, res: Response) => {
    try {
        const payment = await Payment.findOne({ order_id: req.params.orderId });
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found for order' });
        }
        res.status(200).json(payment);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const processManualPayment = async (req: Request, res: Response) => {
    try {
        const { order_id, user_id, amount } = req.body;
        
        let payment = await Payment.findOne({ order_id });
        if (payment && payment.status === 'completed') {
            return res.status(400).json({ error: 'Payment already completed for this order' });
        }

        if (!payment) {
            payment = new Payment({
                order_id,
                user_id,
                amount,
                status: 'completed',
                transaction_id: 'txn_' + Math.random().toString(36).substr(2, 9)
            });
        } else {
            payment.status = 'completed';
            payment.transaction_id = 'txn_' + Math.random().toString(36).substr(2, 9);
        }

        await payment.save();

        // Update order status to 'paid' in the order service
        try {
            const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';
            await axios.put(`${ORDER_SERVICE_URL}/orders/${order_id}/status`, { status: 'paid' });
            console.log(`[x] Updated order ${order_id} status to 'paid'`);
        } catch (orderErr: any) {
            console.error(`[!] Failed to update order status: ${orderErr.message}`);
        }

        const channel = getChannel();
        const exchange = 'payment_events_exchange';
        await channel.assertExchange(exchange, 'fanout', { durable: true });
        
        const event = {
            event: 'payment.completed',
            order_id: payment.order_id,
            user_id: payment.user_id,
            amount: payment.amount,
            status: payment.status,
            transaction_id: payment.transaction_id
        };
        channel.publish(exchange, '', Buffer.from(JSON.stringify(event)));
        console.log(`[x] Published payment.completed to ${exchange} for Order ID: ${payment.order_id}`);

        res.status(201).json({ message: 'Payment manually processed', payment });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createPayment = async (req: Request, res: Response) => {
    try {
        const { order_id, user_id, amount, status, transaction_id } = req.body;
        
        const newPayment = new Payment({
            order_id,
            user_id,
            amount: amount || 0,
            status: status || 'pending',
            transaction_id: transaction_id || 'txn_' + Math.random().toString(36).substring(2, 9)
        });

        const savedPayment = await newPayment.save();
        res.status(201).json({ message: 'Payment created successfully', payment: savedPayment });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
