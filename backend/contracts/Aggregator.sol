// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Registrable.sol";

abstract contract Aggregator is Registrable {

    // =========================
    // STORAGE
    // =========================

    mapping(address => bool) public aggregators;

    struct AggregatorProfile { 
        string name; 
        string location; 
        string contact; 
    }

    mapping(address => AggregatorProfile) public aggregatorProfiles;

    struct AggregatedBatch {
        bytes32 cropID;
        bool received;
        string receivedDate;
        bool divided;
        string dividedDate;
        string transferDate;
        address currentHolder;
        uint processingCost;      // 🎯 ADDED: Aggregator processing cost
        bool exists;              // 🔵 ADDED (important)
    }

    mapping(bytes32 => AggregatedBatch) public batches;

    // =========================
    // MODIFIERS
    // =========================

    modifier onlyAggregator() { 
        require(aggregators[msg.sender], "Only aggregator"); 
        _; 
    }

    modifier batchExists(bytes32 cropID) {
        require(batches[cropID].exists, "Batch does not exist");
        _;
    }

    // =========================
    // EVENTS
    // =========================

    event AggregatorRegistered(address aggregator, string name);
    event ReceivedFromSupplier(bytes32 cropID, address aggregator);
    event BatchDivided(bytes32 cropID, string date);
    event TransferredToRetailer(bytes32 cropID, address retailer);

    // =========================
    // REGISTER AGGREGATOR
    // =========================

    function registerAggregator(
        string calldata name,
        string calldata location,
        string calldata contact
    ) external registerOnce {

        require(!aggregators[msg.sender], "Already registered");

        aggregators[msg.sender] = true;
        aggregatorProfiles[msg.sender] = AggregatorProfile(name, location, contact);

        emit AggregatorRegistered(msg.sender, name);
    }

    // =========================
    // RECEIVE FROM SUPPLIER
    // =========================

    function aggregatorReceiveFromSupplier(
        bytes32 cropID,
        uint processingCost,
        string calldata date
    ) external onlyAggregator {

        batches[cropID] = AggregatedBatch({
            cropID: cropID,
            received: true,
            receivedDate: date,
            divided: false,
            dividedDate: "",
            transferDate: "",
            currentHolder: msg.sender,
            processingCost: processingCost,  // 🎯 STORE THE COST
            exists: true
        });

        emit ReceivedFromSupplier(cropID, msg.sender);
    }

    // =========================
    // DIVIDE BATCH
    // =========================

    function aggregatorDivideBatch(
        bytes32 cropID,
        string calldata date
    ) external onlyAggregator batchExists(cropID) {

        require(batches[cropID].received, "Not received");

        batches[cropID].divided = true;
        batches[cropID].dividedDate = date;

        emit BatchDivided(cropID, date);
    }

    // =========================
    // TRANSFER TO RETAILER
    // =========================

    function aggregatorTransferToRetailer(
        bytes32 cropID,
        address retailer,
        string calldata transferDate
    ) external onlyAggregator batchExists(cropID) {

        require(batches[cropID].received, "Not received");

        batches[cropID].currentHolder = retailer;
        batches[cropID].transferDate = transferDate;

        emit TransferredToRetailer(cropID, retailer);
    }

    // =========================
    // VIEW FUNCTION (FRONTEND)
    // =========================

    function getBatch(bytes32 cropID)
        public view batchExists(cropID)
        returns (
            bool received,
            string memory receivedDate,
            bool divided,
            string memory dividedDate,
            string memory transferDate,
            address holder,
            uint processingCost      // 🎯 ADDED: Return processing cost
        )
    {
        AggregatedBatch memory b = batches[cropID];

        return (
            b.received,
            b.receivedDate,
            b.divided,
            b.dividedDate,
            b.transferDate,
            b.currentHolder,
            b.processingCost       // 🎯 RETURN THE COST
        );
    }
}