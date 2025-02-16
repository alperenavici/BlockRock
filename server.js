const WebSocket = require('ws');
const http = require('http');
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Her açık artırma için mesaj geçmişini tut
const auctionMessages = new Map();

wss.on('connection', (ws) => {
  let clientAuctionId = null;
  let clientAddress = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Gelen mesaj:', data); // Debug için log

      if (data.type === 'join') {
        clientAuctionId = data.auctionId;
        clientAddress = data.address;
        console.log(`Client joined auction ${clientAuctionId}`); // Debug için log

        // Eğer bu açık artırma için mesaj geçmişi yoksa oluştur
        if (!auctionMessages.has(clientAuctionId)) {
          auctionMessages.set(clientAuctionId, []);
        }

        // Mesaj geçmişini gönder
        const history = {
          type: 'history',
          messages: auctionMessages.get(clientAuctionId)
        };
        ws.send(JSON.stringify(history));
        console.log('Mesaj geçmişi gönderildi:', history); // Debug için log
      }

      if (data.type === 'message') {
        const messageData = {
          type: 'message',
          auctionId: data.auctionId,
          address: data.address,
          content: data.content,
          timestamp: data.timestamp
        };
        console.log('Yeni mesaj oluşturuldu:', messageData); // Debug için log

        // Mesajı geçmişe ekle
        if (!auctionMessages.has(data.auctionId)) {
          auctionMessages.set(data.auctionId, []);
        }
        const messages = auctionMessages.get(data.auctionId);
        messages.push(messageData);

        // Son 100 mesajı tut
        if (messages.length > 100) {
          messages.shift();
        }

        // Aynı açık artırmadaki tüm kullanıcılara mesajı gönder
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(messageData));
            console.log('Mesaj gönderildi:', messageData); // Debug için log
          }
        });
      }
    } catch (error) {
      console.error('Mesaj işleme hatası:', error);
    }
  });

  ws.on('close', () => {
    console.log(`Client disconnected from auction ${clientAuctionId}`); // Debug için log
    clientAuctionId = null;
    clientAddress = null;
  });

  ws.on('error', (error) => {
    console.error('WebSocket hatası:', error);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket sunucusu ${PORT} portunda çalışıyor`);
}); 