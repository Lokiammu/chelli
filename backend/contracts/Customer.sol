// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Registrable.sol";

abstract contract Customer is Registrable {

    // =========================
    // STORAGE
    // =========================

    mapping(address => bool) public customers;

    struct CustomerProfile { 
        string name; 
        string location; 
        string contact; 
    }

    mapping(address => CustomerProfile) public customerProfiles;

    struct Purchase {
        bytes32 cropID;
        bool purchased;
        string feedback;
        string purchaseDate;
        address buyer;
        bool exists;          // 🔵 ADDED
    }

    mapping(bytes32 => Purchase) public purchases;

    // =========================
    // MODIFIERS
    // =========================

    modifier onlyConsumer() { 
        require(customers[msg.sender], "Only customer"); 
        _; 
    }

    modifier purchaseExists(bytes32 cropID) {
        require(purchases[cropID].exists, "Purchase not found");
        _;
    }

    // =========================
    // EVENTS
    // =========================

    event CustomerRegistered(
        address indexed customer,
        string name
    );

    event CropPurchased(
        bytes32 indexed cropID,
        address indexed from,
        address indexed to,
        string purchaseDate,
        string feedback,
        uint timestamp
    );

    // =========================
    // REGISTER CUSTOMER
    // =========================

    function registerCustomer(
        string calldata name,
        string calldata location,
        string calldata contact
    ) external registerOnce {

        require(!customers[msg.sender], "Already registered");

        customers[msg.sender] = true;
        customerProfiles[msg.sender] = CustomerProfile(
            name,
            location,
            contact
        );

        emit CustomerRegistered(msg.sender, name);
    }

    // =========================
    // FINAL PURCHASE CONFIRMATION
    // =========================

    function consumerConfirmPurchase(
        bytes32 cropID,
        bool _purchased,
        string calldata _feedback,
        string calldata _date
    ) external onlyConsumer {

        require(!purchases[cropID].exists, "Already purchased");

        purchases[cropID] = Purchase({
            cropID: cropID,
            purchased: _purchased,
            feedback: _feedback,
            purchaseDate: _date,
            buyer: msg.sender,
            exists: true
        });

        emit CropPurchased(
            cropID,
            tx.origin,      // retailer (academic simplification)
            msg.sender,     // customer
            _date,
            _feedback,
            block.timestamp
        );
    }

    // =========================
    // VIEW FUNCTION (FRONTEND)
    // =========================

    function getPurchase(bytes32 cropID)
        public view purchaseExists(cropID)
        returns (
            bool purchased,
            string memory feedback,
            string memory purchaseDate,
            address buyer
        )
    {
        Purchase memory p = purchases[cropID];

        return (
            p.purchased,
            p.feedback,
            p.purchaseDate,
            p.buyer
        );
    }
}