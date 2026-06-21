"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export function ExportPanel() {
  const now = new Date();
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(current);

  const href = (type: string) => `/api/export?type=${type}&month=${month}`;

  return (
    <div className="export-panel">
      <label>
        対象月
        <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
      </label>
      <div className="export-actions">
        <a className="secondary small" href={href("gain-loss")}>
          <Download size={15} />為替差損益 CSV
        </a>
        <a className="secondary small" href={href("requests")}>
          <Download size={15} />送金実績 CSV
        </a>
      </div>
    </div>
  );
}
