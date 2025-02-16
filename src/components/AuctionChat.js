import React, { useState, useEffect, useRef } from 'react';

function AuctionChat({ auctionId, account }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const chatEndRef = useRef(null);
  const ws = useRef(null);

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  useEffect(() => {
    // WebSocket bağlantısını kur
    ws.current = new WebSocket('ws://localhost:3001');

    ws.current.onopen = () => {
      console.log('WebSocket bağlantısı kuruldu');
      setIsConnected(true);
      // Odaya katıl
      ws.current.send(JSON.stringify({
        type: 'join',
        auctionId,
        address: account
      }));
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Gelen mesaj:', data);

        if (data.type === 'message' && data.auctionId === auctionId) {
          setMessages(prev => [...prev, data]);
        } else if (data.type === 'history') {
          setMessages(data.messages.filter(msg => msg.auctionId === auctionId));
        }
      } catch (error) {
        console.error('Mesaj işleme hatası:', error);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket hatası:', error);
      setIsConnected(false);
    };

    ws.current.onclose = () => {
      console.log('WebSocket bağlantısı kapandı');
      setIsConnected(false);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [auctionId, account]);

  useEffect(() => {
    // Yeni mesaj geldiğinde otomatik olarak en alta kaydır
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected) return;

    const messageData = {
      type: 'message',
      auctionId,
      address: account,
      content: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    try {
      ws.current.send(JSON.stringify(messageData));
      console.log('Mesaj gönderildi:', messageData);
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
    }

    setNewMessage('');
  };

  return (
    <div className="auction-chat">
      <div className="chat-header">
        <h4>Açık Artırma Sohbeti</h4>
        <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'Bağlı' : 'Bağlantı Kesik'}
        </span>
      </div>
      
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.address === account ? 'own-message' : ''}`}
          >
            <div className="message-header">
              <span className="message-sender">{formatAddress(msg.address)}</span>
              <span className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={sendMessage} className="chat-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={isConnected ? "Mesajınızı yazın..." : "Bağlantı bekleniyor..."}
          disabled={!isConnected}
        />
        <button type="submit" disabled={!isConnected}>
          Gönder
        </button>
      </form>
    </div>
  );
}

export default AuctionChat; 