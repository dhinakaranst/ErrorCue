import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Filter, Eye, Calendar, Zap } from 'lucide-react';
import { ErrorLog, DashboardStats } from '../types';
import ErrorDetailModal from './ErrorDetailModal';

const Dashboard: React.FC = () => {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalErrors: 0,
    mostCommonErrorType: 'None',
    totalIntegrations: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [filters, setFilters] = useState({
    integration: 'all',
    errorType: 'all',
    startDate: '',
    endDate: '',
    showResolved: false
  });
  const [filterOptions, setFilterOptions] = useState({
    integrations: [] as string[],
    errorTypes: [] as string[]
  });

  const fetchErrorLogs = useCallback(async () => {
    try {
      console.log('Fetching error logs with filters:', filters);
      const params = new URLSearchParams();
      params.append('userId', 'local-dev-user');
      params.append('showResolved', filters.showResolved.toString());
      
      // Only add filter params if they're not 'all' or empty
      if (filters.integration && filters.integration !== 'all') {
        params.append('integration', filters.integration);
      }
      if (filters.errorType && filters.errorType !== 'all') {
        params.append('errorType', filters.errorType);
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }

      const url = `http://localhost:3001/api/errors?${params.toString()}`;
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received error logs:', data);
      setErrorLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch error logs:', error);
      setErrorLogs([]); // Set empty array on error
    }
  }, [filters]);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/stats?userId=local-dev-user');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Received stats:', data);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/filter-options?userId=local-dev-user');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Received filter options:', data);
      setFilterOptions(data);
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
      // Set default filter options on error
      setFilterOptions({
        integrations: ['Zapier', 'n8n', 'Make.com'],
        errorTypes: ['AUTH_EXPIRED', 'RATE_LIMIT', 'CONNECTION_FAILED', 'INVALID_DATA']
      });
    }
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([fetchFilterOptions(), fetchStats()]);
      setLoading(false);
    };
    
    loadInitialData();
  }, []); // Only run once on mount

  // Load error logs when filters change
  useEffect(() => {
    fetchErrorLogs();
  }, [fetchErrorLogs]); // Now properly depends on the memoized function

  const testWebhook = async () => {
    try {
      console.log('Testing webhook...');
      const response = await fetch('http://localhost:3001/debug/test-error');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Test webhook result:', result);
      
      // Refresh data after test
      setTimeout(async () => {
        console.log('Refreshing data after test webhook...');
        await Promise.all([fetchErrorLogs(), fetchStats()]);
      }, 500); // Small delay to ensure data is saved
      
    } catch (error) {
      console.error('Failed to test webhook:', error);
    }
  };

  const retryError = async (errorId: string) => {
    try {
      console.log('Retrying error:', errorId);
      const response = await fetch(`http://localhost:3001/api/retry-error/${errorId}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Retry result:', result);
      
      // Show toast notification
      showToast(result.result.success ? 'Retry successful!' : `Retry failed: ${result.result.message}`, result.result.success ? 'success' : 'error');
      
      // Refresh error logs
      await fetchErrorLogs();
      
    } catch (error) {
      console.error('Failed to retry error:', error);
      showToast('Failed to retry error', 'error');
    }
  };

  const resolveError = async (errorId: string) => {
    try {
      console.log('Resolving error:', errorId);
      const response = await fetch(`http://localhost:3001/api/resolve-error/${errorId}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Resolve result:', result);
      
      // Show toast notification
      showToast('Error marked as resolved!', 'success');
      
      // Refresh error logs and stats
      await Promise.all([fetchErrorLogs(), fetchStats()]);
      
      // Close modal if it's open
      setSelectedError(null);
      
    } catch (error) {
      console.error('Failed to resolve error:', error);
      showToast('Failed to resolve error', 'error');
    }
  };

  // Simple toast notification system
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getErrorTypeColor = (errorType: string) => {
    const colors: Record<string, string> = {
      'AUTH_EXPIRED': 'bg-red-100 text-red-800',
      'RATE_LIMIT': 'bg-yellow-100 text-yellow-800',
      'CONNECTION_FAILED': 'bg-orange-100 text-orange-800',
      'INVALID_DATA': 'bg-purple-100 text-purple-800',
      default: 'bg-gray-100 text-gray-800'
    };
    return colors[errorType] || colors.default;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Zap className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ErrorCue</h1>
                <p className="text-sm text-gray-600">Catch automation errors before they break your business</p>
              </div>
            </div>
            <button
              onClick={testWebhook}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Test Webhook
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Errors (7 days)</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalErrors}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Filter className="w-8 h-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Most Common Error</p>
                <p className="text-lg font-semibold text-gray-900">{stats.mostCommonErrorType}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Zap className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Affected Integrations</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalIntegrations}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Integration
              </label>
              <select
                value={filters.integration}
                onChange={(e) => setFilters({ ...filters, integration: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Filter by integration"
              >
                <option value="all">All Integrations</option>
                {filterOptions.integrations.map((integration) => (
                  <option key={integration} value={integration}>
                    {integration}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Error Type
              </label>
              <select
                value={filters.errorType}
                onChange={(e) => setFilters({ ...filters, errorType: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Filter by error type"
              >
                <option value="all">All Error Types</option>
                {filterOptions.errorTypes.map((errorType) => (
                  <option key={errorType} value={errorType}>
                    {errorType}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Filter start date"
                placeholder="Select start date"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Filter end date"
                placeholder="Select end date"
              />
            </div>
          </div>
        </div>

        {/* Show Resolved Toggle */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Display Options</h3>
              <p className="text-sm text-gray-600">Control which errors are visible</p>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.showResolved}
                onChange={(e) => setFilters({ ...filters, showResolved: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Show Resolved Errors</span>
            </label>
          </div>
        </div>

        {/* Error Logs Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Error Logs</h2>
          </div>
          
          {errorLogs.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No errors found. Use the "Test Webhook" button to create sample data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Integration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Error Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Retries
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {errorLogs.map((log) => (
                    <tr key={log.id} className={`hover:bg-gray-50 transition-colors ${log.resolved ? 'bg-green-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {log.integration_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getErrorTypeColor(log.error_type)}`}>
                          {log.error_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {log.error_message}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.resolved ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Resolved
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Open
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.retry_count || 0} retries
                        {log.last_retry_at && (
                          <div className="text-xs text-gray-400">
                            Last: {formatDate(log.last_retry_at)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedError(log)}
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                          {!log.resolved && (
                            <>
                              <button
                                onClick={() => retryError(log.id!)}
                                className="inline-flex items-center text-yellow-600 hover:text-yellow-800 transition-colors"
                              >
                                Retry
                              </button>
                              <button
                                onClick={() => resolveError(log.id!)}
                                className="inline-flex items-center text-green-600 hover:text-green-800 transition-colors"
                              >
                                Resolve
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Error Detail Modal */}
      {selectedError && (
        <ErrorDetailModal
          error={selectedError}
          onClose={() => setSelectedError(null)}
          onRetry={retryError}
          onResolve={resolveError}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Dashboard;