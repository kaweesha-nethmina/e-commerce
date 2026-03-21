import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

let channel: amqp.Channel;

export const connectRabbitMQ = async () => {
    let connection: any;
    while (true) {
        try {
            console.log(`Attempting to connect to RabbitMQ at ${RABBITMQ_URL}...`);
            connection = await amqp.connect(RABBITMQ_URL);
            console.log('Successfully connected to RabbitMQ (Payment Service)');
            break;
        } catch (error) {
            console.error('Failed to connect to RabbitMQ. Retrying in 5 seconds...');
            await new Promise(res => setTimeout(res, 5000));
        }
    }

    channel = await connection.createChannel();
    return channel;
};

export const getChannel = () => {
    if (!channel) {
        throw new Error('RabbitMQ channel not established');
    }
    return channel;
};
