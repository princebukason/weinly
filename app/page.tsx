"use client";

import { useMemo, useState } from "react";
import { suppliers } from "@/lib/suppliers";
import { supabase } from "@/lib/supabase";

type FabricSpec = {
  fabric_type: string;
  intended_use: string;
  quality_level: string;
  color_or_pattern: string;
  weight_or_thickness: string;
  quantity: string;
  budget: string;
};

function show(v: any): string {
  if (v === null || v === undefined) return "Not specified";
  const s = String(v).trim();
  return s.length ? s : "Not specified";
}

function normalizeSpec(raw: any): FabricSpec {
  const r = raw ?? {};

  const fabric_type = show(
    r.fabric_type ?? r.fabricType ?? r.fabric ?? r.type ?? r.material
  );

  const intended_use = show(
    r.intended_use ?? r.intendedUse ?? r.use ?? r.application ?? r.purpose
  );

  const quality_level = show(
    r.quality_level ?? r.qualityLevel ?? r.quality ?? r.grade
  );

  const color_or_pattern = show(
    r.color_or_pattern ??
      r.colorOrPattern ??
      r.color ??
      r.pattern ??
      r.design
  );

  const weight_or_thickness = show(
    r.weight_or_thickness ??
      r.weightOrThickness ??
      r.weight ??
      r.thickness ??
      r.gsm
  );

  const quantity = show(r.quantity ?? r.qty ?? r.amount);

  const budget = show(r.budget ?? r.price ?? r.target_budget ?? r.targetBudget);

  return {
    fabric_type,
    intended_use,
    quality_level,
    color_or_pattern,
    weight_or_thickness,
    quantity,
    budget,
  };
}

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultRaw, setResultRaw] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const spec: FabricSpec | null = useMemo(() => {
    if (!resultRaw) return null;
    if (typeof resultRaw === "string") return normalizeSpec({});
    return normalizeSpec(resultRaw);
  }, [resultRaw]);

  function matchSupplier(fabricType: string) {
    const ft = (fabricType || "").toLowerCase();
    return suppliers.filter((s) =>
      ft.includes(String(s.specialization).toLowerCase())
    );
  }

  const matchedSuppliers = useMemo(() => {
    if (!spec) return [];
    return matchSupplier(spec.fabric_type);
  }, [spec]);

  async function submitRequest() {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Analyze API failed");
      }

      const aiResult = data?.result ?? data;
      setResultRaw(aiResult);

      try {
        await supabase.from("fabric_requests").insert({
          user_input: input,
          ai_output: aiResult,
        });
      } catch (e) {
        console.warn("Supabase insert failed (non-blocking):", e);
      }

      setInput("");
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function saveSpecificationPlaceholder() {
    alert("Saved for later (placeholder)");
  }

  function downloadPDFPlaceholder() {
    alert("Download PDF (placeholder). We'll connect real PDF next.");
  }

  return (
    <main
      style={{
        padding: 40,
        maxWidth: 720,
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>Weinly</h1>

      <p style={{ color: "#555", marginBottom: 18 }}>
        Describe your fabric. Get a professional specification instantly.
      </p>

      <p style={{ marginBottom: 10, color: "#555" }}>
        Tip: Include fabric type, use, color, quality, and budget if possible.
      </p>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={6}
        placeholder={`Describe the fabric you need.
Example: Lace for wedding gowns, premium quality, white, lightweight, for hot weather.`}
        style={{
          width: "100%",
          padding: 14,
          fontSize: 14,
          borderRadius: 6,
          border: "1px solid #ccc",
        }}
      />

      <div style={{ marginTop: 10 }}>
        <p style={{ fontWeight: "bold", marginBottom: 8 }}>Examples:</p>

        <p
          style={{ cursor: "pointer", color: "#4CAF50", margin: "6px 0" }}
          onClick={() =>
            setInput(
              "Lace fabric for wedding gowns, premium quality, white, lightweight"
            )
          }
        >
          Lace for wedding gowns (premium, white, lightweight)
        </p>

        <p
          style={{ cursor: "pointer", color: "#4CAF50", margin: "6px 0" }}
          onClick={() =>
            setInput(
              "Cotton fabric for men’s shirts, breathable, affordable, for hot weather"
            )
          }
        >
          Cotton for shirts (breathable, budget-friendly)
        </p>
      </div>

      <button
        onClick={submitRequest}
        disabled={loading}
        style={{
          backgroundColor: "#4CAF50",
          color: "white",
          padding: "12px 25px",
          marginTop: 14,
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 16,
        }}
      >
        {loading ? "Analyzing..." : "Analyze Fabric"}
      </button>

      {error && <p style={{ marginTop: 10, color: "crimson" }}>{error}</p>}

      {spec && (
        <div
          style={{
            marginTop: 30,
            padding: 22,
            border: "2px solid #4CAF50",
            borderRadius: 10,
            backgroundColor: "#f9fff9",
          }}
        >
          <p style={{ color: "green", fontWeight: "bold", marginBottom: 8 }}>
            ✔ Fabric identified successfully
          </p>

          <h3 style={{ marginTop: 0 }}>Fabric Specification</h3>

          <div style={{ lineHeight: 1.9 }}>
            <div>
              <strong>Fabric Type:</strong> {spec.fabric_type}
            </div>
            <div>
              <strong>Intended Use:</strong> {spec.intended_use}
            </div>
            <div>
              <strong>Quality Level:</strong> {spec.quality_level}
            </div>
            <div>
              <strong>Color / Pattern:</strong> {spec.color_or_pattern}
            </div>
            <div>
              <strong>Weight / Thickness:</strong> {spec.weight_or_thickness}
            </div>
            <div>
              <strong>Quantity:</strong> {spec.quantity}
            </div>
            <div>
              <strong>Budget:</strong> {spec.budget}
            </div>
          </div>

          <p style={{ marginTop: 10, fontStyle: "italic" }}>
            This specification is ready to be shared with verified suppliers.
          </p>

          <p style={{ color: "#4CAF50", fontWeight: "bold", marginTop: 8 }}>
            Confidence Level: High
          </p>

          <div
            style={{
              marginTop: 12,
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={saveSpecificationPlaceholder}
              style={{
                backgroundColor: "#2196F3",
                color: "white",
                padding: "8px 14px",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Save Specification
            </button>

            <button
              onClick={downloadPDFPlaceholder}
              style={{
                backgroundColor: "#555",
                color: "white",
                padding: "8px 14px",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Download PDF
            </button>
          </div>

          <h3 style={{ marginTop: 24 }}>Matched Suppliers</h3>

          {matchedSuppliers.length === 0 ? (
            <p style={{ color: "#666" }}>No verified suppliers matched yet.</p>
          ) : (
            matchedSuppliers.map((s) => (
              <div
                key={s.id}
                style={{
                  marginTop: 12,
                  padding: 14,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  background: "white",
                }}
              >
                <div style={{ fontWeight: "bold" }}>{s.name}</div>
                <div style={{ color: "#555", marginTop: 4 }}>
                  {s.specialization} • {s.location} • ⭐ {s.trust_score}
                </div>

                <div style={{ marginTop: 10 }}>
                  <button
                    onClick={() => alert(`Sample requested from ${s.name}`)}
                    style={{
                      backgroundColor: "#FF9800",
                      color: "white",
                      padding: "6px 12px",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Request Sample
                  </button>
                </div>
              </div>
            ))
          )}

          <p style={{ marginTop: 20, fontWeight: "bold", color: "#4CAF50" }}>
            ✔ Your fabric specification is ready and matched with trusted
            suppliers! You can now request samples or save this specification
            for later.
          </p>
        </div>
      )}
    </main>
  );
}