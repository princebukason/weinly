"use client";

import { useState } from "react";
import { suppliers } from "@/lib/suppliers";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitRequest() {
    if (!input) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data.result);

      // Save to Supabase (safe even if table is empty later)
      await supabase.from("fabric_requests").insert({
        user_input: input,
        ai_output: data.result,
      });

      setInput("");
    } catch (err: any) {
      console.error(err);
      setError("AI is currently unavailable. You can still review suppliers.");
    } finally {
      setLoading(false);
    }
  }

  function matchSupplier(fabricType: string) {
    return suppliers.filter((s) =>
      fabricType?.toLowerCase().includes(s.specialization)
    );
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
      <h1 style={{ fontSize: 32 }}>Weinly</h1>
      <p style={{ color: "#555", marginBottom: 20 }}>
        Describe the fabric you’re sourcing. Weinly converts it into a
        manufacturer-ready specification and matches verified suppliers.
      </p>

      {/* INPUT */}
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={6}
        placeholder="Example: I need breathable cotton fabric for men’s shirts, affordable, suitable for hot weather in Nigeria. I want to start with samples."
        style={{
          width: "100%",
          padding: 14,
          fontSize: 14,
          borderRadius: 6,
          border: "1px solid #ccc",
        }}
      />

      {/* CTA BUTTON */}
      <button
        onClick={submitRequest}
        disabled={loading}
        style={{
          backgroundColor: "#4CAF50",
          color: "white",
          padding: "12px 25px",
          marginTop: 15,
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 16,
        }}
      >
        {loading ? "Analyzing..." : "Analyze Fabric"}
      </button>

      {error && (
        <p style={{ color: "red", marginTop: 10 }}>{error}</p>
      )}

      {/* RESULT */}
      {result && (
        <div
          style={{
            marginTop: 40,
            padding: 25,
            border: "2px solid #4CAF50",
            borderRadius: 10,
            backgroundColor: "#f9fff9",
          }}
        >
          <p style={{ color: "green", fontWeight: "bold" }}>
            ✔ Fabric identified successfully
          </p>

          <h3>Fabric Specification</h3>

          <ul style={{ lineHeight: "1.8" }}>
            <li><strong>Fabric Type:</strong> {result.fabric_type}</li>
            <li><strong>Intended Use:</strong> {result.intended_use}</li>
            <li><strong>Quality Level:</strong> {result.quality_level}</li>
            <li><strong>Color / Pattern:</strong> {result.color_or_pattern}</li>
            <li><strong>Weight / Thickness:</strong> {result.weight_or_thickness}</li>
            <li><strong>Quantity:</strong> {result.quantity}</li>
            <li><strong>Budget:</strong> {result.budget}</li>
          </ul>

          <p style={{ marginTop: 10, fontStyle: "italic" }}>
            This specification is ready to be shared with verified suppliers.
          </p>

          {/* ACTIONS */}
          <div style={{ marginTop: 15 }}>
            <button
              onClick={() => alert("Specification saved (placeholder)")}
              style={{
                backgroundColor: "#2196F3",
                color: "white",
                padding: "8px 15px",
                border: "none",
                borderRadius: 5,
                cursor: "pointer",
                marginRight: 10,
              }}
            >
              Save Specification
            </button>

            <button
              onClick={() => alert("PDF download coming soon")}
              style={{
                backgroundColor: "#555",
                color: "white",
                padding: "8px 15px",
                border: "none",
                borderRadius: 5,
                cursor: "pointer",
              }}
            >
              Download PDF
            </button>
          </div>

          {/* SUPPLIERS */}
          <h3 style={{ marginTop: 30 }}>Matched Suppliers</h3>

          {matchSupplier(result.fabric_type).length === 0 && (
            <p>No verified suppliers matched yet.</p>
          )}

          {matchSupplier(result.fabric_type).map((s) => (
            <div
              key={s.id}
              style={{
                marginTop: 15,
                padding: 15,
                border: "1px solid #ddd",
                borderRadius: 8,
              }}
            >
              <h4>{s.name}</h4>
              <p>📍 {s.location}</p>
              <p>⭐ Trust Score: {s.trust_score}</p>

              <button
                onClick={() =>
                  alert(`Sample requested from ${s.name}`)
                }
                style={{
                  backgroundColor: "#FF9800",
                  color: "white",
                  padding: "6px 12px",
                  border: "none",
                  borderRadius: 5,
                  cursor: "pointer",
                }}
              >
                Request Sample
              </button>
            </div>
          ))}

          <p style={{ marginTop: 20, fontWeight: "bold", color: "#4CAF50" }}>
            ✔ Your fabric specification is ready and matched with trusted suppliers.
          </p>
        </div>
      )}
    </main>
  );
}
