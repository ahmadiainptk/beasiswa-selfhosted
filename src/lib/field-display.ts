// path: src/lib/field-display.ts
// Shared human-readable label map + formatting for profile fields.
// Used by BOTH admin review (/admin/pendaftaran/[id]) AND student review (/mahasiswa/form/review)
// so both render labels & values the SAME way (no raw camelCase keys in the student view).

export const LABEL_MAP: Record<string, string> = {
  nama: 'Nama', nik: 'NIK', nim: 'NIM', namaLengkap: 'Nama Lengkap',
  tempatLahir: 'Tempat Lahir', tanggalLahir: 'Tanggal Lahir',
  jenisKelamin: 'Jenis Kelamin', golonganDarah: 'Golongan Darah',
  agama: 'Agama', noHp: 'No HP', email: 'Email',
  anakKe: 'Anak ke-', jumlahSaudara: 'Jumlah Saudara',
  provinsi: 'Provinsi', kabupaten: 'Kabupaten / Kota',
  kecamatan: 'Kecamatan', kelurahan: 'Kelurahan / Desa',
  alamat: 'Alamat', rtRw: 'RT / RW', kodePos: 'Kode Pos',
  noKip: 'No KIP', penerimaPkh: 'Penerima PKH', penerimaKjp: 'Penerima KJP',
  // Riwayat Pendidikan
  jenisSekolah: 'Jenis Sekolah', nisn: 'NISN', npsn: 'NPSN',
  namaSekolah: 'Nama Sekolah', alamatSekolah: 'Alamat Sekolah',
  lulusTahun: 'Tahun Lulus', lulusJalur: 'Jalur Kelulusan',
  jurusan: 'Jurusan', kategoriUkt: 'Kategori UKT', nominalUkt: 'Nominal UKT',
  nomorTes: 'Nomor Tes', fakultas: 'Fakultas', prodi: 'Program Studi',
  // Prestasi
  namaLomba: 'Nama Lomba', jenisLomba: 'Jenis Lomba',
  tingkatLomba: 'Tingkat Lomba', predikatJuara: 'Predikat Juara',
  jumlahJuzz: 'Jumlah Juzz',
  // Keluarga
  namaAyah: 'Nama Ayah', nikAyah: 'NIK Ayah', statusAyah: 'Status Ayah',
  noTelpAyah: 'No Telp Ayah', pendidikanAyah: 'Pendidikan Ayah',
  pekerjaanAyah: 'Pekerjaan Ayah', penghasilanAyah: 'Penghasilan Ayah',
  namaIbu: 'Nama Ibu', nikIbu: 'NIK Ibu', statusIbu: 'Status Ibu',
  noTelpIbu: 'No Telp Ibu', pendidikanIbu: 'Pendidikan Ibu',
  pekerjaanIbu: 'Pekerjaan Ibu', penghasilanIbu: 'Penghasilan Ibu',
  nomorKk: 'Nomor KK', jumlahTanggungan: 'Jumlah Tanggungan',
  jumlahHutang: 'Jumlah Hutang', cicilanHutang: 'Cicilan Hutang',
  jumlahPiutang: 'Jumlah Piutang', cicilanPiutang: 'Cicilan Piutang',
  // Rumah
  luasTanah: 'Luas Tanah', kepemilikanRumah: 'Kepemilikan Rumah',
  biayaSewa: 'Biaya Sewa', tanahLain: 'Tanah Lain', statusTanahLain: 'Status Tanah Lain',
  dayaListrik: 'Daya Listrik', statusListrik: 'Status Listrik',
  biayaListrik1: 'Biaya Listrik (1)', biayaListrik2: 'Biaya Listrik (2)', biayaListrik3: 'Biaya Listrik (3)',
  // Domisili
  provinsiAyah: 'Provinsi Ayah', kabupatenAyah: 'Kabupaten Ayah',
  kecamatanAyah: 'Kecamatan Ayah', kelurahanAyah: 'Kelurahan Ayah',
  alamatAyah: 'Alamat Ayah', rtRwAyah: 'RT / RW Ayah', kodePosAyah: 'Kode Pos Ayah', gmapAyah: 'Google Maps Ayah',
  provinsiIbu: 'Provinsi Ibu', kabupatenIbu: 'Kabupaten Ibu',
  kecamatanIbu: 'Kecamatan Ibu', kelurahanIbu: 'Kelurahan Ibu',
  alamatIbu: 'Alamat Ibu', rtRwIbu: 'RT / RW Ibu', kodePosIbu: 'Kode Pos Ibu', gmapIbu: 'Google Maps Ibu',
  namaWali: 'Nama Wali', nikWali: 'NIK Wali', noTelpWali: 'No Telp Wali',
  hubunganWali: 'Hubungan Wali', pendidikanWali: 'Pendidikan Wali',
  pekerjaanWali: 'Pekerjaan Wali', penghasilanWali: 'Penghasilan Wali',
  provinsiWali: 'Provinsi Wali', kabupatenWali: 'Kabupaten Wali',
  kecamatanWali: 'Kecamatan Wali', kelurahanWali: 'Kelurahan Wali',
  alamatWali: 'Alamat Wali', rtRwWali: 'RT / RW Wali', kodePosWali: 'Kode Pos Wali', gmapWali: 'Google Maps Wali',
  // Kebutuhan Khusus
  penyandangDisabilitas: 'Penyandang Disabilitas', jenisDisabilitas: 'Jenis Disabilitas',
};

export function formatLabel(key: string): string {
  return LABEL_MAP[key] || key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
}

export function formatValue(key: string, value: any): string {
  if (value === null || value === undefined || value === '') return '-';
  if (key === 'penghasilanAyah' || key === 'penghasilanIbu' || key === 'penghasilanWali' ||
      key === 'nominalUkt' || key === 'biayaSewa' || key === 'biayaListrik1' || key === 'biayaListrik2' || key === 'biayaListrik3' ||
      key === 'jumlahHutang' || key === 'cicilanHutang' || key === 'jumlahPiutang' || key === 'cicilanPiutang') {
    const n = Number(value);
    if (n === 0) return 'Rp 0';
    return 'Rp ' + n.toLocaleString('id-ID');
  }
  if (key === 'penerimaPkh' || key === 'penerimaKjp') {
    return value === 1 || value === '1' ? 'Ya' : 'Tidak';
  }
  if (key === 'penyandangDisabilitas') {
    return value === 1 || value === '1' ? 'Ya' : 'Tidak';
  }
  if (key === 'jenisKelamin') return value === 'L' ? 'Laki-laki' : value === 'P' ? 'Perempuan' : String(value);
  return String(value);
}

// ---- Wajib (required) validation untuk halaman review ----
// Kolom yang WAJIB diisi mahasiswa (existing `*` + tambahan). Key = camelCase column name.
export const REQUIRED_KEYS = new Set<string>([
  // Section 1 — Identitas
  'nama', 'nik', 'nim', 'tempatLahir', 'tanggalLahir', 'jenisKelamin', 'agama', 'noHp', 'email',
  'provinsi', 'golonganDarah', 'anakKe', 'jumlahSaudara', 'kabupaten', 'kecamatan', 'kelurahan',
  'alamat', 'rtRw', 'kodePos', 'noKip', 'noDesil',
  // Section 2 — Riwayat Pendidikan
  'jenisSekolah', 'nisn', 'npsn', 'namaSekolah', 'lulusTahun', 'lulusJalur', 'jurusan',
  'kategoriUkt', 'nominalUkt', 'fakultas', 'prodi', 'alamatSekolah',
  // Section 4 — Identitas Keluarga
  'namaAyah', 'nikAyah', 'statusAyah', 'noTelpAyah', 'pendidikanAyah', 'pekerjaanAyah', 'penghasilanAyah',
  'namaIbu', 'nikIbu', 'statusIbu', 'noTelpIbu', 'pendidikanIbu', 'pekerjaanIbu', 'penghasilanIbu',
  'nomorKk', 'jumlahTanggungan',
  // Section 5 — Kondisi Rumah
  'luasTanah', 'kepemilikanRumah', 'dayaListrik', 'statusListrik',
  // Section 6 — Domisili Ayah & Ibu (wajib LENGKAP, termasuk gmap)
  'provinsiAyah', 'kabupatenAyah', 'kecamatanAyah', 'kelurahanAyah', 'alamatAyah', 'rtRwAyah', 'kodePosAyah', 'gmapAyah',
  'provinsiIbu', 'kabupatenIbu', 'kecamatanIbu', 'kelurahanIbu', 'alamatIbu', 'rtRwIbu', 'kodePosIbu', 'gmapIbu',
  // Section 7 — Kebutuhan Khusus
  'penyandangDisabilitas',
]);

// Wali domisili & identitas hanya WAJIB jika ada wali (namaWali/hubunganWali terisi).
const WALI_KEYS = new Set<string>([
  'namaWali', 'nikWali', 'noTelpWali', 'hubunganWali', 'pendidikanWali', 'pekerjaanWali', 'penghasilanWali',
  'provinsiWali', 'kabupatenWali', 'kecamatanWali', 'kelurahanWali', 'alamatWali', 'rtRwWali', 'kodePosWali', 'gmapWali',
]);

export function isEmptyValue(value: any): boolean {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}

// Apakah kolom ini wajib diisi (untuk row section yang diberikan). Wali = kondisional.
// ctx.keluarga = row identitas_keluarga (utk cek status ayah/ibu) — hanya gmap wali yang butuh.
export function isFieldRequired(key: string, row: any, ctx?: any): boolean {
  // gmap Wali hanya WAJIB jika ayah DAN ibu sudah meninggal (wali jadi pengganti ortu).
  if (key === 'gmapWali') {
    const k = ctx?.keluarga;
    if (!k) return false;
    const ayahMeninggal = String(k.statusAyah || '').toLowerCase() === 'meninggal';
    const ibuMeninggal = String(k.statusIbu || '').toLowerCase() === 'meninggal';
    return ayahMeninggal && ibuMeninggal;
  }
  if (REQUIRED_KEYS.has(key)) return true;
  if (WALI_KEYS.has(key) && row && (row.namaWali || row.hubunganWali)) return true;
  return false;
}

// Kolom wajib yang BELUM terisi untuk satu row. Return array of keys.
export function missingRequiredKeys(row: any, sectionKeys: string[], ctx?: any): string[] {
  if (!row) return sectionKeys.filter((k) => isFieldRequired(k, row, ctx));
  return sectionKeys.filter((k) => isFieldRequired(k, row, ctx) && isEmptyValue(row[k]));
}

// Daftar kolom wajib per section (index 0..6), untuk validasi review.
export const SECTION_REQUIRED: string[][] = [
  // 1 Identitas
  ['nama','nik','nim','tempatLahir','tanggalLahir','jenisKelamin','agama','noHp','email','provinsi',
   'golonganDarah','anakKe','jumlahSaudara','kabupaten','kecamatan','kelurahan','alamat','rtRw','kodePos','noKip','noDesil'],
  // 2 Riwayat Pendidikan
  ['jenisSekolah','nisn','npsn','namaSekolah','lulusTahun','lulusJalur','jurusan','kategoriUkt','nominalUkt','fakultas','prodi','alamatSekolah'],
  // 3 Prestasi & Tahfidz — tidak ada yang dipaksa
  [],
  // 4 Identitas Keluarga
  ['namaAyah','nikAyah','statusAyah','noTelpAyah','pendidikanAyah','pekerjaanAyah','penghasilanAyah',
   'namaIbu','nikIbu','statusIbu','noTelpIbu','pendidikanIbu','pekerjaanIbu','penghasilanIbu','nomorKk','jumlahTanggungan'],
  // 5 Kondisi Rumah
  ['luasTanah','kepemilikanRumah','dayaListrik','statusListrik'],
  // 6 Domisili Ayah & Ibu (lengkap incl gmap) + Wali (kondisional)
  ['provinsiAyah','kabupatenAyah','kecamatanAyah','kelurahanAyah','alamatAyah','rtRwAyah','kodePosAyah','gmapAyah',
   'provinsiIbu','kabupatenIbu','kecamatanIbu','kelurahanIbu','alamatIbu','rtRwIbu','kodePosIbu','gmapIbu',
   'namaWali','nikWali','noTelpWali','hubunganWali','pendidikanWali','pekerjaanWali','penghasilanWali',
   'provinsiWali','kabupatenWali','kecamatanWali','kelurahanWali','alamatWali','rtRwWali','kodePosWali','gmapWali'],
  // 7 Kebutuhan Khusus
  ['penyandangDisabilitas'],
];

// Kolom wajib yang belum terisi untuk satu section row (sekalian per-item). Wali kondisional.
export function missingKeysForSection(row: any, secIdx: number): string[] {
  const keys = SECTION_REQUIRED[secIdx] || [];
  return keys.filter((k) => isFieldRequired(k, row) && (row ? isEmptyValue(row[k]) : true));
}

// Fields of the prestasi section that should NOT render as plain key/value rows
// (they're replaced by a dedicated prestasi list). Includes the JSON column itself.
export const PRESTASI_KEYS = new Set([
  'namaLomba', 'jenisLomba', 'tingkatLomba', 'predikatJuara', 'prestasiList',
]);

// Parse prestasiList JSON into an array of {namaLomba,jenisLomba,tingkatLomba,predikatJuara}.
// Falls back to the legacy single-row fields so existing data is not lost.
export function parsePrestasiList(row: any): any[] {
  if (!row) return [];
  const raw = row.prestasiList;
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return arr.filter((x) => x && (x.namaLomba || x.jenisLomba || x.tingkatLomba || x.predikatJuara));
      }
    } catch {}
  }
  if (row.namaLomba || row.jenisLomba || row.tingkatLomba || row.predikatJuara) {
    return [{
      namaLomba: row.namaLomba, jenisLomba: row.jenisLomba,
      tingkatLomba: row.tingkatLomba, predikatJuara: row.predikatJuara,
    }];
  }
  return [];
}

// Row-aware value formatter for income fields (ayah & ibu — seragam):
//   - status 'meninggal'  -> '-' (tulis "-", bukan angka)
//   - tidak ada penghasilan (nganggur / kosong / 0) -> '0'
//   - ada penghasilan     -> 'Rp X'
export function formatSectionValue(key: string, value: any, row: any): string {
  const isIncome = key === 'penghasilanAyah' || key === 'penghasilanIbu';
  if (isIncome) {
    const statusKey = key === 'penghasilanAyah' ? 'statusAyah' : 'statusIbu';
    if (row && row[statusKey] === 'meninggal') return '-';
    const n = value == null || value === '' ? 0 : Number(value);
    if (!n) return '0';
  }
  return formatValue(key, value);
}
