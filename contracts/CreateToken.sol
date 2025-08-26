// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/*
  Simplified example — not production ready. Use audits before mainnet.

  - CreatorToken: ERC20 per creator with linear bonding curve:
      price(s) = basePrice + slope * s
    cost to mint n tokens starting from supply s:
      cost = basePrice*n + slope*(s*n + n*(n-1)/2)
    We use 1e18 fixed point precision for pricing.

  - buyTokens(): payable — mints tokens according to msg.value and curve.
  - sellTokens(amount): burns tokens and refunds AVAX according to curve.
*/

contract CreatorToken is ERC20, Ownable, ReentrancyGuard {
    // Fixed-point precision
    uint256 public constant FP = 1e18;

    // Bonding curve params (in FP)
    uint256 public basePrice; // price per token when supply = 0 (in wei, scaled by FP)
    uint256 public slope;     // price slope per token (in wei/token, scaled by FP)

    // Reserve balance tracks AVAX (wei) held by the contract from sales
    uint256 public reserveBalance;

    // Reference to creator metadata
    address public creator;

    event Bought(address indexed buyer, uint256 tokensMinted, uint256 paid);
    event Sold(address indexed seller, uint256 tokensBurned, uint256 refunded);

    constructor(
        string memory name_,
        string memory symbol_,
        address creator_,
        uint256 basePrice_,
        uint256 slope_
    ) ERC20(name_, symbol_) Ownable(creator_) {
        creator = creator_;
        basePrice = basePrice_;
        slope = slope_;
    }

    // --- Bonding curve math helpers ---
    function _supply() internal view returns (uint256) {
        return totalSupply();
    }

    // cost to mint n tokens given current supply s
    function _costToMint(uint256 n) public view returns (uint256) {
        require(n > 0, "n>0");
        uint256 s = _supply();

        uint256 basePart = basePrice * n;
        uint256 sn = s * n;
        uint256 n_n1_div2 = (n * (n - 1)) / 2;
        uint256 slopeInner = sn + n_n1_div2;
        uint256 slopePart = slope * slopeInner;

        uint256 totalScaled = basePart + slopePart;
        return totalScaled / FP;
    }

    // Approximate inverse: tokens from weiAmount
    function estimateTokensForWei(uint256 weiAmount, uint256 maxIter) public view returns (uint256) {
        uint256 minted = 0;
        uint256 left = weiAmount;

        for (uint256 i = 0; i < maxIter; i++) {
            uint256 nextCost = _costToMint(minted + 1) - _costToMint(minted);
            if (nextCost <= left) {
                left -= nextCost;
                minted += 1;
            } else break;
        }
        return minted;
    }

    // Buy tokens by sending AVAX
    function buyTokens(uint256 minTokens) external payable nonReentrant returns (uint256) {
        require(msg.value > 0, "send AVAX");
        uint256 tokens = estimateTokensForWei(msg.value, 1000); // max 1000 iterations
        require(tokens >= minTokens, "slippage");

        uint256 cost = _costToMint(tokens);
        require(cost <= msg.value, "insufficient");

        reserveBalance += cost;

        if (msg.value > cost) {
            uint256 refund = msg.value - cost;
            (bool sent, ) = msg.sender.call{value: refund}("");
            require(sent, "refund failed");
        }

        _mint(msg.sender, tokens);
        emit Bought(msg.sender, tokens, cost);
        return tokens;
    }

    // Sell tokens back to contract
    function sellTokens(uint256 amount) external nonReentrant returns (uint256) {
        require(amount > 0, "amount>0");
        require(balanceOf(msg.sender) >= amount, "insufficient tokens");

        uint256 s = _supply();
        require(amount <= 1000, "sell limit");

        uint256 refund = 0;
        for (uint256 i = 0; i < amount; i++) {
            uint256 marginalPriceScaled = basePrice + slope * (s - i - 1);
            uint256 marginal = marginalPriceScaled / FP;
            refund += marginal;
        }

        require(refund <= reserveBalance, "insolvent");

        _burn(msg.sender, amount);
        reserveBalance -= refund;

        (bool sent, ) = msg.sender.call{value: refund}("");
        require(sent, "refund failed");

        emit Sold(msg.sender, amount, refund);
        return refund;
    }

    // Admin: withdraw collected fees
    function withdraw(uint256 amount, address to) external onlyOwner nonReentrant {
        require(amount <= reserveBalance, "amount>reserve");
        reserveBalance -= amount;

        (bool sent, ) = to.call{value: amount}("");
        require(sent, "withdraw failed");
    }

    // Fallback to receive AVAX
    receive() external payable {
        reserveBalance += msg.value;
    }
}
