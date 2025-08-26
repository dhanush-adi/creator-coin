// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CreatorMarketplace is Ownable {
    struct Content {
        address creatorToken;  // ERC20 token required
        address creator;       // creator address
        string ipfsHash;       // IPFS link or encrypted pointer
        uint256 priceInTokens; // price to access (token units)
        bool exists;
    }

    struct Booking {
        address buyer;
        address creator;
        uint256 startAt;  // epoch timestamp
        uint256 duration; // seconds
        uint256 amount;   // tokens locked
        bool released;
    }

    // contentId => Content
    mapping(bytes32 => Content) public contents;

    // bookingId => Booking
    uint256 public bookingCount;
    mapping(uint256 => Booking) public bookings;

    // creator => ERC20 token address
    mapping(address => address) public creatorTokens;

    event ContentRegistered(bytes32 indexed id, address indexed creator, address token, uint256 price);
    event ContentAccessed(bytes32 indexed id, address indexed buyer);
    event BookingCreated(uint256 bookingId, address buyer, address creator, uint256 startAt);
    event BookingReleased(uint256 bookingId);
    event CreatorTokenSet(address indexed creator, address indexed token);

    // ✅ Correct: Pass initialOwner to Ownable's constructor
    constructor(address initialOwner) Ownable(initialOwner) {}

    // Owner can set or update a creator's token
    function setCreatorToken(address creator, address token) external onlyOwner {
        require(creator != address(0), "invalid creator");
        require(token != address(0), "invalid token");
        creatorTokens[creator] = token;
        emit CreatorTokenSet(creator, token);
    }

    function registerContent(
        string calldata contentIdStr,
        address creatorToken,
        string calldata ipfsHash,
        uint256 priceInTokens
    ) external {
        bytes32 id = keccak256(abi.encodePacked(contentIdStr, creatorToken));
        require(!contents[id].exists, "exists");

        contents[id] = Content({
            creatorToken: creatorToken,
            creator: msg.sender,
            ipfsHash: ipfsHash,
            priceInTokens: priceInTokens,
            exists: true
        });

        // auto-map creator to token if not set
        if (creatorTokens[msg.sender] == address(0)) {
            creatorTokens[msg.sender] = creatorToken;
            emit CreatorTokenSet(msg.sender, creatorToken);
        }

        emit ContentRegistered(id, msg.sender, creatorToken, priceInTokens);
    }

    function buyAccess(string calldata contentIdStr, address creatorToken) external {
        bytes32 id = keccak256(abi.encodePacked(contentIdStr, creatorToken));
        Content storage c = contents[id];
        require(c.exists, "no content");

        IERC20 token = IERC20(c.creatorToken);
        require(token.transferFrom(msg.sender, address(this), c.priceInTokens), "transfer failed");

        emit ContentAccessed(id, msg.sender);
    }

    function createBooking(
        address creatorToken,
        address creator,
        uint256 startAt,
        uint256 duration,
        uint256 amountInTokens
    ) external returns (uint256) {
        IERC20 token = IERC20(creatorToken);
        require(token.transferFrom(msg.sender, address(this), amountInTokens), "transfer failed");

        uint256 id = ++bookingCount;
        bookings[id] = Booking({
            buyer: msg.sender,
            creator: creator,
            startAt: startAt,
            duration: duration,
            amount: amountInTokens,
            released: false
        });

        // ensure mapping is set for this creator
        if (creatorTokens[creator] == address(0)) {
            creatorTokens[creator] = creatorToken;
            emit CreatorTokenSet(creator, creatorToken);
        }

        emit BookingCreated(id, msg.sender, creator, startAt);
        return id;
    }

    function releaseBooking(uint256 bookingId) external {
        Booking storage b = bookings[bookingId];
        require(!b.released, "already released");
        require(msg.sender == b.creator || msg.sender == owner(), "not allowed");

        b.released = true;

        IERC20 token = IERC20(getCreatorTokenForCreator(b.creator));
        require(token.transfer(b.creator, b.amount), "transfer failed");

        emit BookingReleased(bookingId);
    }

    function getCreatorTokenForCreator(address creator) internal view returns (address) {
        address token = creatorTokens[creator];
        require(token != address(0), "token not set for creator");
        return token;
    }

    function withdrawERC20(address token, uint256 amount, address to) external onlyOwner {
        IERC20(token).transfer(to, amount);
    }
}
