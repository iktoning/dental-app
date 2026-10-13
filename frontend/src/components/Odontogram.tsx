import { useState } from "react";

type ToothData = {
  tooth_number: string;
  overall: {
    id: string;
    condition: string;
    notes: string | null;
    recorded_at: string;
  } | null;
  surfaces: Record<
    string,
    {
      id: string;
      condition: string;
      notes: string | null;
      recorded_at: string;
    }
  >;
};

// Warna per kondisi
const CONDITION_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  healthy: { bg: "bg-white", text: "text-gray-700", label: "Sehat" },
  caries: { bg: "bg-red-500", text: "text-white", label: "Karies" },
  filled: { bg: "bg-blue-500", text: "text-white", label: "Tambalan" },
  crown: { bg: "bg-yellow-500", text: "text-white", label: "Mahkota" },
  extracted: { bg: "bg-gray-800", text: "text-white", label: "Dicabut" },
  missing: { bg: "bg-gray-300", text: "text-gray-500", label: "Hilang" },
  root_canal: {
    bg: "bg-purple-500",
    text: "text-white",
    label: "Saluran Akar",
  },
  implant: { bg: "bg-green-500", text: "text-white", label: "Implan" },
  fractured: { bg: "bg-orange-500", text: "text-white", label: "Retak" },
};

// Susunan gigi (FDI):
//        KANAN ATAS          |          KIRI ATAS
//   18 17 16 15 14 13 12 11 | 21 22 23 24 25 26 27 28
//   48 47 46 45 44 43 42 41 | 31 32 33 34 35 36 37 38
//        KANAN BAWAH         |          KIRI BAWAH
const UPPER_RIGHT = ["18", "17", "16", "15", "14", "13", "12", "11"];
const UPPER_LEFT = ["21", "22", "23", "24", "25", "26", "27", "28"];
const LOWER_RIGHT = ["48", "47", "46", "45", "44", "43", "42", "41"];
const LOWER_LEFT = ["31", "32", "33", "34", "35", "36", "37", "38"];

type Props = {
  teeth: ToothData[];
  onToothClick: (toothNumber: string) => void;
};

export default function Odontogram({ teeth, onToothClick }: Props) {
  // Map untuk lookup cepat
  const teethMap: Record<string, ToothData> = {};
  for (const t of teeth) teethMap[t.tooth_number] = t;

  const renderTooth = (num: string) => {
    const t = teethMap[num];
    if (!t) return null;

    // Ambil kondisi utama (dari overall, atau dari surface pertama)
    let condition = "healthy";
    if (t.overall) {
      condition = t.overall.condition;
    } else {
      const surfaces = Object.values(t.surfaces);
      if (surfaces.length > 0) condition = surfaces[0].condition;
    }

    const style = CONDITION_COLORS[condition] || CONDITION_COLORS.healthy;

    return (
      <button
        key={num}
        onClick={() => onToothClick(num)}
        className={`${style.bg} ${style.text} border-2 border-gray-400 hover:border-primary-600 hover:shadow-md rounded transition-all flex flex-col items-center justify-center w-12 h-14 text-xs font-bold`}
        title={`Gigi ${num} — ${style.label}`}
      >
        <span className="text-sm">{num}</span>
        <span className="text-[9px] leading-tight mt-0.5">{style.label}</span>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Label Rahang Atas */}
      <div className="text-center text-xs text-gray-500 font-medium">
        RAHANG ATAS
      </div>

      {/* Rahang Atas */}
      <div className="flex justify-center items-center gap-1">
        {/* Kanan atas (pasien) */}
        <div className="flex gap-1">{UPPER_RIGHT.map(renderTooth)}</div>
        {/* Garis tengah */}
        <div className="w-px h-14 bg-gray-400 mx-2"></div>
        {/* Kiri atas */}
        <div className="flex gap-1">{UPPER_LEFT.map(renderTooth)}</div>
      </div>

      {/* Garis horizontal (rahang atas vs bawah) */}
      <div className="border-t-2 border-dashed border-gray-300 my-2"></div>

      {/* Rahang Bawah */}
      <div className="flex justify-center items-center gap-1">
        <div className="flex gap-1">{LOWER_RIGHT.map(renderTooth)}</div>
        <div className="w-px h-14 bg-gray-400 mx-2"></div>
        <div className="flex gap-1">{LOWER_LEFT.map(renderTooth)}</div>
      </div>

      <div className="text-center text-xs text-gray-500 font-medium">
        RAHANG BAWAH
      </div>

      {/* Legenda */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs font-medium text-gray-600 mb-2">
          Keterangan Warna:
        </p>
        <div className="flex flex-wrap gap-3">
          {Object.entries(CONDITION_COLORS).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div
                className={`${val.bg} border-2 border-gray-400 rounded`}
                style={{ width: 14, height: 14 }}
              />
              <span className="text-xs text-gray-600">{val.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Export untuk dipakai di file lain
export { CONDITION_COLORS };
