// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/CrewAttestation.sol";

contract DeployCrewAttestation is Script {
    function run() external {
        address registry = vm.envAddress("REGISTRY_ADDRESS");

        vm.startBroadcast();
        CrewAttestation attestation = new CrewAttestation(registry);
        vm.stopBroadcast();

        console.log("CrewAttestation deployed at:", address(attestation));
        console.log("Registry set to:", registry);
    }
}
