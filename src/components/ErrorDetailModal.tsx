import React, { useState } from 'react';
import { X, Copy, CheckCircle } from 'lucide-react';
import { ErrorLog } from '../types';

interface ErrorDetailModalProps {
  error: ErrorLog;
  onClose: () => void;
  onRetry?: (errorId: string) => Promise<void>;
  onResolve?: (errorId: string) => Promise<void>;
}

const ErrorDetailModal: React.FC<ErrorDetailModalProps> = ({ error, onClose, onRetry, onResolve }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const getErrorSuggestion = (errorType: string, integrationName: string) => {
    const suggestions: Record<string, string> = {
      'AUTH_EXPIRED': `Check and refresh OAuth tokens in your ${integrationName} dashboard`,
      'RATE_LIMIT': `Wait for rate limit reset or upgrade your ${integrationName} plan`,
      'CONNECTION_FAILED': `Check ${integrationName} service status and network connectivity`,
      'INVALID_DATA': `Verify data format and field mappings in ${integrationName}`,
      'TIMEOUT': `Increase timeout settings or check ${integrationName} response times`
    };
    return suggestions[errorType] || `Check ${integrationName} configuration and logs`;
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Error Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timestamp
              </label>
              <p className="text-sm text-gray-900">
                {new Date(error.timestamp).toLocaleString()}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Integration
              </label>
              <p className="text-sm text-gray-900">{error.integration_name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Error Type
              </label>
              <p className="text-sm text-gray-900">{error.error_type}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <p className="text-sm text-gray-900">{error.user_id}</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Error Message
            </label>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
              {error.error_message}
            </p>
          </div>

          {/* Suggested Fix */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">Suggested Fix</h3>
                <p className="text-sm text-blue-800">
                  {getErrorSuggestion(error.error_type, error.integration_name)}
                </p>
              </div>
            </div>
          </div>

          {/* Retry Results Section */}
          {error.retry_results && error.retry_results.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Retry History</h3>
              <div className="space-y-2">
                {error.retry_results.map((result, index) => (
                  <div key={index} className={`p-3 rounded-md border ${
                    result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${
                        result.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {result.success ? 'Success' : 'Failed'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{result.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Raw Payload
              </label>
              <button
                onClick={() => copyToClipboard(JSON.stringify(error.raw_payload, null, 2))}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy to Clipboard
                  </>
                )}
              </button>
            </div>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-md text-xs overflow-auto">
              {JSON.stringify(error.raw_payload, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t bg-gray-50">
          <div className="flex space-x-3">
            {!error.resolved && onRetry && (
              <button
                onClick={() => {
                  onRetry(error.id!);
                  onClose();
                }}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Retry Error
              </button>
            )}
            {!error.resolved && onResolve && (
              <button
                onClick={() => {
                  onResolve(error.id!);
                  onClose();
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Mark as Resolved
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorDetailModal;