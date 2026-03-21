import axios from 'axios';
import amqp from 'amqplib';
import { getChannel } from '../config/rabbitmq';
import Payment from '../models/paymentModel';

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';

export const startPaymentWorker = async () => {
    const channel = getChannel();
    const exchange = 'order_events_exchange';

    await channel.assertExchange(exchange, 'fanout', { durable: true });
    
    // Dedicated queue for the payment service
    const q = await channel.assertQueue('payment_processing_queue', { durable: true });
    
    // Bind queue to the order events exchange
    await channel.bindQueue(q.queue, exchange, '');

    console.log(`[*] Payment Worker waiting for events natively from RabbitMQ.`);

    channel.consume(q.queue, async (msg: amqp.Message | null) => {
        if (msg) {
            try {
                const event = JSON.parse(msg.content.toString());
                
                // Process only newly created orders
                if (event.status === 'created') {
                    console.log(`[x] Received payment request for Order ID: ${event.order_id}`);
                    
                    // 1. Create a pending payment record
                    const amount = event.items ? event.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) : 0;
                    
                    let payment = new Payment({
                        order_id: event.order_id,
                        user_id: event.user_id,
                        amount: amount || Math.floor(Math.random() * 100) + 50, // fallback if price not present
                        status: 'pending',
                        transaction_id: 'txn_pending'
                    });
                    await payment.save();

                    console.log(`    Payment pending for user ${event.user_id}. Awaiting manual payment.`);
                }
            } catch (err: any) {
                console.error(`Error processing message: ${err.message}`);
            } finally {
                channel.ack(msg);
            }
        }
    }, { noAck: false });
};
