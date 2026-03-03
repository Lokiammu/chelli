// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Registrable.sol";
import "./Farmer.sol";
import "./Supplier.sol";
import "./Aggregator.sol";
import "./Retailer.sol";
import "./Customer.sol";

contract TrackSupplyChain is
    Farmer,
    Supplier,
    Aggregator,
    Retailer,
    Customer
{
    address public owner;

    constructor() {
        owner = msg.sender;
    }


    // =====================================================
    // 🌡️ IOT / FRESHNESS DATA (GRAPH + ML READY)
    // =====================================================

    struct FreshnessData {
        uint256 gasValue;
        uint256 temperature;
        uint256 humidity;
        uint256 timestamp;
    }

    /// cropID => freshness
    mapping(bytes32 => FreshnessData) public productFreshness;

    /// 🔵 GRAPH-FRIENDLY EVENT
    event FreshnessUpdated(
        bytes32 indexed cropID,
        uint256 gasValue,
        uint256 temperature,
        uint256 humidity,
        uint256 timestamp
    );

    // =====================================================
    // 🌱 UPDATE FRESHNESS (CALLED BY IOT / ORACLE)
    // =====================================================

    function updateFreshness(
        bytes32 _cropID,
        uint256 _gasValue,
        uint256 _temperature,
        uint256 _humidity
    ) external {
        productFreshness[_cropID] = FreshnessData({
            gasValue: _gasValue,
            temperature: _temperature,
            humidity: _humidity,
            timestamp: block.timestamp
        });

        emit FreshnessUpdated(
            _cropID,
            _gasValue,
            _temperature,
            _humidity,
            block.timestamp
        );
    }

    // =====================================================
    // 🔍 READ FRESHNESS (FRONTEND / GRAPH BACKUP)
    // =====================================================

    function getFreshness(bytes32 _cropID)
        external
        view
        returns (
            uint256 gasValue,
            uint256 temperature,
            uint256 humidity,
            uint256 timestamp
        )
    {
        FreshnessData storage f = productFreshness[_cropID];
        return (f.gasValue, f.temperature, f.humidity, f.timestamp);
    }
}

