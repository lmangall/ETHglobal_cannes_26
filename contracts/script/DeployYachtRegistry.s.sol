// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/YachtRegistry.sol";

contract DeployYachtRegistry is Script {
    function run() external {
        // Use deployer as temporary forwarder — replace with CRE forwarder after CRE deployment
        address deployer = vm.envAddress("DEPLOYER_ADDRESS");
        address forwarder = vm.envOr("CRE_FORWARDER_ADDRESS", deployer);

        vm.startBroadcast();
        YachtRegistry registry = new YachtRegistry(forwarder);
        vm.stopBroadcast();

        console.log("YachtRegistry deployed at:", address(registry));
        console.log("Forwarder set to:", forwarder);
    }
}
