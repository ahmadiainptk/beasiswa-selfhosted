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
