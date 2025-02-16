// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AuctionNFT.sol";

contract Auction {
    struct AuctionItem {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 startingPrice;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
        bool isActive;
        uint256 tokenId;
        bool isNFT;
    }

    uint256 public auctionCount;
    mapping(uint256 => AuctionItem) public auctions;
    mapping(uint256 => mapping(address => uint256)) public bids;
    AuctionNFT public nftContract;

    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed creator,
        string title,
        uint256 startingPrice,
        uint256 endTime
    );

    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );

    event AuctionEnded(
        uint256 indexed auctionId,
        address winner,
        uint256 amount
    );

    event NFTAuctionCreated(
        uint256 indexed auctionId,
        uint256 indexed tokenId,
        address indexed creator
    );

    constructor(address _nftContract) {
        nftContract = AuctionNFT(_nftContract);
    }

    function createAuction(
        string memory _title,
        string memory _description,
        uint256 _startingPrice,
        uint256 _duration
    ) public returns (uint256) {
        require(_startingPrice > 0, "Starting price must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");

        uint256 auctionId = auctionCount++;
        uint256 endTime = block.timestamp + (_duration * 1 minutes);

        auctions[auctionId] = AuctionItem(
            auctionId,
            msg.sender,
            _title,
            _description,
            _startingPrice,
            0,
            address(0),
            endTime,
            true,
            0,
            false
        );

        emit AuctionCreated(auctionId, msg.sender, _title, _startingPrice, endTime);
        return auctionId;
    }

    function createNFTAuction(
        string memory _title,
        string memory _description,
        uint256 _startingPrice,
        uint256 _duration,
        string memory _tokenURI
    ) public returns (uint256) {
        require(_startingPrice > 0, "Starting price must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");

        // NFT oluştur
        uint256 tokenId = nftContract.createToken(address(this), _tokenURI);

        uint256 auctionId = auctionCount++;
        uint256 endTime = block.timestamp + (_duration * 1 minutes);

        auctions[auctionId] = AuctionItem(
            auctionId,
            msg.sender,
            _title,
            _description,
            _startingPrice,
            0,
            address(0),
            endTime,
            true,
            tokenId,
            true
        );

        emit NFTAuctionCreated(auctionId, tokenId, msg.sender);
        emit AuctionCreated(auctionId, msg.sender, _title, _startingPrice, endTime);
        return auctionId;
    }

    function placeBid(uint256 _auctionId) public payable {
        AuctionItem storage auction = auctions[_auctionId];
        require(auction.isActive, "Auction is not active");
        require(block.timestamp < auction.endTime, "Auction has ended");
        require(msg.value > auction.highestBid, "Bid must be higher than current highest bid");
        require(msg.value >= auction.startingPrice, "Bid must be at least the starting price");

        if (auction.highestBid > 0) {
            // Önceki en yüksek teklif sahibine parasını geri gönder
            payable(auction.highestBidder).transfer(auction.highestBid);
        }

        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;
        bids[_auctionId][msg.sender] = msg.value;

        emit BidPlaced(_auctionId, msg.sender, msg.value);
    }

    function endAuction(uint256 _auctionId) public {
        AuctionItem storage auction = auctions[_auctionId];
        require(auction.isActive, "Auction is not active");
        require(block.timestamp >= auction.endTime, "Auction has not ended yet");

        auction.isActive = false;

        if (auction.highestBidder != address(0)) {
            if (auction.isNFT) {
                // NFT'yi kazanan kişiye transfer et
                nftContract.transferFrom(address(this), auction.highestBidder, auction.tokenId);
            }
            // Satıcıya parayı gönder
            payable(auction.creator).transfer(auction.highestBid);
        } else if (auction.isNFT) {
            // Teklif yoksa NFT'yi yaratıcıya geri gönder
            nftContract.transferFrom(address(this), auction.creator, auction.tokenId);
        }

        emit AuctionEnded(_auctionId, auction.highestBidder, auction.highestBid);
    }

    function getAuction(uint256 _auctionId) public view returns (
        uint256 id,
        address creator,
        string memory title,
        string memory description,
        uint256 startingPrice,
        uint256 highestBid,
        address highestBidder,
        uint256 endTime,
        bool isActive,
        uint256 tokenId,
        bool isNFT
    ) {
        AuctionItem memory auction = auctions[_auctionId];
        return (
            auction.id,
            auction.creator,
            auction.title,
            auction.description,
            auction.startingPrice,
            auction.highestBid,
            auction.highestBidder,
            auction.endTime,
            auction.isActive,
            auction.tokenId,
            auction.isNFT
        );
    }
} 