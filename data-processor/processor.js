import { Kafka } from 'kafkajs';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure Kafka consumer
const kafka = new Kafka({
  clientId: 'data-processor',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'analytics-processors' });
const producer = kafka.producer(); // For sending processed metrics back to Kafka

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce-analytics';
let db;

// Connect to MongoDB
async function connectToMongo() {
  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db();
    
    // Create indexes for better query performance
    await db.collection('events').createIndex({ userId: 1 });
    await db.collection('events').createIndex({ eventType: 1 });
    await db.collection('events').createIndex({ timestamp: 1 });
    await db.collection('events').createIndex({ 'data.productId': 1 });
    
    await db.collection('metrics').createIndex({ name: 1, timestamp: 1 });
    
    console.log('MongoDB indexes created');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Connect to Kafka
async function connectToKafka() {
  try {
    await consumer.connect();
    await producer.connect();
    console.log('Connected to Kafka');
    
    // Subscribe to the events topic
    await consumer.subscribe({ topic: 'ecommerce-events', fromBeginning: false });
    
    console.log('Subscribed to ecommerce-events topic');
  } catch (error) {
    console.error('Failed to connect to Kafka:', error);
    process.exit(1);
  }
}

// Process events
async function processEvents() {
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const eventString = message.value.toString();
        const event = JSON.parse(eventString);
        
        console.log(`Processing event: ${event.eventType} from user ${event.userId}`);
        
        // Store raw event in MongoDB
        await storeEvent(event);
        
        // Process event based on type
        switch (event.eventType) {
          case 'page_view':
            await processPageView(event);
            break;
          case 'product_view':
            await processProductView(event);
            break;
          case 'add_to_cart':
            await processAddToCart(event);
            break;
          case 'checkout_complete':
            await processCheckoutComplete(event);
            break;
          case 'search':
            await processSearch(event);
            break;
        }
        
        // Update real-time metrics
        await updateRealTimeMetrics(event);
        
      } catch (error) {
        console.error('Error processing message:', error);
      }
    },
  });
}

// Store raw event in MongoDB
async function storeEvent(event) {
  try {
    await db.collection('events').insertOne(event);
  } catch (error) {
    console.error('Error storing event:', error);
  }
}

// Process page view events
async function processPageView(event) {
  try {
    // Update page view counts
    const today = new Date().toISOString().split('T')[0];
    
    await db.collection('metrics').updateOne(
      { name: 'daily_page_views', date: today },
      { $inc: { count: 1 } },
      { upsert: true }
    );
    
    // Update user session data
    await db.collection('sessions').updateOne(
      { sessionId: event.sessionId },
      { 
        $set: { 
          userId: event.userId,
          lastActive: event.timestamp
        },
        $inc: { pageViews: 1 },
        $setOnInsert: { 
          firstSeen: event.timestamp,
          userAgent: event.metadata.userAgent
        }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error processing page view:', error);
  }
}

// Process product view events
async function processProductView(event) {
  try {
    if (!event.data.productId) return;
    
    // Update product view counts
    await db.collection('product_analytics').updateOne(
      { productId: event.data.productId },
      { 
        $inc: { views: 1 },
        $set: { 
          lastViewed: event.timestamp,
          productName: event.data.productName,
          price: event.data.price,
          category: event.data.category
        }
      },
      { upsert: true }
    );
    
    // Add to user's viewed products
    await db.collection('user_analytics').updateOne(
      { userId: event.userId },
      { 
        $push: { 
          viewedProducts: {
            productId: event.data.productId,
            timestamp: event.timestamp,
            productName: event.data.productName
          }
        },
        $set: { lastActive: event.timestamp }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error processing product view:', error);
  }
}

// Process add to cart events
async function processAddToCart(event) {
  try {
    if (!event.data.productId) return;
    
    // Update product cart addition counts
    await db.collection('product_analytics').updateOne(
      { productId: event.data.productId },
      { 
        $inc: { cartAdds: 1 },
        $set: { 
          lastAddedToCart: event.timestamp,
          productName: event.data.productName,
          price: event.data.price,
          category: event.data.category
        }
      },
      { upsert: true }
    );
    
    // Calculate cart conversion rate
    const product = await db.collection('product_analytics').findOne({ productId: event.data.productId });
    if (product && product.views > 0) {
      const conversionRate = (product.cartAdds / product.views) * 100;
      await db.collection('product_analytics').updateOne(
        { productId: event.data.productId },
        { $set: { viewToCartRate: conversionRate } }
      );
    }
    
    // Add to user's cart events
    await db.collection('user_analytics').updateOne(
      { userId: event.userId },
      { 
        $push: { 
          cartEvents: {
            productId: event.data.productId,
            action: 'add',
            timestamp: event.timestamp,
            productName: event.data.productName,
            price: event.data.price
          }
        },
        $set: { lastActive: event.timestamp }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error processing add to cart:', error);
  }
}

// Process checkout complete events
async function processCheckoutComplete(event) {
  try {
    if (!event.data.orderId) return;
    
    // Store order information
    await db.collection('orders').insertOne({
      orderId: event.data.orderId,
      userId: event.userId,
      timestamp: event.timestamp,
      total: event.data.total,
      items: event.data.items,
      paymentMethod: event.data.paymentMethod
    });
    
    // Update daily sales metrics
    const today = new Date().toISOString().split('T')[0];
    await db.collection('metrics').updateOne(
      { name: 'daily_sales', date: today },
      { 
        $inc: { 
          count: 1,
          revenue: event.data.total,
          items: event.data.items
        }
      },
      { upsert: true }
    );
    
    // Update user purchase history
    await db.collection('user_analytics').updateOne(
      { userId: event.userId },
      { 
        $push: { 
          purchases: {
            orderId: event.data.orderId,
            timestamp: event.timestamp,
            total: event.data.total,
            items: event.data.items
          }
        },
        $inc: { 
          totalSpent: event.data.total,
          totalOrders: 1
        },
        $set: { lastActive: event.timestamp }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error processing checkout complete:', error);
  }
}

// Process search events
async function processSearch(event) {
  try {
    if (!event.data.query) return;
    
    // Store search query
    await db.collection('searches').insertOne({
      query: event.data.query,
      userId: event.userId,
      timestamp: event.timestamp,
      results: event.data.results
    });
    
    // Update search term popularity
    await db.collection('search_analytics').updateOne(
      { term: event.data.query.toLowerCase() },
      { 
        $inc: { count: 1 },
        $set: { lastSearched: event.timestamp }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error processing search:', error);
  }
}

// Update real-time metrics and send back to Kafka
async function updateRealTimeMetrics(event) {
  try {
    const now = new Date();
    const minute = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
    
    // Update minute-by-minute metrics
    await db.collection('real_time_metrics').updateOne(
      { 
        metric: 'events_per_minute', 
        timestamp: minute 
      },
      { 
        $inc: { 
          total: 1,
          [event.eventType]: 1 
        } 
      },
      { upsert: true }
    );
    
    // Get updated metrics
    const metrics = await db.collection('real_time_metrics').find(
      { timestamp: { $gte: new Date(Date.now() - 3600000).toISOString().slice(0, 16) } }
    ).toArray();
    
    // Send metrics back to Kafka for real-time dashboards
    await producer.send({
      topic: 'analytics-metrics',
      messages: [
        { 
          key: 'real-time-metrics',
          value: JSON.stringify({
            timestamp: now.toISOString(),
            metrics: metrics
          })
        }
      ]
    });
  } catch (error) {
    console.error('Error updating real-time metrics:', error);
  }
}

// Main function
async function main() {
  await connectToMongo();
  await connectToKafka();
  await processEvents();
  
  console.log('Data processor is running');
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received, shutting down');
  await consumer.disconnect();
  await producer.disconnect();
  process.exit(0);
});

// Start the processor
main().catch(error => {
  console.error('Error in main function:', error);
  process.exit(1);
});

console.log('Data processor service initialized');