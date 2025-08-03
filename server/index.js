import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ErrorLog from './models/ErrorLog.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/errorcue';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB successfully');
    
    // Seed sample data if the database is empty
    try {
      const existingCount = await ErrorLog.countDocuments();
      if (existingCount === 0) {
        console.log('Database is empty, seeding with sample data...');
        await seedSampleData();
      }
    } catch (error) {
      console.log('Error checking/seeding data:', error.message);
    }
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    console.log('Running in demo mode without database');
  });

// Seed function for sample data
async function seedSampleData() {
  const sampleErrors = [
    {
      userId: 'local-dev-user',
      timestamp: new Date(Date.now() - 3600000),
      integrationName: 'Zapier',
      errorType: 'AUTH_EXPIRED',
      errorMessage: 'OAuth token expired for Gmail account',
      rawPayload: { zapId: 'ZAP-83921', step: 'Send Email', response: '401 Unauthorized' },
      resolved: false,
      retryCount: 1,
      lastRetryAt: new Date(Date.now() - 1800000),
      retryResults: [{
        timestamp: new Date(Date.now() - 1800000),
        success: false,
        message: 'Authentication still expired',
        response: { tokenRefreshed: false }
      }]
    },
    {
      userId: 'local-dev-user',
      timestamp: new Date(Date.now() - 7200000),
      integrationName: 'n8n',
      errorType: 'CONNECTION_FAILED',
      errorMessage: 'Failed to connect to Slack API',
      rawPayload: { nodeId: 'slack-node-1', workflowId: 'workflow-456', error: 'Network timeout' },
      resolved: true,
      retryCount: 2,
      lastRetryAt: new Date(Date.now() - 3600000),
      resolvedAt: new Date(Date.now() - 3000000)
    },
    {
      userId: 'local-dev-user',
      timestamp: new Date(Date.now() - 10800000),
      integrationName: 'Make.com',
      errorType: 'RATE_LIMIT',
      errorMessage: 'API rate limit exceeded for Google Sheets',
      rawPayload: { scenarioId: 'scenario-789', module: 'Google Sheets - Add Row' },
      resolved: false,
      retryCount: 0
    },
    {
      userId: 'local-dev-user',
      timestamp: new Date(Date.now() - 14400000),
      integrationName: 'Zapier',
      errorType: 'INVALID_DATA',
      errorMessage: 'Invalid email format in trigger data',
      rawPayload: { zapId: 'ZAP-12345', step: 'Format Email', invalidData: { email: 'not-an-email' } },
      resolved: false,
      retryCount: 3,
      lastRetryAt: new Date(Date.now() - 7200000)
    },
    {
      userId: 'local-dev-user',
      timestamp: new Date(Date.now() - 18000000),
      integrationName: 'n8n',
      errorType: 'TIMEOUT',
      errorMessage: 'HTTP request timeout after 30 seconds',
      rawPayload: { nodeId: 'http-request-1', workflowId: 'workflow-123', url: 'https://api.example.com' },
      resolved: true,
      retryCount: 1,
      resolvedAt: new Date(Date.now() - 14400000)
    },
    {
      userId: 'local-dev-user',
      timestamp: new Date(Date.now() - 21600000),
      integrationName: 'Make.com',
      errorType: 'AUTH_EXPIRED',
      errorMessage: 'Google Drive authentication expired',
      rawPayload: { scenarioId: 'scenario-456', module: 'Google Drive - Upload File' },
      resolved: false,
      retryCount: 2
    },
    {
      userId: 'local-dev-user',
      timestamp: new Date(Date.now() - 25200000),
      integrationName: 'Zapier',
      errorType: 'RATE_LIMIT',
      errorMessage: 'Twitter API rate limit exceeded',
      rawPayload: { zapId: 'ZAP-67890', step: 'Post Tweet', rateLimitReset: new Date(Date.now() + 900000) },
      resolved: true,
      retryCount: 1,
      resolvedAt: new Date(Date.now() - 21600000)
    },
    {
      userId: 'local-dev-user',
      timestamp: new Date(Date.now() - 28800000),
      integrationName: 'n8n',
      errorType: 'INVALID_DATA',
      errorMessage: 'Missing required field: customer_email',
      rawPayload: { nodeId: 'validation-node', workflowId: 'workflow-789' },
      resolved: false,
      retryCount: 0
    },
    {
      userId: 'local-dev-user',
      timestamp: new Date(Date.now() - 32400000),
      integrationName: 'Make.com',
      errorType: 'CONNECTION_FAILED',
      errorMessage: 'Unable to connect to Shopify store',
      rawPayload: { scenarioId: 'scenario-321', module: 'Shopify - Get Orders', storeUrl: 'mystore.myshopify.com' },
      resolved: false,
      retryCount: 4,
      lastRetryAt: new Date(Date.now() - 18000000)
    },
    {
      userId: 'local-dev-user',
      timestamp: new Date(Date.now() - 36000000),
      integrationName: 'Zapier',
      errorType: 'TIMEOUT',
      errorMessage: 'Webhook delivery timeout to customer endpoint',
      rawPayload: { zapId: 'ZAP-11111', step: 'Send Webhook', endpoint: 'https://customer.com/webhook' },
      resolved: true,
      retryCount: 2,
      resolvedAt: new Date(Date.now() - 28800000)
    }
  ];

  try {
    await ErrorLog.insertMany(sampleErrors);
    console.log(`✅ Successfully seeded ${sampleErrors.length} sample errors`);
  } catch (error) {
    console.error('Error seeding sample data:', error);
  }
}

// Slack webhook URL
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || null;

// Utility function to send Slack notifications
async function sendSlackNotification(errorData) {
  if (!SLACK_WEBHOOK_URL) {
    console.log('Slack webhook not configured, skipping notification');
    return;
  }
  
  try {
    // Generate retry suggestions based on error type
    const getRetrySuggestion = (errorType, integrationName) => {
      const suggestions = {
        'AUTH_EXPIRED': `💡 *Suggested Fix:* Check and refresh OAuth tokens in your ${integrationName} dashboard`,
        'RATE_LIMIT': `💡 *Suggested Fix:* Wait for rate limit reset or upgrade your ${integrationName} plan`,
        'CONNECTION_FAILED': `💡 *Suggested Fix:* Check ${integrationName} service status and network connectivity`,
        'INVALID_DATA': `💡 *Suggested Fix:* Verify data format and field mappings in ${integrationName}`,
        'TIMEOUT': `💡 *Suggested Fix:* Increase timeout settings or check ${integrationName} response times`
      };
      return suggestions[errorType] || `💡 *Suggested Fix:* Check ${integrationName} configuration and logs`;
    };

    const message = {
      text: `🚨 *ErrorCue Alert*`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🚨 ErrorCue Alert"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Integration:*\n${errorData.integrationName}`
            },
            {
              type: "mrkdwn",
              text: `*Error Type:*\n${errorData.errorType}`
            },
            {
              type: "mrkdwn",
              text: `*User ID:*\n${errorData.userId}`
            },
            {
              type: "mrkdwn",
              text: `*Time:*\n${new Date(errorData.timestamp).toLocaleString()}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Error Message:*\n\`\`\`${errorData.errorMessage}\`\`\``
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: getRetrySuggestion(errorData.errorType, errorData.integrationName)
          }
        },
        {
          type: "divider"
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "Catch automation errors before they break your business • ErrorCue"
            }
          ]
        }
      ]
    };

    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      console.error('Failed to send Slack notification:', response.statusText);
    } else {
      console.log('Slack notification sent successfully');
    }
  } catch (error) {
    console.error('Error sending Slack notification:', error);
  }
}

// Webhook receiver endpoint
app.post('/api/errors', async (req, res) => {
  try {
    const { userId, timestamp, integrationName, errorType, errorMessage, rawPayload } = req.body;

    // Validate required fields
    if (!userId || !timestamp || !integrationName || !errorType || !errorMessage) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, timestamp, integrationName, errorType, errorMessage' 
      });
    }

    let errorLog;

    if (mongoose.connection.readyState === 1) {
      // MongoDB is connected
      errorLog = new ErrorLog({
        userId,
        timestamp: new Date(timestamp),
        integrationName,
        errorType,
        errorMessage,
        rawPayload: rawPayload || {}
      });

      await errorLog.save();
      console.log('Error log saved to MongoDB:', errorLog._id);
    } else {
      // Demo mode - create mock data
      errorLog = {
        _id: Date.now().toString(),
        userId,
        timestamp: new Date(timestamp),
        integrationName,
        errorType,
        errorMessage,
        rawPayload: rawPayload || {},
        createdAt: new Date()
      };
      console.log('Demo mode: Mock error logged:', errorLog);
    }

    // Send Slack notification
    await sendSlackNotification(errorLog);

    res.status(201).json({ 
      message: 'Error logged successfully', 
      id: errorLog._id || errorLog.id
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get error logs for dashboard
app.get('/api/errors', async (req, res) => {
  try {
    console.log('GET /api/errors called with query:', req.query);
    const { userId = 'local-dev-user', integration, errorType, startDate, endDate, showResolved = 'false' } = req.query;
    console.log('MongoDB connection state:', mongoose.connection.readyState);

    if (mongoose.connection.readyState !== 1) {
      // Return demo data when MongoDB is not available
      const demoData = [
        {
          id: '1',
          user_id: 'local-dev-user',
          timestamp: new Date().toISOString(),
          integration_name: 'Zapier',
          error_type: 'AUTH_EXPIRED',
          error_message: 'OAuth token expired for Gmail account',
          raw_payload: { zapId: 'ZAP-83921', step: 'Send Email' },
          created_at: new Date().toISOString(),
          resolved: false,
          retry_count: 1,
          last_retry_at: new Date(Date.now() - 30000).toISOString()
        },
        {
          id: '2',
          user_id: 'local-dev-user',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          integration_name: 'n8n',
          error_type: 'CONNECTION_FAILED',
          error_message: 'Failed to connect to Slack API',
          raw_payload: { nodeId: 'slack-node-1', workflowId: 'workflow-456' },
          created_at: new Date(Date.now() - 60000).toISOString(),
          resolved: false,
          retry_count: 0
        },
        {
          id: '3',
          user_id: 'local-dev-user',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          integration_name: 'Make.com',
          error_type: 'RATE_LIMIT',
          error_message: 'API rate limit exceeded for Google Sheets',
          raw_payload: { scenarioId: 'scenario-789', module: 'Google Sheets - Add Row' },
          created_at: new Date(Date.now() - 120000).toISOString(),
          resolved: true,
          retry_count: 2
        },
        {
          id: '4',
          user_id: 'local-dev-user',
          timestamp: new Date(Date.now() - 180000).toISOString(),
          integration_name: 'Zapier',
          error_type: 'INVALID_DATA',
          error_message: 'Invalid email format in trigger data',
          raw_payload: { zapId: 'ZAP-12345', step: 'Format Email' },
          created_at: new Date(Date.now() - 180000).toISOString(),
          resolved: false,
          retry_count: 0
        }
      ];

      // Filter resolved errors unless explicitly requested
      const filteredData = showResolved === 'true' ? demoData : demoData.filter(error => !error.resolved);
      
      console.log('MongoDB not connected, returning demo data:', filteredData);
      return res.json(filteredData);
    }

    // Build MongoDB query
    let query = { userId };

    // Filter by resolved status
    if (showResolved === 'false') {
      query.resolved = { $ne: true };
    }

    if (integration && integration !== 'all') {
      query.integrationName = integration;
    }

    if (errorType && errorType !== 'all') {
      query.errorType = errorType;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    const errorLogs = await ErrorLog.find(query)
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    console.log('Found', errorLogs.length, 'error logs from MongoDB');

    // Transform MongoDB documents to match frontend expectations
    const transformedLogs = errorLogs.map(log => ({
      id: log._id.toString(),
      user_id: log.userId,
      timestamp: log.timestamp.toISOString(),
      integration_name: log.integrationName,
      error_type: log.errorType,
      error_message: log.errorMessage,
      raw_payload: log.rawPayload,
      created_at: log.createdAt.toISOString(),
      resolved: log.resolved || false,
      retry_count: log.retryCount || 0,
      last_retry_at: log.lastRetryAt?.toISOString(),
      retry_results: log.retryResults || []
    }));

    console.log('Returning transformed logs:', transformedLogs);
    res.json(transformedLogs);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Retry error endpoint
app.post('/api/retry-error/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Retrying error with ID:', id);

    if (mongoose.connection.readyState !== 1) {
      // Demo mode - simulate retry
      const mockRetryResult = {
        success: Math.random() > 0.5, // 50% success rate for demo
        message: Math.random() > 0.5 ? 'Retry successful' : 'Retry failed - same error persists',
        timestamp: new Date().toISOString()
      };
      
      return res.json({
        message: 'Error retry simulated (demo mode)',
        result: mockRetryResult
      });
    }

    const errorLog = await ErrorLog.findById(id);
    
    if (!errorLog) {
      return res.status(404).json({ error: 'Error log not found' });
    }

    // Simulate retry logic based on error type
    let retryResult;
    const errorType = errorLog.errorType;
    
    if (errorType === 'AUTH_EXPIRED') {
      retryResult = {
        success: Math.random() > 0.3, // 70% success rate for auth errors
        message: Math.random() > 0.3 ? 'Authentication refreshed successfully' : 'Authentication still expired',
        response: { tokenRefreshed: Math.random() > 0.3 }
      };
    } else if (errorType === 'RATE_LIMIT') {
      retryResult = {
        success: Math.random() > 0.8, // 20% success rate for rate limits
        message: Math.random() > 0.8 ? 'Rate limit window reset' : 'Still rate limited',
        response: { rateLimitReset: new Date(Date.now() + 3600000) }
      };
    } else if (errorType === 'CONNECTION_FAILED') {
      retryResult = {
        success: Math.random() > 0.4, // 60% success rate for connection issues
        message: Math.random() > 0.4 ? 'Connection restored' : 'Connection still failing',
        response: { connectionTest: Math.random() > 0.4 ? 'pass' : 'fail' }
      };
    } else {
      retryResult = {
        success: Math.random() > 0.5, // 50% default success rate
        message: Math.random() > 0.5 ? 'Retry successful' : 'Retry failed',
        response: { retryAttempt: true }
      };
    }

    // Update the error log with retry information
    await ErrorLog.findByIdAndUpdate(id, {
      $inc: { retryCount: 1 },
      $set: { lastRetryAt: new Date() },
      $push: {
        retryResults: {
          timestamp: new Date(),
          success: retryResult.success,
          message: retryResult.message,
          response: retryResult.response
        }
      }
    });

    res.json({
      message: 'Retry completed',
      result: retryResult,
      errorId: id
    });

  } catch (error) {
    console.error('Server error during retry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resolve error endpoint
app.post('/api/resolve-error/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Resolving error with ID:', id);

    if (mongoose.connection.readyState !== 1) {
      // Demo mode
      return res.json({
        message: 'Error marked as resolved (demo mode)',
        errorId: id,
        resolved: true
      });
    }

    const errorLog = await ErrorLog.findByIdAndUpdate(
      id,
      { 
        resolved: true,
        resolvedAt: new Date()
      },
      { new: true }
    );

    if (!errorLog) {
      return res.status(404).json({ error: 'Error log not found' });
    }

    res.json({
      message: 'Error marked as resolved',
      errorId: id,
      resolved: true,
      resolvedAt: errorLog.resolvedAt
    });

  } catch (error) {
    console.error('Server error during resolve:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Standardized retry endpoint (alternative route)
app.post('/api/errors/:id/retry', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Retrying error with ID (standardized route):', id);

    if (mongoose.connection.readyState !== 1) {
      // Demo mode - simulate retry
      const mockRetryResult = {
        success: Math.random() > 0.5, // 50% success rate for demo
        message: Math.random() > 0.5 ? 'Retry successful' : 'Retry failed - same error persists',
        timestamp: new Date().toISOString()
      };
      
      return res.json({
        message: 'Error retry simulated (demo mode)',
        result: mockRetryResult
      });
    }

    const errorLog = await ErrorLog.findById(id);
    
    if (!errorLog) {
      return res.status(404).json({ error: 'Error log not found' });
    }

    // Simulate retry logic based on error type
    let retryResult;
    const errorType = errorLog.errorType;
    
    if (errorType === 'AUTH_EXPIRED') {
      retryResult = {
        success: Math.random() > 0.3, // 70% success rate for auth errors
        message: Math.random() > 0.3 ? 'Authentication refreshed successfully' : 'Authentication still expired',
        response: { tokenRefreshed: Math.random() > 0.3 }
      };
    } else if (errorType === 'RATE_LIMIT') {
      retryResult = {
        success: Math.random() > 0.8, // 20% success rate for rate limits
        message: Math.random() > 0.8 ? 'Rate limit window reset' : 'Still rate limited',
        response: { rateLimitReset: new Date(Date.now() + 3600000) }
      };
    } else if (errorType === 'CONNECTION_FAILED') {
      retryResult = {
        success: Math.random() > 0.4, // 60% success rate for connection issues
        message: Math.random() > 0.4 ? 'Connection restored' : 'Connection still failing',
        response: { connectionTest: Math.random() > 0.4 ? 'pass' : 'fail' }
      };
    } else {
      retryResult = {
        success: Math.random() > 0.5, // 50% default success rate
        message: Math.random() > 0.5 ? 'Retry successful' : 'Retry failed',
        response: { retryAttempt: true }
      };
    }

    // Update the error log with retry information
    await ErrorLog.findByIdAndUpdate(id, {
      $inc: { retryCount: 1 },
      $set: { lastRetryAt: new Date() },
      $push: {
        retryResults: {
          timestamp: new Date(),
          success: retryResult.success,
          message: retryResult.message,
          response: retryResult.response
        }
      }
    });

    res.json({
      message: 'Retry completed',
      result: retryResult,
      errorId: id
    });

  } catch (error) {
    console.error('Server error during retry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Standardized resolve endpoint (alternative route)
app.post('/api/errors/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Resolving error with ID (standardized route):', id);

    if (mongoose.connection.readyState !== 1) {
      // Demo mode
      return res.json({
        message: 'Error marked as resolved (demo mode)',
        errorId: id,
        resolved: true
      });
    }

    const errorLog = await ErrorLog.findByIdAndUpdate(
      id,
      { 
        resolved: true,
        resolvedAt: new Date()
      },
      { new: true }
    );

    if (!errorLog) {
      return res.status(404).json({ error: 'Error log not found' });
    }

    res.json({
      message: 'Error marked as resolved',
      errorId: id,
      resolved: true,
      resolvedAt: errorLog.resolvedAt
    });

  } catch (error) {
    console.error('Server error during resolve:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dashboard statistics
app.get('/api/stats', async (req, res) => {
  try {
    const userId = req.query.userId || 'local-dev-user';

    if (mongoose.connection.readyState !== 1) {
      // Return demo stats when MongoDB is not available
      return res.json({
        totalErrors: 4,
        mostCommonErrorType: 'AUTH_EXPIRED',
        totalIntegrations: 3
      });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get total errors in last 7 days
    const recentErrors = await ErrorLog.find({
      userId,
      timestamp: { $gte: sevenDaysAgo }
    }).lean();

    const totalErrors = recentErrors.length;

    // Calculate most common error type
    const errorTypeCounts = {};
    const integrations = new Set();

    recentErrors.forEach(log => {
      errorTypeCounts[log.errorType] = (errorTypeCounts[log.errorType] || 0) + 1;
      integrations.add(log.integrationName);
    });

    const mostCommonErrorType = Object.keys(errorTypeCounts).reduce((a, b) => 
      errorTypeCounts[a] > errorTypeCounts[b] ? a : b, 'None'
    );

    res.json({
      totalErrors,
      mostCommonErrorType,
      totalIntegrations: integrations.size
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available filter options
app.get('/api/filter-options', async (req, res) => {
  try {
    const userId = req.query.userId || 'local-dev-user';

    if (mongoose.connection.readyState !== 1) {
      // Return demo options when MongoDB is not available
      return res.json({
        integrations: ['Zapier', 'n8n', 'Make.com'],
        errorTypes: ['AUTH_EXPIRED', 'RATE_LIMIT', 'CONNECTION_FAILED', 'INVALID_DATA']
      });
    }

    // Get distinct integrations and error types
    const integrations = await ErrorLog.distinct('integrationName', { userId });
    const errorTypes = await ErrorLog.distinct('errorType', { userId });

    res.json({
      integrations: integrations.sort(),
      errorTypes: errorTypes.sort()
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Debug test endpoint
app.get('/debug/test-error', async (req, res) => {
  try {
    const mockErrors = [
      {
        userId: 'local-dev-user',
        timestamp: new Date().toISOString(),
        integrationName: 'Zapier',
        errorType: 'AUTH_EXPIRED',
        errorMessage: 'OAuth token expired for Gmail account',
        rawPayload: {
          zapId: 'ZAP-83921',
          step: 'Send Email',
          response: '401 Unauthorized'
        }
      },
      {
        userId: 'local-dev-user',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        integrationName: 'n8n',
        errorType: 'CONNECTION_FAILED',
        errorMessage: 'Failed to connect to Slack API',
        rawPayload: {
          nodeId: 'slack-node-1',
          workflowId: 'workflow-456',
          error: 'Network timeout after 30 seconds'
        }
      },
      {
        userId: 'local-dev-user',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        integrationName: 'Make.com',
        errorType: 'RATE_LIMIT',
        errorMessage: 'API rate limit exceeded for Google Sheets',
        rawPayload: {
          scenarioId: 'scenario-789',
          module: 'Google Sheets - Add Row',
          rateLimitReset: new Date(Date.now() + 3600000).toISOString()
        }
      },
      {
        userId: 'local-dev-user',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        integrationName: 'Zapier',
        errorType: 'INVALID_DATA',
        errorMessage: 'Invalid email format in trigger data',
        rawPayload: {
          zapId: 'ZAP-12345',
          step: 'Format Email',
          invalidData: { email: 'not-an-email' }
        }
      }
    ];

    const savedErrors = [];

    for (const mockError of mockErrors) {
      let errorLog;

      if (mongoose.connection.readyState === 1) {
        // MongoDB is connected
        errorLog = new ErrorLog({
          userId: mockError.userId,
          timestamp: new Date(mockError.timestamp),
          integrationName: mockError.integrationName,
          errorType: mockError.errorType,
          errorMessage: mockError.errorMessage,
          rawPayload: mockError.rawPayload
        });

        await errorLog.save();
        console.log('Test error saved to MongoDB:', errorLog._id);
      } else {
        // Demo mode
        errorLog = {
          _id: Date.now().toString() + Math.random(),
          ...mockError,
          timestamp: new Date(mockError.timestamp),
          createdAt: new Date()
        };
        console.log('Demo mode: Test error created:', errorLog);
      }

      savedErrors.push(errorLog);
      
      // Send Slack notification for each error
      await sendSlackNotification(errorLog);
    }

    res.json({ 
      message: `${savedErrors.length} test errors created and Slack notifications sent`, 
      count: savedErrors.length,
      data: savedErrors
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Debug endpoint to check database contents
app.get('/debug/check-db', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ 
        message: 'MongoDB not connected',
        connectionState: mongoose.connection.readyState 
      });
    }

    const allErrors = await ErrorLog.find({}).lean();
    res.json({
      message: 'Database check complete',
      totalRecords: allErrors.length,
      records: allErrors,
      connectionState: mongoose.connection.readyState
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`ErrorCue server running on port ${PORT}`);
  console.log(`MongoDB URI: ${MONGODB_URI}`);
});