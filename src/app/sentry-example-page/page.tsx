'use client';

import { useState } from 'react';

declare global {
  interface Window {
    Sentry: any;
  }
}

export default function SentryExamplePage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleFrontendError = () => {
    if (window.Sentry) {
      window.Sentry.startSpan(
        {
          op: "ui.click",
          name: "Test Frontend Error Button",
        },
        (span) => {
          span.setAttribute("error_type", "frontend_test");
          span.setAttribute("component", "SentryExamplePage");
          
          throw new Error('This is a test error from the frontend!');
        }
      );
    } else {
      throw new Error('This is a test error from the frontend!');
    }
  };

  const handleAPIError = async () => {
    setIsLoading(true);
    
    if (window.Sentry) {
      return window.Sentry.startSpan(
        {
          op: "http.client",
          name: "GET /api/sentry-example-api",
        },
        async (span) => {
          try {
            span.setAttribute("api_endpoint", "/api/sentry-example-api");
            span.setAttribute("request_type", "test_error");
            
            const response = await fetch('/api/sentry-example-api');
            if (!response.ok) {
              throw new Error('API request failed');
            }
            const data = await response.json();
            console.log('API Response:', data);
            
            span.setAttribute("response_status", "success");
          } catch (error) {
            span.setAttribute("response_status", "error");
            window.Sentry.captureException(error);
            console.error('API Error:', error);
          } finally {
            setIsLoading(false);
          }
        }
      );
    } else {
      try {
        const response = await fetch('/api/sentry-example-api');
        if (!response.ok) {
          throw new Error('API request failed');
        }
        const data = await response.json();
        console.log('API Response:', data);
      } catch (error) {
        console.error('API Error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCaptureMessage = () => {
    if (window.Sentry) {
      const { logger } = window.Sentry;
      
      // Test different log levels
      logger.info('Formula PM v2 - Sentry test message', { 
        feature: 'error_monitoring',
        environment: 'development',
        user_action: 'test_button_click'
      });
      
      logger.warn('This is a test warning from Formula PM v2', {
        component: 'SentryExamplePage',
        severity: 'low'
      });
      
      window.Sentry.captureMessage('This is a test message from Formula PM v2!', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Sentry Test Page
        </h1>
        
        <div className="space-y-4">
          <button
            onClick={handleFrontendError}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Throw Frontend Error
          </button>
          
          <button
            onClick={handleAPIError}
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            {isLoading ? 'Loading...' : 'Test API Error'}
          </button>
          
          <button
            onClick={handleCaptureMessage}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Send Test Message
          </button>
          
          <button
            onClick={() => {
              // This snippet contains an intentional error and can be used as a test 
              // to make sure that everything's working as expected.
              myUndefinedFunction();
            }}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Test Undefined Function Error
          </button>
        </div>
        
        <div className="mt-6 text-sm text-gray-600 text-center">
          <p>Click the buttons above to test different types of Sentry integration.</p>
          <p className="mt-2">Check your Sentry dashboard to see the captured events.</p>
        </div>
      </div>
    </div>
  );
}