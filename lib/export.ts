import type { Sale, Product, Customer } from "@/types";

// ─── jsPDF Receipt ────────────────────────────────────────────────────────────

export async function printReceipt(sale: Sale, shopName: string) {
  const { default: jsPDF } = await import("jspdf");
  await import("jspdf-autotable");

  const doc = new jsPDF({ unit: "mm", format: [80, 200], orientation: "portrait" });
  const PAGE_W = 80;
  let y = 0;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(shopName, PAGE_W / 2, (y += 10), { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Fiş", PAGE_W / 2, (y += 5), { align: "center" });
  doc.text(new Date(sale.createdAt).toLocaleString("tr-TR"), PAGE_W / 2, (y += 4), { align: "center" });
  doc.text(`Fiş No: ${sale.id.slice(-8).toUpperCase()}`, PAGE_W / 2, (y += 4), { align: "center" });

  // Divider
  y += 2;
  doc.setLineWidth(0.2);
  doc.setDrawColor(180, 180, 180);
  doc.line(4, y, PAGE_W - 4, y);
  y += 3;

  // Items table
  (doc as any).autoTable({
    startY: y,
    head: [["Ürün", "Adet", "Fiyat", "Toplam"]],
    body: sale.items.map((i) => [
      i.productName,
      i.quantity,
      `₺${i.unitPrice.toFixed(2)}`,
      `₺${i.lineTotal.toFixed(2)}`,
    ]),
    theme: "plain",
    styles: { fontSize: 7, cellPadding: 1.5, font: "helvetica" },
    headStyles: { fontStyle: "bold", fillColor: [245, 247, 250], textColor: [80, 80, 80] },
    margin: { left: 4, right: 4 },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { halign: "center", cellWidth: 10 },
      2: { halign: "right", cellWidth: 16 },
      3: { halign: "right", cellWidth: 16 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 3;
  doc.line(4, y, PAGE_W - 4, y);
  y += 4;

  // Totals
  const addLine = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 9 : 7.5);
    doc.text(label, 6, y);
    doc.text(value, PAGE_W - 6, y, { align: "right" });
    y += bold ? 5 : 4;
  };

  addLine("Ara Toplam", `₺${sale.subtotal.toFixed(2)}`);
  addLine(`KDV (${sale.vatType === "none" ? "%0" : sale.vatType})`, `₺${sale.vatAmount.toFixed(2)}`);
  if (sale.discount > 0) addLine("İndirim", `-₺${sale.discount.toFixed(2)}`);
  addLine("TOPLAM", `₺${sale.total.toFixed(2)}`, true);
  addLine("Ödeme", sale.paymentMethod === "cash" ? "Nakit" : sale.paymentMethod === "card" ? "Kart" : "Cari");

  y += 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Teşekkür ederiz!", PAGE_W / 2, (y += 4), { align: "center" });

  // Output
  const filename = `fis-${sale.id.slice(-8)}.pdf`;
  doc.save(filename);
}

// ─── jsPDF Invoice ────────────────────────────────────────────────────────────

export async function printInvoice(sale: Sale, shopName: string, customerName?: string) {
  const { default: jsPDF } = await import("jspdf");
  await import("jspdf-autotable");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  let y = 20;

  // Logo / Header block
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(14, y, W - 28, 32, 4, 4, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(shopName, 24, y + 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("FATURA", 24, y + 21);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`#${sale.id.slice(-8).toUpperCase()}`, W - 20, y + 10, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(new Date(sale.createdAt).toLocaleDateString("tr-TR"), W - 20, y + 18, { align: "right" });
  doc.text(new Date(sale.createdAt).toLocaleTimeString("tr-TR"), W - 20, y + 24, { align: "right" });

  y += 42;
  doc.setTextColor(30, 30, 30);

  // Customer info
  if (customerName || sale.customerName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("MÜŞTERİ", 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(customerName ?? sale.customerName ?? "", 14, (y += 5));
    y += 8;
  }

  // Items table
  (doc as any).autoTable({
    startY: y,
    head: [["#", "Ürün Adı", "Miktar", "Birim Fiyat", "KDV", "Toplam"]],
    body: sale.items.map((i, idx) => [
      idx + 1,
      i.productName,
      i.quantity,
      `₺${i.unitPrice.toFixed(2)}`,
      `%${i.vatRate}`,
      `₺${i.lineTotal.toFixed(2)}`,
    ]),
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [247, 249, 252] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Totals box
  const BOX_X = W - 14 - 70;
  doc.setFillColor(247, 249, 252);
  doc.roundedRect(BOX_X, y, 70, 38, 3, 3, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Ara Toplam:", BOX_X + 4, (y += 9));
  doc.text(`KDV (${sale.vatType}):`, BOX_X + 4, (y += 7));
  if (sale.discount > 0) { doc.text("İndirim:", BOX_X + 4, (y += 7)); }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235);
  doc.text("GENEL TOPLAM:", BOX_X + 4, (y += 9));

  // Values (right-align)
  y -= (sale.discount > 0 ? 23 : 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text(`₺${sale.subtotal.toFixed(2)}`, BOX_X + 66, y, { align: "right" });
  doc.text(`₺${sale.vatAmount.toFixed(2)}`, BOX_X + 66, (y += 7), { align: "right" });
  if (sale.discount > 0) doc.text(`-₺${sale.discount.toFixed(2)}`, BOX_X + 66, (y += 7), { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(37, 99, 235);
  doc.text(`₺${sale.total.toFixed(2)}`, BOX_X + 66, (y += 9), { align: "right" });

  // Footer
  y = 280;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text("Bu belge Depocu uygulaması ile oluşturulmuştur.", W / 2, y, { align: "center" });

  doc.save(`fatura-${sale.id.slice(-8)}.pdf`);
}

// ─── WhatsApp Share ───────────────────────────────────────────────────────────

export function shareViaWhatsApp(sale: Sale, shopName: string) {
  const itemLines = sale.items
    .map((i) => `  • ${i.productName} × ${i.quantity} = ₺${i.lineTotal.toFixed(2)}`)
    .join("\n");

  const text = [
    `*${shopName}* — Fiş #${sale.id.slice(-8).toUpperCase()}`,
    `Tarih: ${new Date(sale.createdAt).toLocaleString("tr-TR")}`,
    "",
    itemLines,
    "",
    `KDV: ₺${sale.vatAmount.toFixed(2)}`,
    sale.discount > 0 ? `İndirim: ₺${sale.discount.toFixed(2)}` : null,
    `*TOPLAM: ₺${sale.total.toFixed(2)}*`,
  ].filter(Boolean).join("\n");

  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

// ─── SheetJS Excel Export ─────────────────────────────────────────────────────

export async function exportSalesToExcel(sales: Sale[], shopName: string) {
  const { utils, writeFile } = await import("xlsx");

  const rows = sales.flatMap((s) =>
    s.items.map((i) => ({
      "Fiş No": s.id.slice(-8).toUpperCase(),
      "Tarih": new Date(s.createdAt).toLocaleString("tr-TR"),
      "Ürün": i.productName,
      "Miktar": i.quantity,
      "Birim Fiyat (₺)": i.unitPrice,
      "Satır Toplam (₺)": i.lineTotal,
      "KDV (%)": i.vatRate,
      "KDV Tutarı (₺)": i.vatAmount.toFixed(2),
      "Müşteri": s.customerName ?? "Genel",
      "Ödeme": s.paymentMethod === "cash" ? "Nakit" : s.paymentMethod === "card" ? "Kart" : "Cari",
      "İndirim (₺)": s.discount,
      "Satış Toplam (₺)": s.total,
    }))
  );

  const ws = utils.json_to_sheet(rows);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Satışlar");

  // Column widths
  ws["!cols"] = [
    { wch: 12 }, { wch: 18 }, { wch: 28 }, { wch: 8 }, { wch: 16 },
    { wch: 16 }, { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 10 },
    { wch: 14 }, { wch: 16 },
  ];

  writeFile(wb, `${shopName}-satislar-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function exportProductsToExcel(products: Product[], shopName: string) {
  const { utils, writeFile } = await import("xlsx");

  const rows = products.map((p) => ({
    "Ürün Adı": p.name,
    "Barkod": p.barcode ?? "",
    "Kategori": p.category ?? "",
    "Maliyet (₺)": p.costPrice,
    "Usta Fiyat (₺)": p.masterPrice,
    "Perakende (₺)": p.retailPrice,
    "Stok": p.stock,
    "Min Stok": p.minStock,
    "Birim": p.unit,
    "KDV (%)": p.vatRate,
    "Güncelleme": new Date(p.updatedAt).toLocaleDateString("tr-TR"),
  }));

  const ws = utils.json_to_sheet(rows);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Stok");
  ws["!cols"] = Array(11).fill({ wch: 16 });
  writeFile(wb, `${shopName}-stok-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function exportCustomersToExcel(customers: Customer[], shopName: string) {
  const { utils, writeFile } = await import("xlsx");

  const rows = customers.map((c) => ({
    "Ad": c.name,
    "Telefon": c.phone ?? "",
    "Tip": c.type === "master" ? "Usta" : "Müşteri",
    "Bakiye (₺)": c.balance,
    "Durum": c.balance < 0 ? "Borçlu" : c.balance > 0 ? "Alacaklı" : "Denkleşmiş",
    "Kayıt Tarihi": new Date(c.createdAt).toLocaleDateString("tr-TR"),
  }));

  const ws = utils.json_to_sheet(rows);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Cariler");
  ws["!cols"] = Array(6).fill({ wch: 18 });
  writeFile(wb, `${shopName}-cariler-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
