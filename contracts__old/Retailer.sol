// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract Retailer {
    mapping(address => bool) public retailers;

    struct RetailerProfile { string name; string location; string contact; }
    mapping(address => RetailerProfile) public retailerProfiles;

    event RetailerRegistered(address retailer, string name);
    event ReceivedFromAggregator(bytes32 cropID, address retailer);
    event TransferredToConsumer(bytes32 cropID, address consumer);

    struct Retail {
        bytes32 cropID;
        uint retailPrice;
        string receivedDate;
        string transferDate;
        address holder;
    }
    mapping(bytes32 => Retail) public retails;

    modifier onlyRetailer() { require(retailers[msg.sender], "Only retailer"); _; }

    function registerRetailer(string calldata name, string calldata location, string calldata contact) external {
        require(!retailers[msg.sender], "Already registered");
        retailers[msg.sender] = true;
        retailerProfiles[msg.sender] = RetailerProfile(name, location, contact);
        emit RetailerRegistered(msg.sender, name);
    }

    function retailerReceiveFromAggregator(bytes32 cropID, uint retailPrice, string calldata date) external onlyRetailer {
        retails[cropID] = Retail(cropID, retailPrice, date, "", msg.sender);
        emit ReceivedFromAggregator(cropID, msg.sender);
    }

    function retailerTransferToConsumer(bytes32 cropID, address consumer, string calldata transferDate) external onlyRetailer {
        require(retails[cropID].holder == msg.sender, "Not holder");
        retails[cropID].holder = consumer;
        retails[cropID].transferDate = transferDate;
        emit TransferredToConsumer(cropID, consumer);
    }
}
