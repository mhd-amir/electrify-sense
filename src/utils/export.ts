import type { GridState, Sample } from "@/types/grid";
import { nf } from "@/utils/format";

const COLUMNS: { key: keyof Sample; label: string; digits: number }[] = [
  { key: "demandMw", label: "Demand (MW)", digits: 0 },
  { key: "generationMw", label: "Generation (MW)", digits: 0 },
  { key: "reservesMw", label: "Reserves (MW)", digits: 0 },
  { key: "frequencyHz", label: "Frequency (Hz)", digits: 3 },
  { key: "voltageKv", label: "Bus voltage (kV)", digits: 1 },
  { key: "renewablePct", label: "Renewable (%)", digits: 1 },
  { key: "batterySocPct", label: "Battery SoC (%)", digits: 1 },
  { key: "evLoadMw", label: "EV load (MW)", digits: 0 },
  { key: "lossMw", label: "Losses (MW)", digits: 1 },
  { key: "carbonTph", label: "Carbon (t/h)", digits: 2 },
  { key: "stability", label: "Stability (%)", digits: 1 },
  { key: "healthScore", label: "Health (%)", digits: 1 },
  { key: "aiConfidence", label: "AI confidence (%)", digits: 0 },
];

const stamp = (ms: number) => new Date(ms).toISOString().replace("T", " ").slice(0, 19);
const fileStamp = () => new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export the rolling analytics history (up to 100 samples) as CSV. */
export function exportHistoryCsv(state: GridState) {
  const rows: string[] = [
    ["Sample timestamp (UTC)", ...COLUMNS.map((c) => c.label)].join(","),
    ...state.history.map((s, i) =>
      [stamp(s.t), ...COLUMNS.map((c) => (s[c.key] as number).toFixed(c.digits))].join(",") + (i === -1 ? "" : ""),
    ),
  ];
  const meta = [
    `# GridTwin analytics export`,
    `# Exported at,${stamp(Date.now())}`,
    `# Samples,${state.history.length}`,
    `# Scenario,${state.scenario}`,
    `# Simulation clock,${stamp(state.clock)}`,
  ];
  download(new Blob([[...meta, ...rows].join("\n")], { type: "text/csv;charset=utf-8" }), `gridtwin-analytics-${fileStamp()}.csv`);
}

/** Export a summary + tabular report of the rolling analytics history as PDF. */
export async function exportHistoryPdf(state: GridState) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const samples = state.history;
  const avg = (k: keyof Sample) => samples.reduce((a, s) => a + (s[k] as number), 0) / Math.max(1, samples.length);
  const peak = (k: keyof Sample) => Math.max(...samples.map((s) => s[k] as number));

  doc.setFillColor(5, 8, 22);
  doc.rect(0, 0, w, h, "F");
  doc.setTextColor(120, 200, 255);
  doc.setFontSize(18);
  doc.text("GridTwin — National Grid Analytics Report", 40, 46);
  doc.setFontSize(9);
  doc.setTextColor(170, 190, 220);
  doc.text(
    `Generated ${stamp(Date.now())} UTC   ·   Simulation clock ${stamp(state.clock)}   ·   Scenario: ${state.scenario}   ·   ${samples.length} samples`,
    40,
    64,
  );

  const summary: [string, string][] = [
    ["Average demand", `${nf(avg("demandMw"))} MW`],
    ["Peak demand", `${nf(peak("demandMw"))} MW`],
    ["Average generation", `${nf(avg("generationMw"))} MW`],
    ["Average frequency", `${avg("frequencyHz").toFixed(3)} Hz`],
    ["Average renewable share", `${avg("renewablePct").toFixed(1)} %`],
    ["Average stability", `${avg("stability").toFixed(1)} %`],
    ["Average losses", `${avg("lossMw").toFixed(1)} MW`],
    ["Average carbon", `${avg("carbonTph").toFixed(2)} t/h`],
  ];
  let sx = 40;
  summary.forEach(([label, value], i) => {
    const x = sx + (i % 4) * 190;
    const y = 92 + Math.floor(i / 4) * 44;
    doc.setDrawColor(40, 60, 96);
    doc.setFillColor(14, 22, 40);
    doc.roundedRect(x, y, 178, 34, 5, 5, "FD");
    doc.setFontSize(7);
    doc.setTextColor(150, 170, 200);
    doc.text(label.toUpperCase(), x + 8, y + 13);
    doc.setFontSize(11);
    doc.setTextColor(235, 244, 255);
    doc.text(value, x + 8, y + 27);
  });

  // table
  const cols = ["Timestamp (UTC)", ...COLUMNS.map((c) => c.label)];
  const colW = [104, ...COLUMNS.map(() => (w - 80 - 104) / COLUMNS.length)];
  let y = 196;
  const header = () => {
    doc.setFillColor(20, 32, 54);
    doc.rect(40, y - 12, w - 80, 16, "F");
    doc.setFontSize(6.5);
    doc.setTextColor(150, 200, 255);
    let x = 44;
    cols.forEach((c, i) => {
      doc.text(c, x, y);
      x += colW[i] as number;
    });
    y += 14;
  };
  header();
  doc.setTextColor(220, 232, 250);
  samples.forEach((s, r) => {
    if (y > h - 40) {
      doc.addPage();
      doc.setFillColor(5, 8, 22);
      doc.rect(0, 0, w, h, "F");
      y = 50;
      header();
      doc.setTextColor(220, 232, 250);
    }
    if (r % 2 === 0) {
      doc.setFillColor(11, 18, 33);
      doc.rect(40, y - 8, w - 80, 11, "F");
    }
    doc.setFontSize(6.5);
    let x = 44;
    [stamp(s.t), ...COLUMNS.map((c) => (s[c.key] as number).toFixed(c.digits))].forEach((cell, i) => {
      doc.text(String(cell), x, y);
      x += colW[i] as number;
    });
    y += 11;
  });

  doc.save(`gridtwin-analytics-${fileStamp()}.pdf`);
}