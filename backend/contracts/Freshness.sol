// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Freshness {

    // =========================
    // STRUCT: VERIFIED SUMMARY
    // =========================

    struct FreshnessRecord {
        bytes32 cropID;

        // 🔗 HASH OF FULL DATA (IPFS/JSON)
        bytes32 dataHash;

        // 📊 SUMMARY VALUES (from IoT + ML)
        uint avgTemperature;
        uint avgHumidity;
        uint pesticideLevel;
        uint pH;

        uint VQI;              // ML output
        uint timestamp;
    }

    // =========================
    // STORAGE
    // =========================

    mapping(bytes32 => FreshnessRecord[]) public records;

    // =========================
    // EVENTS (Graph / frontend)
    // =========================

    event FreshnessStored(
        bytes32 indexed cropID,
        bytes32 dataHash,
        uint avgTemperature,
        uint avgHumidity,
        uint pesticideLevel,
        uint pH,
        uint VQI,
        uint timestamp
    );

    // =========================
    // STORE FRESHNESS DATA
    // =========================

    function storeFreshnessData(
        bytes32 cropID,
        bytes32 dataHash,
        uint avgTemperature,
        uint avgHumidity,
        uint pesticideLevel,
        uint pH,
        uint VQI
    ) public {

        records[cropID].push(
            FreshnessRecord({
                cropID: cropID,
                dataHash: dataHash,
                avgTemperature: avgTemperature,
                avgHumidity: avgHumidity,
                pesticideLevel: pesticideLevel,
                pH: pH,
                VQI: VQI,
                timestamp: block.timestamp
            })
        );

        emit FreshnessStored(
            cropID,
            dataHash,
            avgTemperature,
            avgHumidity,
            pesticideLevel,
            pH,
            VQI,
            block.timestamp
        );
    }

    // =========================
    // GET ALL RECORDS
    // =========================

    function getFreshnessRecords(bytes32 cropID)
        public view
        returns (FreshnessRecord[] memory)
    {
        return records[cropID];
    }

    // =========================
    // GET LATEST RECORD
    // =========================

    function getLatestFreshness(bytes32 cropID)
        public view
        returns (FreshnessRecord memory)
    {
        uint len = records[cropID].length;
        require(len > 0, "No freshness data");

        return records[cropID][len - 1];
    }
}