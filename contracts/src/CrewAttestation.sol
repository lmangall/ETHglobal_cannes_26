// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {YachtRegistry} from "./YachtRegistry.sol";

contract CrewAttestation {
    enum Role { CREW, CAPTAIN, OFFICER, CHEF, ENGINEER, STEWARD }

    struct WorkRecord {
        uint256 id;
        bytes32 attesterNullifier;
        bytes32 subjectNullifier;
        bytes32 vesselMmsi;
        Role role;
        uint8 rating;
        string referenceText;
        bool subjectConfirmed;
        uint256 createdAt;
        uint256 confirmedAt;
        string disputeNote;
        bool disputed;
    }

    YachtRegistry public registry;
    mapping(uint256 => WorkRecord) public records;
    mapping(bytes32 => uint256[]) public crewHistory;
    uint256 public nextId;

    event AttestationCreated(uint256 indexed id, bytes32 indexed attesterNullifier, bytes32 indexed subjectNullifier);
    event AttestationConfirmed(uint256 indexed id);
    event AttestationDisputed(uint256 indexed id);

    error NotAuthorized();
    error CannotAttestSelf();
    error InvalidRating();
    error NotSubject();
    error AlreadyConfirmed();
    error AlreadyDisputed();
    error NotParty();

    constructor(address _registry) {
        registry = YachtRegistry(_registry);
    }

    function createAttestation(
        bytes32 attesterNullifier,
        bytes32 subjectNullifier,
        bytes32 vesselMmsi,
        Role role,
        uint8 rating,
        string calldata referenceText
    ) external returns (uint256) {
        if (!_isAuthorized(attesterNullifier, vesselMmsi)) revert NotAuthorized();
        if (subjectNullifier == attesterNullifier) revert CannotAttestSelf();
        if (rating < 1 || rating > 5) revert InvalidRating();

        uint256 id = nextId++;
        records[id] = WorkRecord({
            id: id,
            attesterNullifier: attesterNullifier,
            subjectNullifier: subjectNullifier,
            vesselMmsi: vesselMmsi,
            role: role,
            rating: rating,
            referenceText: referenceText,
            subjectConfirmed: false,
            createdAt: block.timestamp,
            confirmedAt: 0,
            disputeNote: "",
            disputed: false
        });

        emit AttestationCreated(id, attesterNullifier, subjectNullifier);
        return id;
    }

    function confirmAttestation(uint256 recordId, bytes32 callerNullifier) external {
        WorkRecord storage r = records[recordId];
        if (callerNullifier != r.subjectNullifier) revert NotSubject();
        if (r.subjectConfirmed) revert AlreadyConfirmed();

        r.subjectConfirmed = true;
        r.confirmedAt = block.timestamp;
        crewHistory[callerNullifier].push(recordId);

        emit AttestationConfirmed(recordId);
    }

    function disputeAttestation(uint256 recordId, bytes32 callerNullifier, string calldata reason) external {
        WorkRecord storage r = records[recordId];
        if (callerNullifier != r.subjectNullifier && callerNullifier != r.attesterNullifier) revert NotParty();
        if (r.disputed) revert AlreadyDisputed();

        r.disputeNote = reason;
        r.disputed = true;

        emit AttestationDisputed(recordId);
    }

    function getCrewHistory(bytes32 nullifier) external view returns (WorkRecord[] memory) {
        uint256[] storage ids = crewHistory[nullifier];
        WorkRecord[] memory result = new WorkRecord[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = records[ids[i]];
        }
        return result;
    }

    function getCrewByRole(Role role, uint8 minRating) external view returns (WorkRecord[] memory) {
        // First pass: count matching records
        uint256 count;
        for (uint256 i = 0; i < nextId; i++) {
            WorkRecord storage r = records[i];
            if (r.subjectConfirmed && r.role == role && r.rating >= minRating && !r.disputed) {
                count++;
            }
        }

        // Second pass: populate results
        WorkRecord[] memory result = new WorkRecord[](count);
        uint256 idx;
        for (uint256 i = 0; i < nextId; i++) {
            WorkRecord storage r = records[i];
            if (r.subjectConfirmed && r.role == role && r.rating >= minRating && !r.disputed) {
                result[idx++] = r;
            }
        }
        return result;
    }

    /// @dev Returns true if nullifier is vessel owner OR a confirmed captain on the vessel
    function _isAuthorized(bytes32 nullifier, bytes32 vesselMmsi) internal view returns (bool) {
        // Check vessel ownership via YachtRegistry
        if (registry.isOwner(nullifier, vesselMmsi)) return true;

        // Check if nullifier is a confirmed captain on this vessel
        uint256[] storage ids = crewHistory[nullifier];
        for (uint256 i = 0; i < ids.length; i++) {
            WorkRecord storage r = records[ids[i]];
            if (
                r.vesselMmsi == vesselMmsi &&
                r.subjectNullifier == nullifier &&
                r.role == Role.CAPTAIN &&
                r.subjectConfirmed &&
                !r.disputed
            ) {
                return true;
            }
        }
        return false;
    }
}
