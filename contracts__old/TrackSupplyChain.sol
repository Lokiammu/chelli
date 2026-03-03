// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Farmer.sol";
import "./Supplier.sol";
import "./Aggregator.sol";
import "./Retailer.sol";
import "./Customer.sol";

contract TrackSupplyChain is Farmer, Supplier, Aggregator, Retailer, Customer {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    // --- Full freshness data ---
    struct Freshness {
        uint gasValue;
        uint temperature;
        uint humidity;
        uint timestamp;
    }

    mapping(uint => Freshness) public freshnessRecords;

    event FreshnessUpdated(
        uint indexed productId,
        uint gasValue,
        uint temperature,
        uint humidity,
        uint timestamp
    );

    function updateFreshness(
        uint productId,
        uint gasValue,
        uint temperature,
        uint humidity
    ) public returns (bool) {
        freshnessRecords[productId] = Freshness(
            gasValue,
            temperature,
            humidity,
            block.timestamp
        );
        emit FreshnessUpdated(
            productId,
            gasValue,
            temperature,
            humidity,
            block.timestamp
        );
        return true;
    }

    // --- NEW: gas-only update support ---
    mapping(uint256 => uint256) public gasValues;
    mapping(uint256 => uint256) public gasTimestamp;

    event GasUpdated(uint256 indexed productId, uint256 gasValue, uint256 timestamp);

    function updateGasValue(uint256 productId, uint256 gasValue) public returns (bool) {
        gasValues[productId] = gasValue;
        gasTimestamp[productId] = block.timestamp;
        emit GasUpdated(productId, gasValue, block.timestamp);
        return true;
    }
}
