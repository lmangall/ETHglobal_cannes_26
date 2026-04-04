// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract YachtRegistry {
    struct Vessel {
        bytes32 mmsi;
        address ownerWallet;
        bytes32 ownerNullifier;
        uint256 registeredAt;
        bool active;
    }

    address public forwarder;
    mapping(bytes32 => Vessel) public vessels;
    mapping(bytes32 => bool) public nullifierRegistered;

    event VesselRegistered(bytes32 indexed mmsi, bytes32 indexed ownerNullifier);

    error OnlyForwarder();
    error NullifierAlreadyRegistered();
    error VesselAlreadyActive();

    constructor(address _forwarder) {
        forwarder = _forwarder;
    }

    function registerVessel(
        bytes32 mmsi,
        bytes32 ownerNullifier,
        address ownerWallet
    ) external {
        if (msg.sender != forwarder) revert OnlyForwarder();
        if (nullifierRegistered[ownerNullifier]) revert NullifierAlreadyRegistered();
        if (vessels[mmsi].active) revert VesselAlreadyActive();

        vessels[mmsi] = Vessel({
            mmsi: mmsi,
            ownerWallet: ownerWallet,
            ownerNullifier: ownerNullifier,
            registeredAt: block.timestamp,
            active: true
        });
        nullifierRegistered[ownerNullifier] = true;

        emit VesselRegistered(mmsi, ownerNullifier);
    }

    function getVessel(bytes32 mmsi) external view returns (Vessel memory) {
        return vessels[mmsi];
    }

    function isOwner(bytes32 nullifier, bytes32 mmsi) external view returns (bool) {
        Vessel storage v = vessels[mmsi];
        return v.active && v.ownerNullifier == nullifier;
    }
}
