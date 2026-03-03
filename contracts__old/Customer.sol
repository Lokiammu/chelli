// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract Customer {
    mapping(address => bool) public customers;

    struct CustomerProfile { string name; string location; string contact; }
    mapping(address => CustomerProfile) public customerProfiles;

    event CustomerRegistered(address customer, string name);
    event PurchaseConfirmed(bytes32 cropID, address buyer);

    struct Purchase {
        bytes32 cropID;
        bool purchased;
        string feedback;
        string purchaseDate;
        address buyer;
    }
    mapping(bytes32 => Purchase) public purchases;

    modifier onlyConsumer() { require(customers[msg.sender], "Only customer"); _; }

    function registerCustomer(string calldata name, string calldata location, string calldata contact) external {
        require(!customers[msg.sender], "Already registered");
        customers[msg.sender] = true;
        customerProfiles[msg.sender] = CustomerProfile(name, location, contact);
        emit CustomerRegistered(msg.sender, name);
    }

    function consumerConfirmPurchase(bytes32 cropID, bool _purchased, string calldata _feedback, string calldata _date) external onlyConsumer {
        purchases[cropID] = Purchase(cropID, _purchased, _feedback, _date, msg.sender);
        emit PurchaseConfirmed(cropID, msg.sender);
    }
}
