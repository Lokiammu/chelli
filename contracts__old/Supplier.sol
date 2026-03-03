// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract Supplier {
    mapping(address => bool) public suppliers;

    struct SupplierProfile { string name; string location; string contact; }
    mapping(address => SupplierProfile) public supplierProfiles;

    event SupplierRegistered(address supplier, string name);
    event ReceivedFromFarmer(bytes32 cropID, address supplier);
    event TransferredToAggregator(bytes32 cropID, address aggregator);

    struct Supply {
        bytes32 cropID;
        uint transportCost;
        string receivedDate;
        string transferDate;
        address currentHolder;
    }
    mapping(bytes32 => Supply) public supplies;

    modifier onlySupplier() { require(suppliers[msg.sender], "Only supplier"); _; }

    function registerSupplier(string calldata name, string calldata location, string calldata contact) external {
        require(!suppliers[msg.sender], "Already registered");
        suppliers[msg.sender] = true;
        supplierProfiles[msg.sender] = SupplierProfile(name, location, contact);
        emit SupplierRegistered(msg.sender, name);
    }

    function supplierReceiveFromFarmer(bytes32 cropID, uint transportCost, string calldata date) external onlySupplier {
        supplies[cropID] = Supply(cropID, transportCost, date, "", msg.sender);
        emit ReceivedFromFarmer(cropID, msg.sender);
    }

    function supplierTransferToAggregator(bytes32 cropID, address aggregator, string calldata transferDate) external onlySupplier {
        require(supplies[cropID].currentHolder == msg.sender, "Not holder");
        supplies[cropID].currentHolder = aggregator;
        supplies[cropID].transferDate = transferDate;
        emit TransferredToAggregator(cropID, aggregator);
    }
}
