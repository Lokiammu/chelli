// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Registrable.sol";

abstract contract Supplier is Registrable {

    // =========================
    // STORAGE
    // =========================

    mapping(address => bool) public suppliers;

    struct SupplierProfile { 
        string name; 
        string location; 
        string contact; 
    }

    mapping(address => SupplierProfile) public supplierProfiles;

    struct Supply {
        bytes32 cropID;
        uint transportCost;
        string receivedDate;
        string transferDate;
        address currentHolder;
        bool exists;              // 🔵 ADDED
    }

    mapping(bytes32 => Supply) public supplies;

    // =========================
    // MODIFIERS
    // =========================

    modifier onlySupplier() { 
        require(suppliers[msg.sender], "Only supplier"); 
        _; 
    }

    modifier supplyExists(bytes32 cropID) {
        require(supplies[cropID].exists, "Supply does not exist");
        _;
    }

    // =========================
    // EVENTS
    // =========================

    event SupplierRegistered(
        address indexed supplier,
        string name
    );



    // =========================
    // REGISTER SUPPLIER
    // =========================

    function registerSupplier(
        string calldata name,
        string calldata location,
        string calldata contact
    ) external registerOnce {

        require(!suppliers[msg.sender], "Already registered");

        suppliers[msg.sender] = true;
        supplierProfiles[msg.sender] = SupplierProfile(name, location, contact);

        emit SupplierRegistered(msg.sender, name);
    }

    // =========================
    // RECEIVE FROM FARMER
    // =========================

    function supplierReceiveFromFarmer(
        bytes32 cropID,
        uint transportCost,
        string calldata date
    ) external onlySupplier {

        supplies[cropID] = Supply({
            cropID: cropID,
            transportCost: transportCost,
            receivedDate: date,
            transferDate: "",
            currentHolder: msg.sender,
            exists: true
        });

        emit CropReceived(
            cropID,
            tx.origin,      // farmer
            msg.sender,     // supplier
            transportCost,
            date,
            block.timestamp
        );
    }

    // =========================
    // TRANSFER TO AGGREGATOR
    // =========================

    function supplierTransferToAggregator(
        bytes32 cropID,
        address aggregator,
        string calldata transferDate
    ) external onlySupplier supplyExists(cropID) {

        require(supplies[cropID].currentHolder == msg.sender, "Not holder");

        supplies[cropID].currentHolder = aggregator;
        supplies[cropID].transferDate = transferDate;

        emit CropTransferred(
            cropID,
            msg.sender,
            aggregator,
            transferDate,
            block.timestamp
        );
    }

    // =========================
    // VIEW FUNCTION (FRONTEND)
    // =========================

    function getSupply(bytes32 cropID)
        public view supplyExists(cropID)
        returns (
            uint transportCost,
            string memory receivedDate,
            string memory transferDate,
            address holder
        )
    {
        Supply memory s = supplies[cropID];

        return (
            s.transportCost,
            s.receivedDate,
            s.transferDate,
            s.currentHolder
        );
    }
}