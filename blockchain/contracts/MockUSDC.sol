
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MockUSDC is ERC20, Ownable {

    constructor()
        ERC20("Mock USD Coin", "mUSDC")
        Ownable(msg.sender)
    {
        // Give the deployer an initial supply of 1 million tokens.
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    // Only the contract owner can create additional test tokens.
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient address");

        _mint(to, amount);
    }

    // USDC uses 6 decimal places instead of the ERC-20 default of 18.
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
