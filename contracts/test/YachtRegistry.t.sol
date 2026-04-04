// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/YachtRegistry.sol";

contract YachtRegistryTest is Test {
    YachtRegistry registry;
    address forwarder = address(0xF01);
    address user = address(0xBEEF);

    bytes32 mmsi = bytes32("566093000");
    bytes32 nullifier = keccak256("world-id-nullifier-hash");

    function setUp() public {
        registry = new YachtRegistry(forwarder);
    }

    function test_registerVessel() public {
        vm.prank(forwarder);
        registry.registerVessel(mmsi, nullifier, user);

        YachtRegistry.Vessel memory v = registry.getVessel(mmsi);
        assertEq(v.mmsi, mmsi);
        assertEq(v.ownerWallet, user);
        assertEq(v.ownerNullifier, nullifier);
        assertEq(v.registeredAt, block.timestamp);
        assertTrue(v.active);
    }

    function test_revertOnlyForwarder() public {
        vm.expectRevert(YachtRegistry.OnlyForwarder.selector);
        registry.registerVessel(mmsi, nullifier, user);
    }

    function test_revertDuplicateNullifier() public {
        vm.startPrank(forwarder);
        registry.registerVessel(mmsi, nullifier, user);

        bytes32 mmsi2 = bytes32("987654321");
        vm.expectRevert(YachtRegistry.NullifierAlreadyRegistered.selector);
        registry.registerVessel(mmsi2, nullifier, user);
        vm.stopPrank();
    }

    function test_revertDuplicateVessel() public {
        vm.startPrank(forwarder);
        registry.registerVessel(mmsi, nullifier, user);

        bytes32 nullifier2 = keccak256("different-nullifier");
        vm.expectRevert(YachtRegistry.VesselAlreadyActive.selector);
        registry.registerVessel(mmsi, nullifier2, address(0xCAFE));
        vm.stopPrank();
    }

    function test_isOwner() public {
        vm.prank(forwarder);
        registry.registerVessel(mmsi, nullifier, user);

        assertTrue(registry.isOwner(nullifier, mmsi));
        assertFalse(registry.isOwner(keccak256("wrong"), mmsi));
    }

    function test_isOwnerFalseForUnregistered() public view {
        assertFalse(registry.isOwner(nullifier, mmsi));
    }

    function test_emitsVesselRegistered() public {
        vm.prank(forwarder);
        vm.expectEmit(true, true, false, false);
        emit YachtRegistry.VesselRegistered(mmsi, nullifier);
        registry.registerVessel(mmsi, nullifier, user);
    }

    function test_forwarderAddress() public view {
        assertEq(registry.forwarder(), forwarder);
    }
}
