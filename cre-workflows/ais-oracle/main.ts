/**
 * CRE Workflow: AIS Oracle for Vessel Registration
 *
 * HTTP trigger → Confidential HTTP GET (Datalastic API) → EVM write to YachtRegistry
 * Runs on Chainlink DON, compiled to WASM via cre-compile.
 */

import {
  cre,
  HTTPCapability,
  ConfidentialHTTPClient,
  EVMClient,
  type Runtime,
  type HTTPPayload,
  type WriteCreReportRequestJson,
  ok,
  json,
  prepareReportRequest,
  Runner,
} from "@chainlink/cre-sdk";
import { encodeFunctionData, pad, toHex, type Hex, type Address } from "viem";

// --- Types ---

interface RegisterVesselInput {
  mmsi: string;
  owner_nullifier: string;
  owner_wallet: string;
}

interface WorkflowResult {
  success: boolean;
  mmsi: string;
  error: string;
}

// --- Constants ---

// World Chain Sepolia chain selector for CRE
const WORLD_CHAIN_SELECTOR =
  EVMClient.SUPPORTED_CHAIN_SELECTORS["ethereum-testnet-sepolia-worldchain-1"];

// YachtRegistry deployed on World Chain Sepolia
const YACHT_REGISTRY_ADDRESS: Address =
  "0xdEd817861eD9d2E5a8d0301C537E122a797C3EC9";

// ABI fragment for registerVessel
const REGISTER_VESSEL_ABI = [
  {
    type: "function",
    name: "registerVessel",
    inputs: [
      { name: "mmsi", type: "bytes32" },
      { name: "ownerNullifier", type: "bytes32" },
      { name: "ownerWallet", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

// --- Workflow handler ---

const onRegisterVessel = (
  runtime: Runtime<Uint8Array>,
  payload: HTTPPayload
): WorkflowResult => {
  // 1. Parse trigger input
  const decoder = new TextDecoder();
  const inputJson = decoder.decode(payload.input);
  const input: RegisterVesselInput = JSON.parse(inputJson);

  runtime.log(
    `Vessel registration request: mmsi=${input.mmsi}, nullifier=${input.owner_nullifier}`
  );

  // 2. Confidential HTTP GET — verify vessel exists via Datalastic API
  const confidentialHttp = new ConfidentialHTTPClient();
  const aisResponse = confidentialHttp
    .sendRequest(runtime, {
      vaultDonSecrets: [{ key: "AIS_API_KEY" }],
      request: {
        url: `https://api.datalastic.com/api/v0/vessel?api-key={{.AIS_API_KEY}}&mmsi=${input.mmsi}`,
        method: "GET",
        timeout: "10s",
      },
    })
    .result();

  if (!ok(aisResponse)) {
    runtime.log(`Datalastic API returned status ${aisResponse.statusCode}`);
    return { success: false, mmsi: input.mmsi, error: "vessel_not_found" };
  }

  const vesselData = json(aisResponse) as {
    data?: { mmsi?: string };
    meta?: { success?: boolean };
  };
  if (!vesselData.meta?.success || !vesselData.data?.mmsi) {
    runtime.log("Vessel not found in Datalastic response");
    return { success: false, mmsi: input.mmsi, error: "vessel_not_found" };
  }

  runtime.log(`Vessel verified: ${vesselData.data.mmsi}`);

  // 3. ABI-encode registerVessel call
  const mmsiBytes32 = pad(toHex(input.mmsi), { size: 32 });
  const nullifierBytes32 = input.owner_nullifier.startsWith("0x")
    ? (input.owner_nullifier as Hex)
    : pad(toHex(input.owner_nullifier), { size: 32 });
  const ownerWallet = input.owner_wallet as Address;

  const calldata = encodeFunctionData({
    abi: REGISTER_VESSEL_ABI,
    functionName: "registerVessel",
    args: [mmsiBytes32, nullifierBytes32, ownerWallet],
  });

  // 4. Create signed report
  const reportRequest = prepareReportRequest(calldata as Hex);
  const report = runtime.report(reportRequest).result();

  // 5. Write report to World Chain → YachtRegistry
  const evmClient = new EVMClient(WORLD_CHAIN_SELECTOR);
  const writeRequest: WriteCreReportRequestJson = {
    receiver: YACHT_REGISTRY_ADDRESS,
    report,
  };
  evmClient.writeReport(runtime, writeRequest).result();

  runtime.log(`Vessel ${input.mmsi} registration submitted to World Chain`);

  return { success: true, mmsi: input.mmsi, error: "" };
};

// --- Workflow definition ---

const initWorkflow = () => {
  const httpTrigger = new HTTPCapability();

  return [
    cre.handler(
      httpTrigger.trigger({
        authorizedKeys: [],
      }),
      onRegisterVessel
    ),
  ];
};

// --- Entry point ---

export async function main() {
  const runner = await Runner.newRunner<Uint8Array>({
    configParser: (c) => c,
  });
  await runner.run(initWorkflow);
}

await main();
