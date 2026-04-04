"use client";

import { useState } from "react";
import { WorldIDButton } from "./WorldIDButton";

const ROLES = ["CREW", "CAPTAIN", "OFFICER", "CHEF", "ENGINEER", "STEWARD"] as const;

type Tab = "create" | "confirm" | "dispute";

export function AttestationFlow() {
  const [tab, setTab] = useState<Tab>("create");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [subjectNullifier, setSubjectNullifier] = useState("");
  const [vesselMmsi, setVesselMmsi] = useState("");
  const [role, setRole] = useState<number>(0);
  const [rating, setRating] = useState<number>(4);
  const [referenceText, setReferenceText] = useState("");

  // Confirm/Dispute form state
  const [recordId, setRecordId] = useState("");
  const [disputeReason, setDisputeReason] = useState("");

  function handleVerified() {
    setVerified(true);
  }

  async function handleCreate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/create-attestation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_nullifier: subjectNullifier,
          vessel_mmsi: vesselMmsi,
          role: ROLES[role],
          rating,
          reference_text: referenceText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(`Attestation created! TX: ${data.tx_hash}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create attestation");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/confirm-attestation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record_id: Number(recordId) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(`Attestation confirmed! TX: ${data.tx_hash}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm attestation");
    } finally {
      setLoading(false);
    }
  }

  async function handleDispute() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/dispute-attestation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          record_id: Number(recordId),
          reason: disputeReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(`Attestation disputed! TX: ${data.tx_hash}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to dispute attestation");
    } finally {
      setLoading(false);
    }
  }

  if (!verified) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Crew Attestation</h2>
        <p className="text-gray-600">Verify your identity to create or manage attestations.</p>
        <WorldIDButton action="crew-attestation" onVerified={handleVerified} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Crew Attestation</h2>

      {/* Tab selector */}
      <div className="flex gap-2">
        {(["create", "confirm", "dispute"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(null); setResult(null); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
              tab === t ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Create tab */}
      {tab === "create" && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Subject Nullifier Hash"
            value={subjectNullifier}
            onChange={(e) => setSubjectNullifier(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
          <input
            type="text"
            placeholder="Vessel MMSI"
            value={vesselMmsi}
            onChange={(e) => setVesselMmsi(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
          <select
            value={role}
            onChange={(e) => setRole(Number(e.target.value))}
            className="w-full rounded border px-3 py-2"
          >
            {ROLES.map((r, i) => (
              <option key={r} value={i}>{r}</option>
            ))}
          </select>
          <div>
            <label className="text-sm text-gray-600">Rating: {rating}/5</label>
            <input
              type="range"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <textarea
            placeholder="Reference / review text"
            value={referenceText}
            onChange={(e) => setReferenceText(e.target.value)}
            className="w-full rounded border px-3 py-2"
            rows={3}
          />
          <button
            onClick={handleCreate}
            disabled={loading || !subjectNullifier || !vesselMmsi}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Create Attestation"}
          </button>
        </div>
      )}

      {/* Confirm tab */}
      {tab === "confirm" && (
        <div className="space-y-3">
          <input
            type="number"
            placeholder="Record ID"
            value={recordId}
            onChange={(e) => setRecordId(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
          <button
            onClick={handleConfirm}
            disabled={loading || !recordId}
            className="rounded-lg bg-green-600 px-6 py-3 text-white font-medium disabled:opacity-50"
          >
            {loading ? "Confirming..." : "Confirm Attestation"}
          </button>
        </div>
      )}

      {/* Dispute tab */}
      {tab === "dispute" && (
        <div className="space-y-3">
          <input
            type="number"
            placeholder="Record ID"
            value={recordId}
            onChange={(e) => setRecordId(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
          <textarea
            placeholder="Reason for dispute"
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            className="w-full rounded border px-3 py-2"
            rows={3}
          />
          <button
            onClick={handleDispute}
            disabled={loading || !recordId || !disputeReason}
            className="rounded-lg bg-red-600 px-6 py-3 text-white font-medium disabled:opacity-50"
          >
            {loading ? "Disputing..." : "Dispute Attestation"}
          </button>
        </div>
      )}

      {result && <p className="text-sm text-green-600">{result}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
