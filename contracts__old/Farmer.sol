// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract Farmer {
    mapping(address => bool) public farmers;

    struct FarmerProfile { string name; string location; string contact; }
    mapping(address => FarmerProfile) public farmerProfiles;

    event FarmerRegistered(address farmer, string name);
    event CropCollected(bytes32 cropID, string cropType, uint price);
    event TransferredToSupplier(bytes32 cropID, address supplier, string date);

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
    }

    mapping(bytes32 => Crop) public crops;
    mapping(uint => bytes32) public cropIDs;
    mapping(bytes32 => bool) public exists;
    uint public cropCount;

    modifier onlyFarmer() { require(farmers[msg.sender], "Only farmer"); _; }

    function registerFarmer(string calldata name, string calldata location, string calldata contact) external {
        require(!farmers[msg.sender], "Already registered");
        farmers[msg.sender] = true;
        farmerProfiles[msg.sender] = FarmerProfile(name, location, contact);
        emit FarmerRegistered(msg.sender, name);
    }

    function _generateUniqueCropID(uint seed) internal returns (bytes32) {
        bytes32 id = sha256(abi.encodePacked(seed, block.timestamp, msg.sender, cropCount));
        cropIDs[cropCount] = id;
        cropCount++;
        return id;
    }

    function createUniqueCropID(uint seed) public onlyFarmer returns (bytes32) {
        return _generateUniqueCropID(seed);
    }

    function farmerCollectCrop(bytes32 cropID, string calldata cropType, string calldata origin, string calldata date, uint price) external onlyFarmer {
        require(!exists[cropID], "Crop exists");
        crops[cropID] = Crop(cropID, cropType, origin, date, price, Stage.Collected, msg.sender, "");
        exists[cropID] = true;
        emit CropCollected(cropID, cropType, price);
    }

    function farmerTransferToSupplier(bytes32 cropID, address supplier, string calldata transferDate) external onlyFarmer {
        require(exists[cropID], "Unknown crop");
        require(crops[cropID].currentHolder == msg.sender, "Not holder");
        crops[cropID].currentHolder = supplier;
        crops[cropID].stage = Stage.Supplied;
        crops[cropID].transferDate = transferDate;
        emit TransferredToSupplier(cropID, supplier, transferDate);
    }
}
