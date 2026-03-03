// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Registrable.sol";

abstract contract Farmer is Registrable {

    // =========================
    // STORAGE
    // =========================

    mapping(address => bool) public farmers;

    struct FarmerProfile { 
        string name; 
        string location; 
        string contact; 
    }

    mapping(address => FarmerProfile) public farmerProfiles;

    enum Stage { Created, Collected, Supplied, Aggregated, Divided, Sold, Bought }

    struct Crop {
        bytes32 cropID;
        string cropType;
        string origin;
        string date;
        uint price;
        Stage stage;
        address currentHolder;
        string transferDate;
        bool exists;              // 🔵 ADDED (important for blockchain safety)
    }

    mapping(bytes32 => Crop) public crops;
    mapping(uint => bytes32) public cropIDs;
    mapping(bytes32 => bool) public exists;  // keeps compatibility
    uint public cropCount;

    // =========================
    // MODIFIERS
    // =========================

    modifier onlyFarmer() { 
        require(farmers[msg.sender], "Only farmer"); 
        _; 
    }

    modifier cropExists(bytes32 cropID) {
        require(crops[cropID].exists, "Crop does not exist");
        _;
    }

    // =========================
    // EVENTS
    // =========================

    event FarmerRegistered(
        address indexed farmer,
        string name
    );

    event CropCollected(
        bytes32 indexed cropID,
        address indexed farmer,
        string cropType,
        string origin,
        uint price,
        uint timestamp
    );

    
    // =========================
    // FARMER REGISTRATION
    // =========================

    function registerFarmer(
        string calldata name,
        string calldata location,
        string calldata contact
    ) external registerOnce {

        require(!farmers[msg.sender], "Already registered");

        farmers[msg.sender] = true;
        farmerProfiles[msg.sender] = FarmerProfile(name, location, contact);

        emit FarmerRegistered(msg.sender, name);
    }

    // =========================
    // UNIQUE ID GENERATION
    // =========================

    function _generateUniqueCropID(uint seed) internal returns (bytes32) {
        bytes32 id = sha256(
            abi.encodePacked(seed, block.timestamp, msg.sender, cropCount)
        );

        cropIDs[cropCount] = id;
        cropCount++;

        return id;
    }

    function createUniqueCropID(uint seed) public onlyFarmer returns (bytes32) {
        return _generateUniqueCropID(seed);
    }

    // =========================
    // FARMER CREATES CROP
    // =========================

    function farmerCollectCrop(
        bytes32 cropID,
        string calldata cropType,
        string calldata origin,
        string calldata date,
        uint price
    ) external onlyFarmer {

        require(!crops[cropID].exists, "Crop exists");

        crops[cropID] = Crop({
            cropID: cropID,
            cropType: cropType,
            origin: origin,
            date: date,
            price: price,
            stage: Stage.Collected,
            currentHolder: msg.sender,
            transferDate: "",
            exists: true
        });

        exists[cropID] = true;

        emit CropCollected(
            cropID,
            msg.sender,
            cropType,
            origin,
            price,
            block.timestamp
        );
    }

    // =========================
    // TRANSFER TO SUPPLIER
    // =========================

    function farmerTransferToSupplier(
        bytes32 cropID,
        address supplier,
        string calldata transferDate
    ) external onlyFarmer cropExists(cropID) {

        require(crops[cropID].currentHolder == msg.sender, "Not holder");

        crops[cropID].currentHolder = supplier;
        crops[cropID].stage = Stage.Supplied;
        crops[cropID].transferDate = transferDate;

        emit CropTransferred(
            cropID,
            msg.sender,
            supplier,
            transferDate,
            block.timestamp
        );
    }

    // =========================
    // 🔍 VIEW FUNCTIONS (FOR FRONTEND)
    // =========================

    function getCrop(bytes32 cropID) public view cropExists(cropID)
        returns (
            string memory cropType,
            string memory origin,
            string memory date,
            uint price,
            string memory stage,
            address holder,
            string memory transferDate
        )
    {
        Crop memory c = crops[cropID];

        return (
            c.cropType,
            c.origin,
            c.date,
            c.price,
            stageToString(c.stage),
            c.currentHolder,
            c.transferDate
        );
    }

    function stageToString(Stage s) internal pure returns (string memory) {
        if (s == Stage.Created) return "Created";
        if (s == Stage.Collected) return "Collected";
        if (s == Stage.Supplied) return "Supplied";
        if (s == Stage.Aggregated) return "Aggregated";
        if (s == Stage.Divided) return "Divided";
        if (s == Stage.Sold) return "Sold";
        if (s == Stage.Bought) return "Bought";
        return "";
    }
}