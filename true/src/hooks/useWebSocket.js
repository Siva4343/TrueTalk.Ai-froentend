import { useEffect, useRef, useCallback } from 'react';

export const useWebSocket = (url, handlers = {}) => {
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token');
    const wsUrl = `${url}?token=${token}`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      reconnectAttempts.current = 0;
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const handler = handlers[data.type];
        if (handler) {
          handler(data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.current.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      
      // Attempt reconnection
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;
        
        setTimeout(() => {
          console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
          connect();
        }, delay);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [url, handlers]);

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((type, data) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, ...data }));
      return true;
    }
    return false;
  }, []);

  const joinRoom = useCallback((roomId) => {
    return sendMessage('join_room', { room_id: roomId });
  }, [sendMessage]);

  const leaveRoom = useCallback((roomId) => {
    return sendMessage('leave_room', { room_id: roomId });
  }, [sendMessage]);

  const sendChatMessage = useCallback((roomId, content, messageType = 'text', extraData = {}) => {
    return sendMessage('send_message', {
      room_id: roomId,
      content,
      message_type: messageType,
      ...extraData
    });
  }, [sendMessage]);

  const sendTypingIndicator = useCallback((roomId, isTyping) => {
    return sendMessage('typing', {
      room_id: roomId,
      is_typing: isTyping
    });
  }, [sendMessage]);

  const sendReadReceipt = useCallback((messageId) => {
    return sendMessage('read_receipt', {
      message_id: messageId
    });
  }, [sendMessage]);

  const sendReaction = useCallback((messageId, emoji) => {
    return sendMessage('reaction', {
      message_id: messageId,
      emoji
    });
  }, [sendMessage]);

  const deleteMessage = useCallback((messageId, deleteForAll = false) => {
    return sendMessage('delete_message', {
      message_id: messageId,
      delete_for_all: deleteForAll
    });
  }, [sendMessage]);

  return {
    sendMessage,
    joinRoom,
    leaveRoom,
    sendChatMessage,
    sendTypingIndicator,
    sendReadReceipt,
    sendReaction,
    deleteMessage,
    isConnected: ws.current?.readyState === WebSocket.OPEN
  };
};