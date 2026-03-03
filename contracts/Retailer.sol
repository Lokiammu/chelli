// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Registrable.sol";

abstract contract Retailer is Registrable {

    // =========================
    // STORAGE
    // =========================

    mapping(address => bool) public retailers;

    struct RetailerProfile { 
        string name; 
        string location; 
        string contact; 
    }

    mapping(address => RetailerProfile) public retailerProfiles;

    struct Retail {
        bytes32 cropID;
        uint retailPrice;
        string receivedDate;
        string transferDate;
        address holder;
        bool exists;           // 🔵 ADDED
    }

    mapping(bytes32 => Retail) public retails;

    // =========================
    // MODIFIERS
    // =========================

    modifier onlyRetailer() { 
        require(retailers[msg.sender], "Only retailer"); 
        _; 
    }

    modifier retailExists(bytes32 cropID) {
        require(retails[cropID].exists, "Retail record not found");
        _;
    }

    // =========================
    // EVENTS
    // =========================

    event RetailerRegistered(
        address indexed retailer,
        string name
    );



    // =========================
    // REGISTER RETAILER
    // =========================

    function registerRetailer(
        string calldata name,
        string calldata location,
        string calldata contact
    ) external registerOnce {

        require(!retailers[msg.sender], "Already registered");

        retailers[msg.sender] = true;
        retailerProfiles[msg.sender] = RetailerProfile(
            name,
            location,
            contact
        );

        emit RetailerRegistered(msg.sender, name);
    }

    // =========================
    // RECEIVE FROM AGGREGATOR
    // =========================

    function retailerReceiveFromAggregator(
        bytes32 cropID,
        uint retailPrice,
        string calldata date
    ) external onlyRetailer {

        retails[cropID] = Retail({
            cropID: cropID,
            retailPrice: retailPrice,
            receivedDate: date,
            transferDate: "",
            holder: msg.sender,
            exists: true
        });

        emit CropReceived(
            cropID,
            tx.origin,     // aggregator (academic simplification)
            msg.sender,    // retailer
            retailPrice,
            date,
            block.timestamp
        );
    }

    // =========================
    // TRANSFER TO CUSTOMER
    // =========================

    function retailerTransferToConsumer(
        bytes32 cropID,
        address consumer,
        string calldata transferDate
    ) external onlyRetailer retailExists(cropID) {

        require(retails[cropID].holder == msg.sender, "Not holder");

        retails[cropID].holder = consumer;
        retails[cropID].transferDate = transferDate;

        emit CropTransferred(
            cropID,
            msg.sender,
            consumer,
            transferDate,
            block.timestamp
        );
    }

    // =========================
    // VIEW FUNCTION (FRONTEND)
    // =========================

    function getRetail(bytes32 cropID)
        public view retailExists(cropID)
        returns (
            uint retailPrice,
            string memory receivedDate,
            string memory transferDate,
            address holder
        )
    {
        Retail memory r = retails[cropID];

        return (
            r.retailPrice,
            r.receivedDate,
            r.transferDate,
            r.holder
        );
    }
}