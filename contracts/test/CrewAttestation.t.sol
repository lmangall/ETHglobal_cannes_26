// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/YachtRegistry.sol";
import "../src/CrewAttestation.sol";

contract CrewAttestationTest is Test {
    YachtRegistry registry;
    CrewAttestation attestation;

    address forwarder = address(0xF01);
    address caller = address(0xBEEF);

    bytes32 mmsi = bytes32("566093000");
    bytes32 ownerNullifier = keccak256("owner-nullifier");
    bytes32 crewNullifier = keccak256("crew-nullifier");
    bytes32 captainNullifier = keccak256("captain-nullifier");
    bytes32 randomNullifier = keccak256("random-nullifier");

    function setUp() public {
        registry = new YachtRegistry(forwarder);
        attestation = new CrewAttestation(address(registry));

        // Register a vessel with ownerNullifier as owner
        vm.prank(forwarder);
        registry.registerVessel(mmsi, ownerNullifier, caller);
    }

    // --- createAttestation ---

    function test_createAttestation() public {
        uint256 id = attestation.createAttestation(
            ownerNullifier, crewNullifier, mmsi, CrewAttestation.Role.CREW, 4, "Good deckhand"
        );
        assertEq(id, 0);

        (
            uint256 rId,
            bytes32 attester,
            bytes32 subject,
            bytes32 vessel,
            CrewAttestation.Role role,
            uint8 rating,
            ,
            bool confirmed,
            uint256 createdAt,
            ,
            ,
            bool disputed
        ) = attestation.records(id);

        assertEq(rId, 0);
        assertEq(attester, ownerNullifier);
        assertEq(subject, crewNullifier);
        assertEq(vessel, mmsi);
        assertEq(uint8(role), uint8(CrewAttestation.Role.CREW));
        assertEq(rating, 4);
        assertFalse(confirmed);
        assertEq(createdAt, block.timestamp);
        assertFalse(disputed);
    }

    function test_createAttestationIncrementsId() public {
        uint256 id0 = attestation.createAttestation(
            ownerNullifier, crewNullifier, mmsi, CrewAttestation.Role.CREW, 3, "ref1"
        );
        uint256 id1 = attestation.createAttestation(
            ownerNullifier, randomNullifier, mmsi, CrewAttestation.Role.CHEF, 5, "ref2"
        );
        assertEq(id0, 0);
        assertEq(id1, 1);
        assertEq(attestation.nextId(), 2);
    }

    function test_createAttestationEmitsEvent() public {
        vm.expectEmit(true, true, true, false);
        emit CrewAttestation.AttestationCreated(0, ownerNullifier, crewNullifier);
        attestation.createAttestation(
            ownerNullifier, crewNullifier, mmsi, CrewAttestation.Role.CREW, 4, "Good"
        );
    }

    function test_revertNotAuthorized() public {
        vm.expectRevert(CrewAttestation.NotAuthorized.selector);
        attestation.createAttestation(
            randomNullifier, crewNullifier, mmsi, CrewAttestation.Role.CREW, 3, "ref"
        );
    }

    function test_revertCannotAttestSelf() public {
        vm.expectRevert(CrewAttestation.CannotAttestSelf.selector);
        attestation.createAttestation(
            ownerNullifier, ownerNullifier, mmsi, CrewAttestation.Role.CREW, 3, "ref"
        );
    }

    function test_revertInvalidRatingZero() public {
        vm.expectRevert(CrewAttestation.InvalidRating.selector);
        attestation.createAttestation(
            ownerNullifier, crewNullifier, mmsi, CrewAttestation.Role.CREW, 0, "ref"
        );
    }

    function test_revertInvalidRatingSix() public {
        vm.expectRevert(CrewAttestation.InvalidRating.selector);
        attestation.createAttestation(
            ownerNullifier, crewNullifier, mmsi, CrewAttestation.Role.CREW, 6, "ref"
        );
    }

    // --- Captain can attest ---

    function test_captainCanAttest() public {
        // Owner attests captain on this vessel
        uint256 captainRecordId = attestation.createAttestation(
            ownerNullifier, captainNullifier, mmsi, CrewAttestation.Role.CAPTAIN, 5, "Great captain"
        );

        // Captain confirms their attestation
        attestation.confirmAttestation(captainRecordId, captainNullifier);

        // Now the captain can attest crew on this vessel
        uint256 crewRecordId = attestation.createAttestation(
            captainNullifier, crewNullifier, mmsi, CrewAttestation.Role.CREW, 4, "Good crew"
        );
        assertEq(crewRecordId, 1);
    }

    function test_unconfirmedCaptainCannotAttest() public {
        // Owner attests captain but captain doesn't confirm
        attestation.createAttestation(
            ownerNullifier, captainNullifier, mmsi, CrewAttestation.Role.CAPTAIN, 5, "Great captain"
        );

        // Unconfirmed captain cannot attest
        vm.expectRevert(CrewAttestation.NotAuthorized.selector);
        attestation.createAttestation(
            captainNullifier, crewNullifier, mmsi, CrewAttestation.Role.CREW, 4, "ref"
        );
    }

    function test_disputedCaptainCannotAttest() public {
        // Owner attests captain, captain confirms
        uint256 captainRecordId = attestation.createAttestation(
            ownerNullifier, captainNullifier, mmsi, CrewAttestation.Role.CAPTAIN, 5, "Great"
        );
        attestation.confirmAttestation(captainRecordId, captainNullifier);

        // Dispute the captain attestation
        attestation.disputeAttestation(captainRecordId, ownerNullifier, "No longer captain");

        // Disputed captain cannot attest
        vm.expectRevert(CrewAttestation.NotAuthorized.selector);
        attestation.createAttestation(
            captainNullifier, crewNullifier, mmsi, CrewAttestation.Role.CREW, 4, "ref"
        );
    }

    // --- confirmAttestation ---

    function test_confirmAttestation() public {
        uint256 id = attestation.createAttestation(
            ownerNullifier, crewNullifier, mmsi, CrewAttestation.Role.CREW, 4, "Good"
        );

        attestation.confirmAttestation(id, crewNullifier);

        (,,,,,,, bool confirmed,, uint256 confirmedAt,,) = attestation.records(id);
        assertTrue(confirmed);
        assertEq(confirmedAt, block.timestamp);
    }

    function test_confirmAttestationEmitsEvent() public {
        uint256 id = attestation.createAttestation(
            ownerNullifier, crewNullifier, mmsi, CrewAttestation.Role.CREW, 4, "Good"
        );

        vm.expectEmit(true, false, false, false);
        emit CrewAttestation.AttestationConfirmed(id);
        attestation.confirmAttestation(id, crewNullifier);
    }

    function test_confirmAttestationAddsToCrewHistory() public {
        uint256 id = attestation.createAttestation(
            ownerNullifier, crewNullifier, mmsi, CrewAttestation.Role.CREW, 4, "Good"
        );

        attestation.confirmAttestation(id, crewNullifier);

        CrewAttestation.WorkRecord[] memory history = attestation.getCrewHistory(crewNullifier);
        assertEq(history.length, 1);
        assertEq(history[0].id, id);
    }

    function test_revertConfirmNotSubject() public {
        uint256 id = attestation.createAttestation(
            ownerNullifier, crewNullifier, mmsi, CrewAttestation.Role.CREW, 4, "Good"
        );

        vm.expectRevert(CrewAttestation.NotSubject.selector);
        attestation.confirmAttestation(id, ownerNullifier);
    }

    function test_revertConfirmAlreadyConfirmed() public {
        uint256 id = attestation.createAttestation(
            ownerNullifier, crewNullifier, mmsi, CrewAttestation.Role.CREW, 4, "Good"
        );
        attestation.confirmAttestation(id, crewNullifier);

        vm.expectRevert(CrewAttestation.AlreadyConfirmed.selector);
        attestation.confirmAttestation(id, crewNullifier);
    }

    // --- disputeAttestation ---

    function test_disputeBySubject() public {
        uint256 id = attestation.createAttestation(
            ownerNullifier, crewNullifier, mmsi, CrewAttestation.Role.CREW, 2, "Poor"
        );

        attestation.disputeAttestation(id, crewNullifier, "Unfair rating");

        (,,,,,,,,,, string memory note, bool disputed) = attestation.records(id);
        assertTrue(disputed);
        assertEq(note, "Unfair rating");
    }

    function test_disputeByAttester() public {
        uint256 id = attestation.createAttestation(
            ownerNullifier, crewNullifier, mmsi, CrewAttestation.Role.CREW, 4, "Good"
        );

        attestation.disputeAttestation(id, ownerNullifier, "Retracted");

        (,,,,,,,,,,, bool disputed) = attestation.records(id);
        assertTrue(disputed);
    }

    function test_disputeEmitsEvent() public {
        uint256 id = attestation.createAttestation(
            ownerNullifier, crewNullifier, mmsi, CrewAttestation.Role.CREW, 4, "Good"
        );

        vm.expectEmit(true, false, false, false);
        emit CrewAttestation.AttestationDisputed(id);
        attestation.disputeAttestation(id, crewNullifier, "reason");
    }

    function test_revertDisputeNotParty() public {
        uint256 id = attestation.createAttestation(
            ownerNullifier, crewNullifier, mmsi, CrewAttestation.Role.CREW, 4, "Good"
        );

        vm.expectRevert(CrewAttestation.NotParty.selector);
        attestation.disputeAttestation(id, randomNullifier, "hack");
    }

    function test_revertDisputeAlreadyDisputed() public {
        uint256 id = attestation.createAttestation(
            ownerNullifier, crewNullifier, mmsi, CrewAttestation.Role.CREW, 4, "Good"
        );
        attestation.disputeAttestation(id, crewNullifier, "first");

        vm.expectRevert(CrewAttestation.AlreadyDisputed.selector);
        attestation.disputeAttestation(id, ownerNullifier, "second");
    }

    // --- getCrewHistory ---

    function test_getCrewHistoryEmpty() public view {
        CrewAttestation.WorkRecord[] memory history = attestation.getCrewHistory(crewNullifier);
        assertEq(history.length, 0);
    }

    function test_getCrewHistoryMultiple() public {
        bytes32 mmsi2 = bytes32("987654321");
        bytes32 owner2 = keccak256("owner2");
        vm.prank(forwarder);
        registry.registerVessel(mmsi2, owner2, address(0xCAFE));

        uint256 id0 = attestation.createAttestation(
            ownerNullifier, crewNullifier, mmsi, CrewAttestation.Role.CREW, 4, "ref1"
        );
        uint256 id1 = attestation.createAttestation(
            owner2, crewNullifier, mmsi2, CrewAttestation.Role.CHEF, 5, "ref2"
        );

        attestation.confirmAttestation(id0, crewNullifier);
        attestation.confirmAttestation(id1, crewNullifier);

        CrewAttestation.WorkRecord[] memory history = attestation.getCrewHistory(crewNullifier);
        assertEq(history.length, 2);
        assertEq(history[0].id, id0);
        assertEq(history[1].id, id1);
    }

    // --- getCrewByRole ---

    function test_getCrewByRole() public {
        // Create and confirm two crew attestations with different ratings
        uint256 id0 = attestation.createAttestation(
            ownerNullifier, crewNullifier, mmsi, CrewAttestation.Role.CREW, 4, "Good"
        );
        uint256 id1 = attestation.createAttestation(
            ownerNullifier, randomNullifier, mmsi, CrewAttestation.Role.CREW, 2, "Okay"
        );

        attestation.confirmAttestation(id0, crewNullifier);
        attestation.confirmAttestation(id1, randomNullifier);

        // Filter by minRating 3 — should only return the first
        CrewAttestation.WorkRecord[] memory result = attestation.getCrewByRole(
            CrewAttestation.Role.CREW, 3
        );
        assertEq(result.length, 1);
        assertEq(result[0].id, id0);
    }

    function test_getCrewByRoleExcludesUnconfirmed() public {
        attestation.createAttestation(
            ownerNullifier, crewNullifier, mmsi, CrewAttestation.Role.CREW, 5, "Great"
        );

        CrewAttestation.WorkRecord[] memory result = attestation.getCrewByRole(
            CrewAttestation.Role.CREW, 1
        );
        assertEq(result.length, 0);
    }

    function test_getCrewByRoleExcludesDisputed() public {
        uint256 id = attestation.createAttestation(
            ownerNullifier, crewNullifier, mmsi, CrewAttestation.Role.CREW, 5, "Great"
        );
        attestation.confirmAttestation(id, crewNullifier);
        attestation.disputeAttestation(id, crewNullifier, "nope");

        CrewAttestation.WorkRecord[] memory result = attestation.getCrewByRole(
            CrewAttestation.Role.CREW, 1
        );
        assertEq(result.length, 0);
    }

    function test_getCrewByRoleFiltersByRole() public {
        uint256 id0 = attestation.createAttestation(
            ownerNullifier, crewNullifier, mmsi, CrewAttestation.Role.CREW, 5, "Crew"
        );
        uint256 id1 = attestation.createAttestation(
            ownerNullifier, randomNullifier, mmsi, CrewAttestation.Role.CHEF, 5, "Chef"
        );

        attestation.confirmAttestation(id0, crewNullifier);
        attestation.confirmAttestation(id1, randomNullifier);

        CrewAttestation.WorkRecord[] memory crews = attestation.getCrewByRole(
            CrewAttestation.Role.CREW, 1
        );
        assertEq(crews.length, 1);
        assertEq(uint8(crews[0].role), uint8(CrewAttestation.Role.CREW));

        CrewAttestation.WorkRecord[] memory chefs = attestation.getCrewByRole(
            CrewAttestation.Role.CHEF, 1
        );
        assertEq(chefs.length, 1);
        assertEq(uint8(chefs[0].role), uint8(CrewAttestation.Role.CHEF));
    }

    // --- registry reference ---

    function test_registryAddress() public view {
        assertEq(address(attestation.registry()), address(registry));
    }
}
