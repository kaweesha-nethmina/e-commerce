import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

let channel: any = null;
let connection: any = null;

export async function initRabbitMQ(): Promise<void> {
    try {
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        const exchange = 'user_events_exchange';
        await channel.assertExchange(exchange, 'fanout', { durable: true });

        console.log('Successfully connected to RabbitMQ and initialized user_events_exchange');
    } catch (error) {
        console.error('Failed to connect to RabbitMQ, retrying in 5 seconds...', error);
        setTimeout(initRabbitMQ, 5000);
    }
}

export async function publishUserRegistered(userId: string, email: string, name: string): Promise<void> {
    if (!channel) {
        console.error('RabbitMQ channel is not initialized');
        return;
    }

    try {
        const exchange = 'user_events_exchange';
        const payload = JSON.stringify({
            user_id: userId,
            email: email,
            name: name,
            timestamp: new Date().toISOString()
        });

        channel.publish(exchange, '', Buffer.from(payload));
        console.log(`[x] Published user.registered for ${email} to exchange ${exchange}`);
    } catch (error) {
        console.error('Failed to publish to RabbitMQ', error);
    }
}
