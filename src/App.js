import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import AuctionABI from './contracts/Auction.json';
import CreateAuction from './components/CreateAuction';
import AuctionList from './components/AuctionList';
import './App.css';

const AUCTION_CONTRACT_ADDRESS = "0x5e8422f3c5eac20901cccea6993a8a2c9ba802a0";

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [auctions, setAuctions] = useState([]);

  useEffect(() => {
    connectWallet();
  }, []);

  const disconnectWallet = () => {
    setAccount(null);
    setContract(null);
    setAuctions([]);
  };

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const auctionContract = new ethers.Contract(
          AUCTION_CONTRACT_ADDRESS,
          AuctionABI.abi,
          signer
        );

        setAccount(accounts[0]);
        setContract(auctionContract);
        loadAuctions(auctionContract);
      }
    } catch (error) {
      console.error("Cüzdan bağlantı hatası:", error);
    }
  };

  const loadAuctions = async (auctionContract) => {
    try {
      const auctionCount = await auctionContract.auctionCount();
      const auctionList = [];

      for (let i = 0; i < auctionCount; i++) {
        const auction = await auctionContract.getAuction(i);
        auctionList.push({
          id: auction.id.toNumber(),
          creator: auction.creator,
          title: auction.title,
          description: auction.description,
          startingPrice: ethers.utils.formatEther(auction.startingPrice),
          highestBid: ethers.utils.formatEther(auction.highestBid),
          highestBidder: auction.highestBidder,
          endTime: new Date(auction.endTime.toNumber() * 1000),
          isActive: auction.isActive
        });
      }

      setAuctions(auctionList);
    } catch (error) {
      console.error("İhaleler yüklenirken hata:", error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>TransAuction</h1>
        <div className="wallet-connect">
          {!account ? (
            <button onClick={connectWallet} className="connect-button">
              MetaMask'a Bağlan
            </button>
          ) : (
            <div className="account-info">
              <span className="account-address">
                {`${account.slice(0, 6)}...${account.slice(-4)}`}
              </span>
              <div className="connection-status">
                <span className="status-dot"></span>
                <span>Bağlı</span>
              </div>
              <button onClick={disconnectWallet} className="disconnect-button">
                <span className="disconnect-icon">×</span>
              </button>
            </div>
          )}
        </div>
      </header>
      <main>
        {contract && (
          <>
            <CreateAuction contract={contract} onAuctionCreated={() => loadAuctions(contract)} />
            <AuctionList auctions={auctions} contract={contract} account={account} />
          </>
        )}
      </main>
    </div>
  );
}

export default App; 