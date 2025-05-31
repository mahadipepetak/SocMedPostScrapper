// Helper to download as CSV
function downloadCSV(data, filename = "posts.csv") {
    const csv = [
      ["Platform", "Text", "Date", "Likes", "Shares", "Views", "URL"],
      ...data.map(d => [
        d.platform,
        JSON.stringify(d.text),
        d.date,
        d.likes,
        d.shares,
        d.views,
        d.url
      ])
    ]
      .map(row => row.join(","))
      .join("\n");
  
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  