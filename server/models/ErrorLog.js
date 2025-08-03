import mongoose from 'mongoose';

const errorLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  integrationName: {
    type: String,
    required: true,
    index: true
  },
  errorType: {
    type: String,
    required: true,
    index: true
  },
  errorMessage: {
    type: String,
    required: true
  },
  rawPayload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  resolved: {
    type: Boolean,
    default: false,
    index: true
  },
  retryCount: {
    type: Number,
    default: 0
  },
  lastRetryAt: {
    type: Date
  },
  retryResults: [{
    timestamp: Date,
    success: Boolean,
    message: String,
    response: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true // This adds createdAt and updatedAt fields
});

// Add compound indexes for better query performance
errorLogSchema.index({ userId: 1, timestamp: -1 });
errorLogSchema.index({ userId: 1, integrationName: 1 });

const ErrorLog = mongoose.model('ErrorLog', errorLogSchema);

export default ErrorLog;