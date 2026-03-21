import pika
import json
import threading
import time
from traceback import print_exc
from app.core.config import settings
from app.db.database import products_col

def callback(ch, method, properties, body):
    try:
        data = json.loads(body)
        print(f"[x] Received order.created event: {data.get('order_id')}")
        
        # Deduct stock for each item sold
        items = data.get("items", [])
        for item in items:
            product_id = item.get("product_id")
            quantity = item.get("quantity", 0)
            
            # MongoDB atomic decrement
            result = products_col.update_one(
                {"id": product_id},
                {"$inc": {"stock": -quantity}}
            )
            if result.modified_count > 0:
                print(f"[-] Unlocked and Reserved {quantity} stock of matching product '{product_id}'")
            else:
                print(f"[!] Warning: Unable to adjust stock for product '{product_id}'. It might not exist.")

        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        print_exc()
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def start_consuming():
    # Wait occasionally because rabbitmq might not be up yet
    while True:
        try:
            params = pika.URLParameters(settings.RABBITMQ_URL)
            connection = pika.BlockingConnection(params)
            channel = connection.channel()

            exchange_name = 'order_events_exchange'
            channel.exchange_declare(exchange=exchange_name, exchange_type='fanout', durable=True)

            dlx_name = 'failed_orders_dlx'
            dlq_name = 'failed_orders_queue'

            # Declare DLX
            channel.exchange_declare(exchange=dlx_name, exchange_type='fanout', durable=True)
            channel.queue_declare(queue=dlq_name, durable=True)
            channel.queue_bind(exchange=dlx_name, queue=dlq_name)

            # Declare consumer queue with DLX arguments
            queue_name = 'product_catalog_order_created'
            args = {"x-dead-letter-exchange": dlx_name}
            channel.queue_declare(queue=queue_name, durable=True, arguments=args)
            
            # Bind queue to exchange
            channel.queue_bind(exchange=exchange_name, queue=queue_name)
            
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(queue=queue_name, on_message_callback=callback)

            print(" [*] Product Catalog waiting for order.created events.")
            channel.start_consuming()
        except pika.exceptions.AMQPConnectionError:
            print("Connection to RabbitMQ lost or failed. Retrying in 5 seconds...")
            time.sleep(5)
        except Exception:
            print_exc()
            time.sleep(5)

def run_consumer_thread():
    thread = threading.Thread(target=start_consuming, daemon=True)
    thread.start()
