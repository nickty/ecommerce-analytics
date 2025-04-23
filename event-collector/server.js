import express from 'express';
import { Kafka } from 'kafkajs';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure Kafka producer
const kafka = new Kafka({
  clientId: 'event-collector',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();

// Connect to Kafka on startup
const connectProducer = async () => {
  try {
    await producer.connect();
    console.log('Connected to Kafka');
  } catch (error) {
    console.error('Failed to connect to Kafka:', error);
    process.exit(1);
  }
};

connectProducer();

// Define event types and validation
const validEventTypes = [
  'page_view', 
  'product_view', 
  'add_to_cart', 
  'remove_from_cart', 
  'checkout_start', 
  'checkout_complete',
  'search'
];

// API endpoint to receive events
app.post('/events', async (req, res) => {
  const { eventType, userId, sessionId, data } = req.body;
  
  // Validate event
  if (!eventType || !validEventTypes.includes(eventType)) {
    return res.status(400).json({ error: 'Invalid event type' });
  }
  
  // Create event object
  const event = {
    eventId: uuidv4(),
    eventType,
    userId: data.userId || 'anonymous',
    sessionId: data.sessionId || uuidv4(),
    timestamp: new Date().toISOString(),
    data: data || {},
    metadata: {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      referrer: req.headers.referer || ''
    }
  };
  
  try {
    // Send event to Kafka
    await producer.send({
      topic: 'ecommerce-events',
      messages: [
        { 
          key: event.userId, 
          value: JSON.stringify(event),
          headers: {
            eventType: eventType
          }
        }
      ]
    });
    
    console.log(`Event sent to Kafka: ${eventType}`);
    res.status(200).json({ success: true, eventId: event.eventId });
  } catch (error) {
    console.error('Error sending event to Kafka:', error);
    res.status(500).json({ error: 'Failed to process event' });
  }
});

// Simulate events endpoint (for testing)
app.post('/simulate', async (req, res) => {
  const { count = 1 } = req.body;
  const results = [];
  
  for (let i = 0; i < count; i++) {
    // Generate random event
    const eventType = validEventTypes[Math.floor(Math.random() * validEventTypes.length)];
    const userId = `user_${Math.floor(Math.random() * 1000)}`;
    const sessionId = `session_${Math.floor(Math.random() * 500)}`;
    
    // Create event data based on event type
    let data = {};
    
    if (eventType === 'product_view' || eventType === 'add_to_cart') {
      data = {
        productId: `prod_${Math.floor(Math.random() * 100)}`,
        productName: `Product ${Math.floor(Math.random() * 100)}`,
        price: parseFloat((Math.random() * 100 + 5).toFixed(2)),
        category: ['Electronics', 'Clothing', 'Home', 'Books'][Math.floor(Math.random() * 4)]
      };
    } else if (eventType === 'search') {
      data = {
        query: ['iphone', 'laptop', 'shoes', 'dress', 'headphones'][Math.floor(Math.random() * 5)],
        results: Math.floor(Math.random() * 50)
      };
    } else if (eventType === 'checkout_complete') {
      data = {
        orderId: `order_${Math.floor(Math.random() * 10000)}`,
        total: parseFloat((Math.random() * 500 + 20).toFixed(2)),
        items: Math.floor(Math.random() * 5) + 1,
        paymentMethod: ['credit_card', 'paypal', 'apple_pay'][Math.floor(Math.random() * 3)]
      };
    }
    
    // Send event
    try {
      const event = {
        eventId: uuidv4(),
        eventType,
        userId,
        sessionId,
        timestamp: new Date().toISOString(),
        data,
        metadata: {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          referrer: ''
        }
      };
      
      await producer.send({
        topic: 'ecommerce-events',
        messages: [
          { 
            key: event.userId, 
            value: JSON.stringify(event),
            headers: {
              eventType: eventType
            }
          }
        ]
      });
      
      results.push({ eventId: event.eventId, eventType });
    } catch (error) {
      console.error('Error simulating event:', error);
    }
  }
  
  res.status(200).json({ 
    success: true, 
    message: `Generated ${results.length} events`, 
    events: results 
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Event collector running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received, closing HTTP server and Kafka producer');
  await producer.disconnect();
  process.exit(0);
});

console.log('Event collector service initialized');