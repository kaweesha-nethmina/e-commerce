package com.ctse.notification.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.FanoutExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    // Notification service unique queues
    public static final String NOTIFICATION_ORDER_CREATED_QUEUE = "notification_order_created";
    public static final String NOTIFICATION_USER_REGISTERED_QUEUE = "notification_user_registered";
    public static final String NOTIFICATION_PAYMENT_COMPLETED_QUEUE = "notification_payment_completed";

    // Exchanges
    public static final String ORDER_EVENTS_EXCHANGE = "order_events_exchange";
    public static final String USER_EVENTS_EXCHANGE = "user_events_exchange";
    public static final String PAYMENT_EVENTS_EXCHANGE = "payment_events_exchange";

    @Bean
    public FanoutExchange orderEventsExchange() {
        return new FanoutExchange(ORDER_EVENTS_EXCHANGE, true, false);
    }

    @Bean
    public FanoutExchange userEventsExchange() {
        return new FanoutExchange(USER_EVENTS_EXCHANGE, true, false);
    }

    @Bean
    public FanoutExchange paymentEventsExchange() {
        return new FanoutExchange(PAYMENT_EVENTS_EXCHANGE, true, false);
    }

    @Bean
    public Queue orderCreatedQueue() {
        return new Queue(NOTIFICATION_ORDER_CREATED_QUEUE, true);
    }

    @Bean
    public Queue userRegisteredQueue() {
        return new Queue(NOTIFICATION_USER_REGISTERED_QUEUE, true);
    }

    @Bean
    public Queue paymentCompletedQueue() {
        return new Queue(NOTIFICATION_PAYMENT_COMPLETED_QUEUE, true);
    }

    @Bean
    public Binding orderCreatedBinding(Queue orderCreatedQueue, FanoutExchange orderEventsExchange) {
        return BindingBuilder.bind(orderCreatedQueue).to(orderEventsExchange);
    }

    @Bean
    public Binding userRegisteredBinding(Queue userRegisteredQueue, FanoutExchange userEventsExchange) {
        return BindingBuilder.bind(userRegisteredQueue).to(userEventsExchange);
    }

    @Bean
    public Binding paymentCompletedBinding(Queue paymentCompletedQueue, FanoutExchange paymentEventsExchange) {
        return BindingBuilder.bind(paymentCompletedQueue).to(paymentEventsExchange);
    }
}
