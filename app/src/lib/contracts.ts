// Contract addresses — update after deployment
export const YACHT_REGISTRY_ADDRESS = "0xdEd817861eD9d2E5a8d0301C537E122a797C3EC9" as `0x${string}`;
export const CREW_ATTESTATION_ADDRESS = "0x408B8eb461E41070eEEE3c6d02E89500C94ce7c5" as `0x${string}`;

// ABIs will be imported from Foundry artifacts after compilation
// For now, minimal ABI fragments for the functions we call

export const yachtRegistryAbi = [
  {
    name: "getVessel",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "mmsi", type: "bytes32" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "mmsi", type: "bytes32" },
          { name: "ownerWallet", type: "address" },
          { name: "ownerNullifier", type: "bytes32" },
          { name: "registeredAt", type: "uint256" },
          { name: "active", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "isOwner",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "nullifier", type: "bytes32" },
      { name: "mmsi", type: "bytes32" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

export const crewAttestationAbi = [
  {
    name: "createAttestation",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "attesterNullifier", type: "bytes32" },
      { name: "subjectNullifier", type: "bytes32" },
      { name: "vesselMmsi", type: "bytes32" },
      { name: "role", type: "uint8" },
      { name: "rating", type: "uint8" },
      { name: "referenceText", type: "string" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "confirmAttestation",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recordId", type: "uint256" },
      { name: "callerNullifier", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "disputeAttestation",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recordId", type: "uint256" },
      { name: "callerNullifier", type: "bytes32" },
      { name: "reason", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "getCrewHistory",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "nullifier", type: "bytes32" }],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "id", type: "uint256" },
          { name: "attesterNullifier", type: "bytes32" },
          { name: "subjectNullifier", type: "bytes32" },
          { name: "vesselMmsi", type: "bytes32" },
          { name: "role", type: "uint8" },
          { name: "rating", type: "uint8" },
          { name: "referenceText", type: "string" },
          { name: "subjectConfirmed", type: "bool" },
          { name: "createdAt", type: "uint256" },
          { name: "confirmedAt", type: "uint256" },
          { name: "disputeNote", type: "string" },
          { name: "disputed", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "getCrewByRole",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "role", type: "uint8" },
      { name: "minRating", type: "uint8" },
    ],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "id", type: "uint256" },
          { name: "attesterNullifier", type: "bytes32" },
          { name: "subjectNullifier", type: "bytes32" },
          { name: "vesselMmsi", type: "bytes32" },
          { name: "role", type: "uint8" },
          { name: "rating", type: "uint8" },
          { name: "referenceText", type: "string" },
          { name: "subjectConfirmed", type: "bool" },
          { name: "createdAt", type: "uint256" },
          { name: "confirmedAt", type: "uint256" },
          { name: "disputeNote", type: "string" },
          { name: "disputed", type: "bool" },
        ],
      },
    ],
  },
] as const;
