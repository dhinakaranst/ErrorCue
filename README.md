# ErrorCue 🚨

**Catch automation errors before they break your business**

ErrorCue is a comprehensive monitoring dashboard for no-code/low-code automation platforms like Zapier, n8n, and Make.com. Get instant notifications when your automations fail and take action to resolve issues quickly.

## ✨ Features

### 🎯 Core Functionality
- **Real-time Error Monitoring** - Track failures across all your automation platforms
- **Intelligent Retry System** - Smart retry logic based on error types
- **Error Resolution Tracking** - Mark errors as resolved and track progress
- **Advanced Filtering** - Filter by integration, error type, date range, and resolution status

### 🔧 Platform Integration
- **Zapier** - OAuth expiration, rate limits, webhook failures
- **n8n** - Connection timeouts, authentication issues, data validation
- **Make.com** - API rate limits, service connectivity, data format errors

### 📊 Dashboard Features
- **Statistics Overview** - Total errors, most common issues, affected integrations
- **Color-coded Error Types** - Visual indicators for different error severities
- **Detailed Error Information** - Full payload inspection and suggested fixes
- **Retry History Tracking** - Complete audit trail of retry attempts

### 🔔 Notifications
- **Slack Integration** - Rich notifications with actionable suggestions
- **Real-time Alerts** - Instant notification when automations fail
- **Smart Suggestions** - Context-aware troubleshooting recommendations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)
- Slack webhook URL (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dhinakaranst/ErrorCue.git
   cd ErrorCue
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   SLACK_WEBHOOK_URL=your_slack_webhook_url
   PORT=3001
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

5. **Access the dashboard**
   Open http://localhost:5173 in your browser

## 🏗️ Architecture

### Backend (Node.js + Express)
- **RESTful API** - Clean endpoints for error management
- **MongoDB Integration** - Persistent error logging and analytics
- **Webhook Receivers** - Accept errors from automation platforms
- **Slack Notifications** - Rich webhook integration

### Frontend (React + TypeScript)
- **Modern UI** - Built with React 18 and TypeScript
- **Responsive Design** - TailwindCSS for mobile-first styling
- **Real-time Updates** - Live dashboard with instant refresh
- **Interactive Components** - Modal dialogs, toast notifications

## 📡 API Endpoints

### Error Management
- `POST /api/errors` - Receive new error reports
- `GET /api/errors` - Fetch error logs with filtering
- `POST /api/errors/:id/retry` - Retry failed automation
- `POST /api/errors/:id/resolve` - Mark error as resolved

### Analytics
- `GET /api/stats` - Dashboard statistics
- `GET /api/filter-options` - Available filter options

### Testing
- `GET /debug/test-error` - Generate sample errors
- `GET /debug/check-db` - Database health check

## 🔗 Integration Guide

### Zapier Integration
Configure Zapier webhooks to send failures to:
```
POST https://your-domain.com/api/errors
```

### n8n Integration
Set up error webhooks in n8n workflows:
```json
{
  "userId": "your-user-id",
  "timestamp": "2025-08-03T17:21:58.578Z",
  "integrationName": "n8n",
  "errorType": "CONNECTION_FAILED",
  "errorMessage": "Failed to connect to Slack API",
  "rawPayload": { "nodeId": "slack-node-1", "workflowId": "workflow-456" }
}
```

### Make.com Integration
Configure scenario error handling to POST to ErrorCue endpoint.

## 🎨 Screenshots

### Dashboard Overview
- Real-time error monitoring
- Statistics cards showing key metrics
- Advanced filtering options

### Error Details
- Comprehensive error information
- Retry history tracking
- Suggested resolution steps

### Interactive Actions
- One-click retry functionality
- Error resolution tracking
- Toast notifications for feedback

## 🛠️ Development

### Tech Stack
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Database**: MongoDB Atlas
- **Notifications**: Slack Webhooks
- **Deployment**: Ready for Vercel, Netlify, or custom hosting

### Scripts
```bash
npm run dev          # Start development server
npm run server       # Start backend only  
npm run dev:client   # Start frontend only
npm run build        # Build for production
```

### Database Schema
```javascript
{
  userId: String,
  timestamp: Date,
  integrationName: String, // 'Zapier', 'n8n', 'Make.com'
  errorType: String,       // 'AUTH_EXPIRED', 'RATE_LIMIT', etc.
  errorMessage: String,
  rawPayload: Object,
  resolved: Boolean,
  retryCount: Number,
  lastRetryAt: Date,
  retryResults: Array
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join GitHub Discussions for questions

## 🎯 Roadmap

- [ ] Multi-user authentication
- [ ] Custom notification channels (Email, Teams, Discord)
- [ ] Advanced analytics and reporting
- [ ] Auto-resolution for common error patterns
- [ ] Mobile app for on-the-go monitoring
- [ ] Integration marketplace

---

**Built with ❤️ for the no-code community**

Catch automation errors before they break your business with ErrorCue!
