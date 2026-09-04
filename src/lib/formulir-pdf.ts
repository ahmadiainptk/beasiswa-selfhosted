// path: src/lib/formulir-pdf.ts
// Generate "Formulir Data Mahasiswa" PDF (form 1-7) using pdf-lib.
// Pure JS, runs on Cloudflare Workers. Indonesian labels.
// Only called after profileStatus === 'verified'.

import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import { LOGO_B64 } from "./kop-logo.ts";

// Bahasa Indonesia label map per Drizzle column name across all 7 sections
const LABEL_MAP: Record<string, string> = {
  // Identity
  nama: "Nama Lengkap", nik: "NIK", nim: "NIM", tempatLahir: "Tempat Lahir",
  tanggalLahir: "Tanggal Lahir", jenisKelamin: "Jenis Kelamin", golonganDarah: "Golongan Darah",
  agama: "Agama", noHp: "No. HP", email: "Email", anakKe: "Anak Ke-", jumlahSaudara: "Jumlah Saudara",
  provinsi: "Provinsi", kabupaten: "Kabupaten/Kota", kecamatan: "Kecamatan", kelurahan: "Kelurahan/Desa",
  alamat: "Alamat", rtRw: "RT/RW", kodePos: "Kode Pos",
  noKip: "No. KIP", noDesil: "No. Desil", penerimaPkh: "Penerima PKH", penerimaKjp: "Penerima KJP",
  // Pendidikan
  jenisSekolah: "Jenis Sekolah", nisn: "NISN", npsn: "NPSN", namaSekolah: "Nama Sekolah",
  alamatSekolah: "Alamat Sekolah", lulusTahun: "Tahun Lulus", lulusJalur: "Jalur Lulus",
  jurusan: "Jurusan", kategoriUkt: "Kategori UKT", nominalUkt: "Nominal UKT",
  nomorTes: "Nomor Tes", fakultas: "Fakultas", prodi: "Prodi",
  // Prestasi & Tahfidz
  namaLomba: "Nama Lomba", jenisLomba: "Jenis Lomba", tingkatLomba: "Tingkat Lomba",
  predikatJuara: "Predikat Juara", jumlahJuzz: "Jumlah Juz (Tahfidz)",
  // Keluarga
  namaAyah: "Nama Ayah", nikAyah: "NIK Ayah", statusAyah: "Status Ayah", noTelpAyah: "No. HP Ayah",
  pendidikanAyah: "Pendidikan Ayah", pekerjaanAyah: "Pekerjaan Ayah", penghasilanAyah: "Penghasilan Ayah",
  namaIbu: "Nama Ibu", nikIbu: "NIK Ibu", statusIbu: "Status Ibu", noTelpIbu: "No. HP Ibu",
  pendidikanIbu: "Pendidikan Ibu", pekerjaanIbu: "Pekerjaan Ibu", penghasilanIbu: "Penghasilan Ibu",
  nomorKk: "Nomor KK", jumlahTanggungan: "Jumlah Tanggungan", jumlahHutang: "Jumlah Hutang",
  cicilanHutang: "Cicilan Hutang", jumlahPiutang: "Jumlah Piutang", cicilanPiutang: "Cicilan Piutang",
  // Rumah
  luasTanah: "Luas Tanah", kepemilikanRumah: "Kepemilikan Rumah", biayaSewa: "Biaya Sewa",
  tanahLain: "Tanah Lain", statusTanahLain: "Status Tanah Lain", dayaListrik: "Daya Listrik",
  statusListrik: "Status Listrik", biayaListrik1: "Biaya Listrik (Bulan 1)",
  biayaListrik2: "Biaya Listrik (Bulan 2)", biayaListrik3: "Biaya Listrik (Bulan 3)",
  // Domisili ortu/wali
  provinsiAyah: "Provinsi Ayah", kabupatenAyah: "Kabupaten Ayah", kecamatanAyah: "Kecamatan Ayah",
  kelurahanAyah: "Kelurahan Ayah", alamatAyah: "Alamat Ayah", rtRwAyah: "RT/RW Ayah",
  kodePosAyah: "Kode Pos Ayah", gmapAyah: "Lokasi (Google Maps) Ayah",
  provinsiIbu: "Provinsi Ibu", kabupatenIbu: "Kabupaten Ibu", kecamatanIbu: "Kecamatan Ibu",
  kelurahanIbu: "Kelurahan Ibu", alamatIbu: "Alamat Ibu", rtRwIbu: "RT/RW Ibu",
  kodePosIbu: "Kode Pos Ibu", gmapIbu: "Lokasi (Google Maps) Ibu",
  namaWali: "Nama Wali", nikWali: "NIK Wali", noTelpWali: "No. HP Wali", hubunganWali: "Hubungan Wali",
  pendidikanWali: "Pendidikan Wali", pekerjaanWali: "Pekerjaan Wali", penghasilanWali: "Penghasilan Wali",
  provinsiWali: "Provinsi Wali", kabupatenWali: "Kabupaten Wali", kecamatanWali: "Kecamatan Wali",
  kelurahanWali: "Kelurahan Wali", alamatWali: "Alamat Wali", rtRwWali: "RT/RW Wali",
  kodePosWali: "Kode Pos Wali", gmapWali: "Lokasi (Google Maps) Wali",
  // Kebutuhan khusus
  penyandangDisabilitas: "Penyandang Disabilitas", jenisDisabilitas: "Jenis Disabilitas",
};

// Convert snake_case key to camelCase (column keys in Drizzle rows are already camelCase)
function humanize(key: string): string {
  return LABEL_MAP[key] || key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim();
}

function formatValue(key: string, value: any): string {
  if (value === null || value === undefined || value === "") return "-";
  // Rupiah fields
  if (["penghasilanAyah", "penghasilanIbu", "penghasilanWali", "nominalUkt", "biayaSewa", "biayaListrik1", "biayaListrik2", "biayaListrik3", "jumlahHutang", "cicilanHutang", "jumlahPiutang", "cicilanPiutang"].includes(key)) {
    const n = Number(value);
    if (isNaN(n)) return String(value);
    return "Rp " + n.toLocaleString("id-ID");
  }
  // Boolean 0/1
  if (key === "penerimaPkh" || key === "penerimaKjp" || key === "penyandangDisabilitas") {
    return value === 1 ? "Ya" : value === 0 ? "Tidak" : String(value);
  }
  return String(value);
}

const color = {
  primary: rgb(0.12, 0.29, 0.73),
  text: rgb(0.15, 0.17, 0.20),
  muted: rgb(0.45, 0.50, 0.58),
  line: rgb(0.85, 0.87, 0.90),
  headerBg: rgb(0.94, 0.96, 0.99),
};

const MARGIN = 45;
const PAGE_W = 595.28;   // A4 width (pt)
const PAGE_H = 841.89;   // A4 height (pt)

export interface FormulirData {
  user: { namaLengkap: string; nim: string | null; nik: string | null };
  sections: { title: string; data: Record<string, any> | null }[]; // 7 items
  dokumen: { fieldName: string; originalFilename: string | null }[];
  verifiedAt?: string | null;
}

// Canonical list of ALL fields per section (form 1-7), matching schema.ts.
// Ensures every field renders — filled or not — even if the row is missing or
// a column is absent from the returned row object.
const SEC_FIELDS: string[][] = [
  // 1. Identitas Pribadi
  ["nama", "nik", "nim", "tempatLahir", "tanggalLahir", "jenisKelamin", "golonganDarah", "agama", "noHp", "email", "anakKe", "jumlahSaudara", "provinsi", "kabupaten", "kecamatan", "kelurahan", "alamat", "rtRw", "kodePos", "noKip", "noDesil", "penerimaPkh", "penerimaKjp"],
  // 2. Riwayat Pendidikan
  ["jenisSekolah", "nisn", "npsn", "namaSekolah", "alamatSekolah", "lulusTahun", "lulusJalur", "jurusan", "kategoriUkt", "nominalUkt", "nomorTes", "fakultas", "prodi"],
  // 3. Prestasi & Tahfidz
  ["namaLomba", "jenisLomba", "tingkatLomba", "predikatJuara", "jumlahJuzz"],
  // 4. Identitas Keluarga
  ["namaAyah", "nikAyah", "statusAyah", "noTelpAyah", "pendidikanAyah", "pekerjaanAyah", "penghasilanAyah", "namaIbu", "nikIbu", "statusIbu", "noTelpIbu", "pendidikanIbu", "pekerjaanIbu", "penghasilanIbu", "nomorKk", "jumlahTanggungan", "jumlahHutang", "cicilanHutang", "jumlahPiutang", "cicilanPiutang"],
  // 5. Kondisi Rumah
  ["luasTanah", "kepemilikanRumah", "biayaSewa", "tanahLain", "statusTanahLain", "dayaListrik", "statusListrik", "biayaListrik1", "biayaListrik2", "biayaListrik3"],
  // 6. Domisili Ortu/Wali
  ["provinsiAyah", "kabupatenAyah", "kecamatanAyah", "kelurahanAyah", "alamatAyah", "rtRwAyah", "kodePosAyah", "gmapAyah", "provinsiIbu", "kabupatenIbu", "kecamatanIbu", "kelurahanIbu", "alamatIbu", "rtRwIbu", "kodePosIbu", "gmapIbu", "namaWali", "nikWali", "noTelpWali", "hubunganWali", "pendidikanWali", "pekerjaanWali", "penghasilanWali", "provinsiWali", "kabupatenWali", "kecamatanWali", "kelurahanWali", "alamatWali", "rtRwWali", "kodePosWali", "gmapWali"],
  // 7. Kebutuhan Khusus
  ["penyandangDisabilitas", "jenisDisabilitas"],
];

export async function generateFormulirPdf(data: FormulirData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Track cursor so we can paginate cleanly
  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  function newPage() {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  }

  function ensureSpace(needed: number) {
    if (y - needed < MARGIN) newPage();
  }

  function drawLabelValue(label: string, value: string) {
    const labelW = 210;
    ensureSpace(16);
    page.drawText(label, { x: MARGIN, y, size: 9.5, font: bold, color: color.muted });
    page.drawText(value, { x: MARGIN + labelW, y, size: 10, font, color: color.text, maxWidth: PAGE_W - MARGIN * 2 - labelW - 10 });
    y -= 16;
  }

  function drawSectionTitle(title: string) {
    ensureSpace(34);
    y -= 8;
    page.drawRectangle({ x: MARGIN, y: y - 2, width: PAGE_W - MARGIN * 2, height: 22, color: color.headerBg });
    page.drawText(title, { x: MARGIN + 8, y: y + 5, size: 11.5, font: bold, color: color.primary });
    y -= 26;
    // divider
    page.drawLine({ start: { x: MARGIN, y: y + 4 }, end: { x: PAGE_W - MARGIN, y: y + 4 }, thickness: 0.6, color: color.line });
    y -= 10;
  }

  // ---- Kop Surat (official letterhead) ----
  // Decode logo from base64 and embed as JPG
  const logoBytes = Uint8Array.from(atob(LOGO_B64), (c) => c.charCodeAt(0));
  const logoImg = await doc.embedJpg(logoBytes);
  const logoH = 64;                       // logo height in pt
  const logoW = (logoImg.width / logoImg.height) * logoH;
  const logoX = MARGIN;
  const logoY = PAGE_H - MARGIN - logoH;
  page.drawImage(logoImg, { x: logoX, y: logoY, width: logoW, height: logoH });

  // Institution text block (to the right of the logo)
  const textX = logoX + logoW + 16;
  const textTop = PAGE_H - MARGIN - 8;
  // Line 1: KEMENAG (largest, bold)
  page.drawText("KEMENTERIAN AGAMA REPUBLIK INDONESIA", { x: textX, y: textTop, size: 11.5, font: bold, color: color.text });
  // Line 2: IAIN PONTIANAK (bold)
  page.drawText("INSTITUT AGAMA ISLAM NEGERI (IAIN) PONTIANAK", { x: textX, y: textTop - 15, size: 10.5, font: bold, color: color.text });
  // Line 3: BIRO AUAK (bold)
  page.drawText("BIRO ADMINISTRASI UMUM, AKADEMIK, DAN KEMAHASISWAAN (AUAK)", { x: textX, y: textTop - 30, size: 9.5, font: bold, color: color.text });
  // Line 4: address (small, italic — use font for italics as no italic standard font)
  page.drawText("Jalan Letjend Soeprapto No. 19 Pontianak Kalimantan Barat", { x: textX, y: textTop - 45, size: 8.5, font, color: color.text });

  // Double divider line below the kop
  const kopDividerY = PAGE_H - MARGIN - logoH - 10;
  page.drawLine({ start: { x: MARGIN, y: kopDividerY + 2 }, end: { x: PAGE_W - MARGIN, y: kopDividerY + 2 }, thickness: 1.4, color: color.text });
  page.drawLine({ start: { x: MARGIN, y: kopDividerY - 1 }, end: { x: PAGE_W - MARGIN, y: kopDividerY - 1 }, thickness: 0.7, color: color.text });

  y = kopDividerY - 14;

  // Centered document title
  const title = "FORMULIR DATA CALON PENERIMA BEASISWA";
  const titleSize = 12.5;
  const titleW = bold.widthOfTextAtSize(title, titleSize);
  page.drawText(title, { x: (PAGE_W - titleW) / 2, y: y, size: titleSize, font: bold, color: color.text });
  y -= 16;

  // ---- Identity summary ----
  drawLabelValue("Nama Lengkap", data.user.namaLengkap || "-");
  drawLabelValue("NIM", data.user.nim || "-");
  drawLabelValue("NIK", data.user.nik || "-");
  drawLabelValue("Status", "Terverifikasi");
  if (data.verifiedAt) {
    drawLabelValue("Tanggal Verifikasi", new Date(data.verifiedAt).toLocaleDateString("id-ID"));
  }
  y -= 8;

  // ---- Sections 1-7 (render EVERY field, filled or not) ----
  for (let si = 0; si < data.sections.length; si++) {
    const section = data.sections[si];
    drawSectionTitle(section.title);
    const fields = SEC_FIELDS[si] || [];
    const row = section.data || {};
    for (const key of fields) {
      const value = row[key];
      drawLabelValue(humanize(key), formatValue(key, value));
    }
    y -= 8;
  }

  // ---- Dokumen yang diunggah ----
  drawSectionTitle("Dokumen Pendukung yang Diunggah");
  if (data.dokumen.length === 0) {
    page.drawText("Tidak ada dokumen diunggah", { x: MARGIN, y: y, size: 10, font, color: color.muted });
    y -= 16;
  } else {
    for (const d of data.dokumen) {
      ensureSpace(16);
      const label = humanize(d.fieldName);
      const name = d.originalFilename || "";
      page.drawText(`• ${label}`, { x: MARGIN + 4, y: y, size: 10, font: bold, color: color.text });
      if (name) {
        page.drawText(name, { x: MARGIN + 190, y: y, size: 9.5, font, color: color.muted, maxWidth: PAGE_W - MARGIN * 2 - 200 });
      }
      y -= 16;
    }
  }

  // ---- Signature area ----
  ensureSpace(80);
  y -= 12;
  const sigX = PAGE_W - MARGIN - 170;
  page.drawText("Pemohon,", { x: sigX, y: y, size: 10, font, color: color.text });
  y -= 50;
  page.drawText("( " + (data.user.namaLengkap || "") + " )", { x: sigX, y: y, size: 10, font: bold, color: color.text });
  y -= 18;
  page.drawText("NIM " + (data.user.nim || "-"), { x: sigX, y: y, size: 9.5, font, color: color.muted });

  // ---- Disclaimer (footer note) — mencegah mahasiswa mengira verifikasi = auto dapat beasiswa ----
  const discLines = [
    "FORMULIR INI ADALAH BUKTI DATA ANDA TERDAFTAR DAN TERVERIFIKASI",
    "SEBAGAI CALON PENERIMA BEASISWA.",
    "FORMULIR INI BUKAN MERUPAKAN BUKTI BAHWA ANDA TELAH DITETAPKAN",
    "SEBAGAI PENERIMA BEASISWA.",
    "KEPUTUSAN PENETAPAN PENERIMA BEASISWA DILAKUKAN OLEH PERGURUAN",
    "TINGGI MELALUI PROSES SELEKSI.",
  ];
  const discSize = 8.5;
  const discPad = 10;
  const lineH = 11;
  const boxH = discLines.length * lineH + discPad * 2;
  ensureSpace(boxH + 6);
  y -= 24;
  const boxY = y - boxH;
  page.drawRectangle({
    x: MARGIN, y: boxY, width: PAGE_W - MARGIN * 2, height: boxH,
    color: color.headerBg, borderColor: color.line, borderWidth: 0.6,
  });
  // Red left accent bar (warning emphasis)
  page.drawRectangle({ x: MARGIN, y: boxY, width: 3, height: boxH, color: rgb(0.85, 0.25, 0.22) });
  discLines.forEach((line, i) => {
    page.drawText(line, {
      x: MARGIN + discPad + 6, y: boxY + boxH - discPad - (i + 1) * lineH + 3,
      size: discSize, font: bold, color: rgb(0.60, 0.08, 0.06),
    });
  });
  y = boxY - 10;

  // ---- Footer (page number) ----
  const pages = doc.getPages();
  pages.forEach((p, idx) => {
    p.drawText(`Halaman ${idx + 1} dari ${pages.length}`, {
      x: PAGE_W - MARGIN - 90, y: MARGIN - 18, size: 8.5, font, color: color.muted,
    });
    p.drawLine({ start: { x: MARGIN, y: MARGIN - 8 }, end: { x: PAGE_W - MARGIN, y: MARGIN - 8 }, thickness: 0.4, color: color.line });
  });

  return doc.save();
}
