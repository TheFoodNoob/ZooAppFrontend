// Tiny CSV helper. Usage:
//   const csv = rowsToCsv(rows, [
//     { header: "Name",     get: r => r.name },
//     { header: "Date",     get: r => r.date },
//   ]);
//   downloadCsv("events.csv", csv);

export function rowsToCsv(rows, columns) {
  const esc = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    // wrap if contains comma/quote/newline
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const header = columns.map(c => esc(c.header)).join(",");
  const body = rows
    .map(r => columns.map(c => esc(c.get(r, rows))).join(","))
    .join("\n");

  return `${header}\n${body}`;
}

export function downloadCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
