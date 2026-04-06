'use client';

import { useState, useRef, useEffect } from 'react';
import { api, ConversationResponse } from '../lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AIAssistantProps {
  projectId?: string;
}

export default function AIAssistant({ projectId }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message to state
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!projectId) {
        // No project ID - show welcome message
        const assistantMessage: Message = {
          role: 'assistant',
          content: 'Open a project to start chatting about your music.',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      // Send message to API
      const response = await api.sendConceptMessage(projectId, input);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-6 right-6 w-12 h-12 z-40
          bg-black rounded-full flex items-center justify-center
          hover:bg-[#1A1A1A] transition-colors duration-200
          shadow-lg hover:shadow-xl
        `}
        aria-label="Open assistant"
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="square"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m0 0h-6m-6 0H6"
          />
        </svg>
      </button>

      {/* Side Panel */}
      <div
        className={`
          fixed right-0 top-0 w-96 h-screen z-50
          bg-white border-l border-[#E8E8E8]
          flex flex-col
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="border-b border-[#E8E8E8] p-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-heading-sm font-bold text-black">IMC Assistant</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center hover:bg-[#F7F7F5] transition-colors"
            aria-label="Close assistant"
          >
            <svg
              className="w-5 h-5 text-[#666]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="square"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-center">
              <p className="text-body-sm text-[#8A8A8A]">
                {projectId
                  ? 'Ask me anything about your project — creative direction, market insights, or next steps.'
                  : 'Open a project to start chatting about your music.'}
              </p>
            </div>
          )}

          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-xs px-4 py-2
                  ${
                    message.role === 'user'
                      ? 'bg-black text-white'
                      : 'bg-[#F7F7F5] text-black'
                  }
                `}
              >
                <p className="text-body-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#F7F7F5] text-black px-4 py-2 flex gap-1 items-center">
                <span className="w-2 h-2 bg-[#C4C4C4] rounded-full animate-pulse"></span>
                <span className="w-2 h-2 bg-[#C4C4C4] rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></span>
                <span className="w-2 h-2 bg-[#C4C4C4] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-[#E8E8E8] p-4 flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              disabled={isLoading || !projectId}
              className={`
                flex-1 px-3 py-2
                border border-[#E8E8E8]
                text-body-sm
                placeholder-[#C4C4C4]
                focus:outline-none focus:border-[#E8E8E8]
                disabled:bg-[#F7F7F5] disabled:text-[#C4C4C4]
              `}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !projectId || !input.trim()}
              className={`
                px-3 py-2 bg-black text-white text-body-sm font-medium
                hover:bg-[#1A1A1A] transition-colors
                disabled:bg-[#C4C4C4] disabled:cursor-not-allowed
              `}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
