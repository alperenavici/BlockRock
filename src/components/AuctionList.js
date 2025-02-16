import React, { useState } from 'react';
import { ethers } from 'ethers';
import AuctionChat from './AuctionChat';

function AuctionList({ auctions, contract, account }) {
  const [bidAmount, setBidAmount] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});
  const [success, setSuccess] = useState({});

  const handleBid = async (auctionId) => {
    setLoading(prev => ({ ...prev, [auctionId]: true }));
    setError(prev => ({ ...prev, [auctionId]: null }));
    setSuccess(prev => ({ ...prev, [auctionId]: null }));

    try {
      if (!bidAmount[auctionId]) {
        throw new Error('Lütfen teklif miktarını girin');
      }

      const amount = ethers.utils.parseEther(bidAmount[auctionId]);
      const tx = await contract.placeBid(auctionId, { value: amount });
      await tx.wait();
      
      setBidAmount(prev => ({
        ...prev,
        [auctionId]: ''
      }));
      
      setSuccess(prev => ({ ...prev, [auctionId]: 'Teklif başarıyla verildi!' }));
    } catch (error) {
      setError(prev => ({ ...prev, [auctionId]: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, [auctionId]: false }));
    }
  };

  const handleEndAuction = async (auctionId) => {
    setLoading(prev => ({ ...prev, [auctionId]: true }));
    try {
      const tx = await contract.endAuction(auctionId);
      await tx.wait();
      setSuccess(prev => ({ ...prev, [auctionId]: 'Açık artırma başarıyla sonlandırıldı!' }));
    } catch (error) {
      setError(prev => ({ ...prev, [auctionId]: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, [auctionId]: false }));
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isAuctionEnded = (endTime) => {
    return new Date() > new Date(endTime);
  };

  return (
    <div className="auction-list">
      <h2 style={{fontWeight:"600"}}>Aktif Açık Artırmalar</h2>
      {auctions.map(auction => (
        <div key={auction.id} className="auction-item">
          <div className="auction-content">
            <h3>{auction.title}</h3>
            <p className="description">{auction.description}</p>
            
            <div className="auction-details">
              <p>
                <span>Başlangıç Fiyatı:</span>
                <span>{auction.startingPrice} ETH</span>
              </p>
              <p>
                <span>En Yüksek Teklif:</span>
                <span>{auction.highestBid} ETH</span>
              </p>
              <p>
                <span>En Yüksek Teklif Veren:</span>
                <span>{auction.highestBidder === ethers.constants.AddressZero ? 
                  'Henüz teklif yok' : 
                  formatAddress(auction.highestBidder)}
                </span>
              </p>
              <p>
                <span>Bitiş Zamanı:</span>
                <span>{auction.endTime.toLocaleString()}</span>
              </p>
              <p>
                <span>Tür:</span>
                <span className={auction.isNFT ? 'nft-badge' : 'regular-badge'}>
                  {auction.isNFT ? 'NFT' : 'Normal'}
                </span>
              </p>
              <p>
                <span>Durum:</span>
                <span className={auction.isActive ? 'status-active' : 'status-ended'}>
                  {auction.isActive ? 'Aktif' : 'Sonlandı'}
                </span>
              </p>
            </div>

            {auction.isNFT && (
              <div className="nft-preview">
                <img
                  src={`https://gateway.pinata.cloud/ipfs/${auction.tokenURI?.split('ipfs://')[1]}`}
                  alt={auction.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/300?text=NFT+Görüntülenemiyor';
                  }}
                />
              </div>
            )}

            {error[auction.id] && (
              <div className="error-message">{error[auction.id]}</div>
            )}
            
            {success[auction.id] && (
              <div className="success-message">{success[auction.id]}</div>
            )}

            {auction.isActive && !isAuctionEnded(auction.endTime) && (
              <div className="bid-section">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Teklif Miktarı (ETH)"
                  value={bidAmount[auction.id] || ''}
                  onChange={(e) => setBidAmount(prev => ({
                    ...prev,
                    [auction.id]: e.target.value
                  }))}
                  disabled={loading[auction.id]}
                />
                <button 
                  onClick={() => handleBid(auction.id)}
                  disabled={loading[auction.id]}
                >
                  {loading[auction.id] ? 'İşlem Yapılıyor...' : 'Teklif Ver'}
                </button>
              </div>
            )}

            {auction.isActive && isAuctionEnded(auction.endTime) && (
              <button 
                onClick={() => handleEndAuction(auction.id)}
                disabled={loading[auction.id]}
                style={{width:"170px", padding:"16px 25px"}}
              >
                {loading[auction.id] ? 'İşlem Yapılıyor...' : 'Açık Artırmayı Sonlandır'}
              </button>
            )}
          </div>
          
          <div className="auction-chat-section">
            <AuctionChat auctionId={auction.id} account={account} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default AuctionList; 