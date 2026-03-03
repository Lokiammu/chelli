// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract Aggregator {
    mapping(address => bool) public aggregators;

    struct AggregatorProfile { string name; string location; string contact; }
    mapping(address => AggregatorProfile) public aggregatorProfiles;

    event AggregatorRegistered(address aggregator, string name);
    event ReceivedFromSupplier(bytes32 cropID, address aggregator);
    event BatchDivided(bytes32 cropID, string date);
    event TransferredToRetailer(bytes32 cropID, address retailer);

    struct AggregatedBatch {
        bytes32 cropID;
        bool received;
        string receivedDate;
        bool divided;
        string dividedDate;
        string transferDate;
        address currentHolder;
    }
    mapping(bytes32 => AggregatedBatch) public batches;

    modifier onlyAggregator() { require(aggregators[msg.sender], "Only aggregator"); _; }

    function registerAggregator(string calldata name, string calldata location, string calldata contact) external {
        require(!aggregators[msg.sender], "Already registered");
        aggregators[msg.sender] = true;
        aggregatorProfiles[msg.sender] = AggregatorProfile(name, location, contact);
        emit AggregatorRegistered(msg.sender, name);
    }

    function aggregatorReceiveFromSupplier(bytes32 cropID, string calldata date) external onlyAggregator {
        batches[cropID] = AggregatedBatch(cropID, true, date, false, "", "", msg.sender);
        emit ReceivedFromSupplier(cropID, msg.sender);
    }

    function aggregatorDivideBatch(bytes32 cropID, string calldata date) external onlyAggregator {
        require(batches[cropID].received, "Not received");
        batches[cropID].divided = true;
        batches[cropID].dividedDate = date;
        emit BatchDivided(cropID, date);
    }

    function aggregatorTransferToRetailer(bytes32 cropID, address retailer, string calldata transferDate) external onlyAggregator {
        require(batches[cropID].received, "Not received");
        batches[cropID].currentHolder = retailer;
        batches[cropID].transferDate = transferDate;
        emit TransferredToRetailer(cropID, retailer);
    }
}
