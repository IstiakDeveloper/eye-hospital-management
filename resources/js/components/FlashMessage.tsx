import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';

interface FlashMessages {
  success?: string;
  error?: string;
  warning?: string;
  info?: string;
}

interface PageProps {
  flash: FlashMessages;
}

interface FlashMessageProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: () => void;
}

const FlashMessage: React.FC<FlashMessageProps> = ({ type, message, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-400" />;
      default:
        return null;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getCloseButtonStyles = () => {
    switch (type) {
      case 'success':
        return 'text-green-500 hover:text-green-600';
      case 'error':
        return 'text-red-500 hover:text-red-600';
      case 'warning':
        return 'text-yellow-500 hover:text-yellow-600';
      case 'info':
        return 'text-blue-500 hover:text-blue-600';
      default:
        return 'text-gray-500 hover:text-gray-600';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md w-full transform transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`rounded-lg border p-4 shadow-lg ${getStyles()}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              type="button"
              className={`inline-flex rounded-md p-1.5 transition-colors ${getCloseButtonStyles()}`}
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function FlashMessages() {
  const { flash } = usePage<PageProps>().props;
  const [messages, setMessages] = useState<Array<{ id: string; type: 'success' | 'error' | 'warning' | 'info'; message: string }>>([]);

  useEffect(() => {
    const newMessages: Array<{ id: string; type: 'success' | 'error' | 'warning' | 'info'; message: string }> = [];

    if (flash.success) {
      newMessages.push({
        id: `success-${Date.now()}`,
        type: 'success',
        message: flash.success
      });
    }

    if (flash.error) {
      newMessages.push({
        id: `error-${Date.now()}`,
        type: 'error',
        message: flash.error
      });
    }

    if (flash.warning) {
      newMessages.push({
        id: `warning-${Date.now()}`,
        type: 'warning',
        message: flash.warning
      });
    }

    if (flash.info) {
      newMessages.push({
        id: `info-${Date.now()}`,
        type: 'info',
        message: flash.info
      });
    }

    if (newMessages.length > 0) {
      setMessages(newMessages);
    }
  }, [flash]);

  const removeMessage = (id: string) => {
    setMessages(prev => prev.filter(message => message.id !== id));
  };

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
      {messages.map((message, index) => (
        <div key={message.id} style={{ marginTop: `${index * 70}px` }}>
          <FlashMessage
            type={message.type}
            message={message.message}
            onClose={() => removeMessage(message.id)}
          />
        </div>
      ))}
    </div>
  );
}
