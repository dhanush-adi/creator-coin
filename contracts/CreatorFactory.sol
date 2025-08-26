// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./CreateToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CreatorFactory is Ownable {
    struct Creator {
        address token;
        string name;
        string metadataUri; // IPFS metadata
    }

    Creator[] public creators;
    mapping(address => uint256) public tokenToIndex;

    event CreatorRegistered(address indexed creator, address token, uint256 index);

    // Pass initialOwner to Ownable constructor (OpenZeppelin v5+)
    constructor(address initialOwner) Ownable(initialOwner) {}

    function registerCreator(
        string calldata name,
        string calldata metadataUri,
        string calldata tokenName,
        string calldata tokenSymbol,
        uint256 basePriceScaled, // pass basePrice * 1e18
        uint256 slopeScaled      // pass slope * 1e18
    ) external returns (address) {
        CreatorToken token = new CreatorToken(
            tokenName,
            tokenSymbol,
            msg.sender,
            basePriceScaled,
            slopeScaled
        );

        creators.push(
            Creator({
                token: address(token),
                name: name,
                metadataUri: metadataUri
            })
        );

        uint256 idx = creators.length - 1;
        tokenToIndex[address(token)] = idx;

        emit CreatorRegistered(msg.sender, address(token), idx);
        return address(token);
    }

    function creatorsCount() external view returns (uint256) {
        return creators.length;
    }
}
