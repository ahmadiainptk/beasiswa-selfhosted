// path: src/lib/doc-labels.ts
// Human-readable placeholder title + section grouping for uploaded documents.
// Used by BOTH admin review (/admin/pendaftaran/[id]) and student review (/mahasiswa/form/review)
// so the admin knows what a document is WITHOUT opening the file.

// fieldName (dokumen.field_name) -> human-readable placeholder title
export const DOC_LABEL_MAP: Record<string, string> = {
  // Section 1 — Identitas
  foto_formal: 'Foto Formal',
  ktp: 'KTP',
  akta_kelahiran: 'Akta Kelahiran',
  kip_pip_kjp: 'KIP / PIP / KJP',
  kks: 'KKS',
  sktm: 'SKTM',
  // Section 2 — Riwayat Pendidikan
  ijazah_skl: 'Ijazah / SKL',
  transkrip_nilai: 'Transkrip Nilai',
  raport_1_6: 'Raport (Semester 1-6)',
  // Section 3 — Prestasi & Tahfidz
  sertifikat_prestasi: 'Sertifikat Prestasi',
  sertifikat_tahfidz: 'Sertifikat Tahfidz',
  // Section 4 — Keluarga
  kartu_keluarga: 'Kartu Keluarga',
  akta_kematian: 'Akta Kematian',
  surat_phk_bencana: 'Surat PHK / Bencana',
  sk_penghasilan_ortu: 'SK Penghasilan Orang Tua',
  // Section 5 — Kondisi Rumah
  foto_rumah_depan: 'Foto Rumah Depan',
  foto_ruang_tamu: 'Foto Ruang Tamu',
  foto_dapur: 'Foto Dapur',
  foto_meteran: 'Foto Meteran Listrik',
  bukti_bayar_listrik_1: 'Bukti Bayar Listrik (1 Bulan Terakhir)',
  surat_listrik_desa: 'Surat Keterangan Listrik Desa',
  surat_panti_asuhan: 'Surat Panti Asuhan',
  // Section 6 — Domisili Ortu/Wali
  sk_penghasilan_wali: 'SK Penghasilan Wali',
  // Section 7 — Kebutuhan Khusus
  surat_disabilitas: 'Surat Disabilitas',
};

// bagian (dokumen.bagian) -> section placement. Ordering follows the form wizard.
export const BAGIAN_SECTION: Record<string, { num: number; title: string }> = {
  identitas_pribadi: { num: 1, title: '1. Identitas Pribadi' },
  riwayat_pendidikan: { num: 2, title: '2. Riwayat Pendidikan' },
  prestasi_tahfidz: { num: 3, title: '3. Prestasi & Tahfidz' },
  identitas_keluarga: { num: 4, title: '4. Identitas Keluarga' },
  kondisi_rumah: { num: 5, title: '5. Kondisi Rumah' },
  domisili_ortu: { num: 6, title: '6. Domisili Ortu / Wali' },
  kebutuhan_khusus: { num: 7, title: '7. Kebutuhan Khusus' },
};

// Human-readable placeholder title for a document; fallback prettified fieldName.
export function docLabel(fieldName: string): string {
  if (DOC_LABEL_MAP[fieldName]) return DOC_LABEL_MAP[fieldName];
  return fieldName.replace(/_/g, ' ').replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}
