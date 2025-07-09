import React, { useState } from 'react';
import { WebSocketStatus } from '../components/common/WebSocketStatus';
import { CrawlProgress } from '../components/common/CrawlProgress';
import { Button } from '../components/common/Button';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';

export const WebSocketDemo: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { isConnected, connect, disconnect, send, subscribe, unsubscribe } = useWebSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [testTaskId, setTestTaskId] = useState<number>(1);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);

  // Subscribe to all WebSocket events for demo
  React.useEffect(() => {
    const handleMessage = (data: any) => {
      setMessages(prev => [...prev.slice(-9), {
        type: 'message',
        timestamp: new Date().toISOString(),
        data
      }]);
    };

    const handleCrawlProgress = (data: any) => {
      setMessages(prev => [...prev.slice(-9), {
        type: 'crawl_progress',
        timestamp: new Date().toISOString(),
        data
      }]);
    };

    const handleCrawlStarted = (data: any) => {
      setMessages(prev => [...prev.slice(-9), {
        type: 'crawl_started',
        timestamp: new Date().toISOString(),
        data
      }]);
    };

    const handleCrawlCompleted = (data: any) => {
      setMessages(prev => [...prev.slice(-9), {
        type: 'crawl_completed',
        timestamp: new Date().toISOString(),
        data
      }]);
    };

    const handleError = (data: any) => {
      setMessages(prev => [...prev.slice(-9), {
        type: 'error',
        timestamp: new Date().toISOString(),
        data
      }]);
    };

    subscribe('message', handleMessage);
    subscribe('crawl_progress', handleCrawlProgress);
    subscribe('crawl_started', handleCrawlStarted);
    subscribe('crawl_completed', handleCrawlCompleted);
    subscribe('error', handleError);

    return () => {
      unsubscribe('message', handleMessage);
      unsubscribe('crawl_progress', handleCrawlProgress);
      unsubscribe('crawl_started', handleCrawlStarted);
      unsubscribe('crawl_completed', handleCrawlCompleted);
      unsubscribe('error', handleError);
    };
  }, [subscribe, unsubscribe]);

  const handleSendTestMessage = () => {
    const testMessage = {
      type: 'test',
      message: 'Hello from frontend!',
      timestamp: Date.now()
    };
    
    const success = send(testMessage);
    if (success) {
      setMessages(prev => [...prev.slice(-9), {
        type: 'sent',
        timestamp: new Date().toISOString(),
        data: testMessage
      }]);
    }
  };

  const handleSubscribeToTask = () => {
    const subscription = `crawl_task:${testTaskId}`;
    setSubscriptions(prev => [...prev, subscription]);
    setMessages(prev => [...prev.slice(-9), {
      type: 'subscription',
      timestamp: new Date().toISOString(),
      data: { action: 'subscribe', subscription }
    }]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">WebSocket Demo</h1>
          <p className="text-gray-600 mb-4">Please log in to access WebSocket functionality</p>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">WebSocket Demo</h1>
          <p className="text-gray-600">
            This page demonstrates real-time WebSocket functionality for the web crawler application.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Connection Status & Controls */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
            
            <div className="mb-6">
              <WebSocketStatus />
            </div>

            <div className="space-y-4">
              <div className="flex space-x-4">
                <Button 
                  onClick={connect} 
                  disabled={isConnected}
                  variant="primary"
                >
                  Connect
                </Button>
                <Button 
                  onClick={disconnect} 
                  disabled={!isConnected}
                  variant="secondary"
                >
                  Disconnect
                </Button>
              </div>

              <div className="flex space-x-4">
                <Button 
                  onClick={handleSendTestMessage} 
                  disabled={!isConnected}
                  variant="primary"
                >
                  Send Test Message
                </Button>
                <Button 
                  onClick={clearMessages} 
                  variant="secondary"
                >
                  Clear Messages
                </Button>
              </div>

              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  value={testTaskId}
                  onChange={(e) => setTestTaskId(Number(e.target.value))}
                  className="w-20 px-3 py-1 border border-gray-300 rounded-md"
                  placeholder="Task ID"
                />
                <Button 
                  onClick={handleSubscribeToTask} 
                  disabled={!isConnected}
                  variant="primary"
                >
                  Subscribe to Task
                </Button>
              </div>
            </div>

            {/* Active Subscriptions */}
            {subscriptions.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Active Subscriptions:</h3>
                <div className="space-y-1">
                  {subscriptions.map((sub, index) => (
                    <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {sub}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Real-time Messages */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Real-time Messages</h2>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  No messages yet. Connect and interact with the WebSocket to see real-time updates.
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        msg.type === 'error' ? 'bg-red-100 text-red-800' :
                        msg.type === 'crawl_progress' ? 'bg-blue-100 text-blue-800' :
                        msg.type === 'sent' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {msg.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="text-xs text-gray-600 mt-1 overflow-x-auto">
                      {JSON.stringify(msg.data, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Crawl Progress Demo */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Crawl Progress Demo</h2>
            <p className="text-gray-600 mb-4">
              This component shows real-time progress updates for crawl task #{testTaskId}
            </p>
            <CrawlProgress taskId={testTaskId} />
          </div>
        </div>

        {/* Documentation */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">WebSocket Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Connection Management</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Automatic authentication with JWT tokens</li>
                  <li>• Auto-reconnection with exponential backoff</li>
                  <li>• Connection state monitoring</li>
                  <li>• Heartbeat mechanism</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Real-time Updates</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Crawl progress updates</li>
                  <li>• Task status changes</li>
                  <li>• Error notifications</li>
                  <li>• Subscription management</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebSocketDemo; 