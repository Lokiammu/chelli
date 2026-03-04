// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract Registrable {

    // =========================
    // GLOBAL ACCOUNT REGISTRY
    // =========================

    mapping(address => bool) public isAccountRegistered;

    modifier registerOnce() {
        require(!isAccountRegistered[msg.sender], "Account already registered");
        _;
        isAccountRegistered[msg.sender] = true;
    }

    // =========================
    // 🔵 GLOBAL SUPPLY-CHAIN EVENTS
    // (used by all child contracts)
    // =========================

    event CropReceived(
        bytes32 indexed cropID,
        address indexed from,
        address indexed to,
        uint cost,
        string date,
        uint timestamp
    );

    event CropTransferred(
        bytes32 indexed cropID,
        address indexed from,
        address indexed to,
        string transferDate,
        uint timestamp
    );
}