// path: src/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ===== USERS (mahasiswa only) =====
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nim: text('nim').unique(),
  nik: text('nik').unique(),
  email: text('email').unique(),
  passwordHash: text('password_hash'),
  namaLengkap: text('nama_lengkap').notNull(),
  role: text('role').notNull().default('mahasiswa'),
  // Desil DTSEN dari BPS (cek-desil) — null = belum ada data desil
  desilDtsen: text('desil_dtsen'),
  // Profile tracking (NEW)
  profileStatus: text('profile_status').notNull().default('incomplete'),
  // incomplete | pending | verified | rejected
  profileStep: integer('profile_step').notNull().default(1),
  profileSubmittedAt: text('profile_submitted_at'),
  profileVerifiedAt: text('profile_verified_at'),
  profileVerifiedBy: integer('profile_verified_by'),
  profileCatatan: text('profile_catatan'), // admin notes on reject
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ===== SESSIONS (mahasiswa) =====
export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
});

// ===== ADMINS =====
export const admins = sqliteTable('admins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  namaLengkap: text('nama_lengkap').notNull(),
  role: text('role').notNull().default('admin'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ===== BEASISWA =====
export const beasiswa = sqliteTable('beasiswa', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull(),
  slug: text('slug').notNull().unique(),
  deskripsi: text('deskripsi'),
  persyaratan: text('persyaratan'),
  aktif: integer('aktif').notNull().default(1),
  dibukaPada: text('dibuka_pada'),
  ditutupPada: text('ditutup_pada'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ===== BEASISWA DOKUMEN (dokumen persyaratan per beasiswa) =====
export const beasiswaDokumen = sqliteTable('beasiswa_dokumen', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  beasiswaId: integer('beasiswa_id').notNull().references(() => beasiswa.id),
  judul: text('judul').notNull(),
  deskripsi: text('deskripsi'),
  fileId: text('file_id'), // Google Drive file ID
  originalFilename: text('original_filename'),
  mimeType: text('mime_type'),
  fileSize: integer('file_size'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ===== PENDAFTARAN (lightweight — just user ↔ beasiswa link) =====
export const pendaftaran = sqliteTable('pendaftaran', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  beasiswaId: integer('beasiswa_id').notNull().references(() => beasiswa.id),
  status: text('status').notNull().default('pending'),
  // pending | accepted | rejected
  catatanAdmin: text('catatan_admin'),
  // Berkas kelulusan (per pendaftaran): mahasiswa Lolos upload Format 1 + Lampiran II
  format1FileId: text('format1_file_id'),
  format1OriginalFilename: text('format1_original_filename'),
  lampiran2FileId: text('lampiran2_file_id'),
  lampiran2OriginalFilename: text('lampiran2_original_filename'),
  berkasUploadedAt: text('berkas_uploaded_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ===== SECTION 1: IDENTITAS PRIBADI (per user) =====
export const identitasPribadi = sqliteTable('identitas_pribadi', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  nama: text('nama'),
  nik: text('nik'),
  nim: text('nim'),
  tempatLahir: text('tempat_lahir'),
  tanggalLahir: text('tanggal_lahir'),
  jenisKelamin: text('jenis_kelamin'),
  golonganDarah: text('golongan_darah'),
  agama: text('agama'),
  noHp: text('no_hp'),
  email: text('email'),
  anakKe: integer('anak_ke'),
  jumlahSaudara: integer('jumlah_saudara'),
  provinsi: text('provinsi'),
  kabupaten: text('kabupaten'),
  kecamatan: text('kecamatan'),
  kelurahan: text('kelurahan'),
  alamat: text('alamat'),
  rtRw: text('rt_rw'),
  kodePos: text('kode_pos'),
  noKip: text('no_kip'),
  noDesil: text('no_desil'),
  penerimaPkh: integer('penerima_pkh').default(0), // 0=tidak, 1=ya
  penerimaKjp: integer('penerima_kjp').default(0), // 0=tidak, 1=ya
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ===== SECTION 2: RIWAYAT PENDIDIKAN (per user) =====
export const riwayatPendidikan = sqliteTable('riwayat_pendidikan', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  jenisSekolah: text('jenis_sekolah'),
  nisn: text('nisn'),
  npsn: text('npsn'),
  namaSekolah: text('nama_sekolah'),
  alamatSekolah: text('alamat_sekolah'),
  lulusTahun: text('lulus_tahun'),
  lulusJalur: text('lulus_jalur'),
  jurusan: text('jurusan'), // IPA/IPS/Agama/Kejuruan/Umum
  kategoriUkt: text('kategori_ukt'),
  nominalUkt: integer('nominal_ukt'),
  nomorTes: text('nomor_tes'),
  fakultas: text('fakultas'),
  prodi: text('prodi'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ===== SECTION 3: PRESTASI & TAHFIDZ (per user) =====
export const prestasiTahfidz = sqliteTable('prestasi_tahfidz', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  namaLomba: text('nama_lomba'),
  jenisLomba: text('jenis_lomba'), // individu/regu
  tingkatLomba: text('tingkat_lomba'),
  predikatJuara: text('predikat_juara'),
  jumlahJuzz: integer('jumlah_juzz'), // 5/10/15/20/25/30
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ===== SECTION 4: IDENTITAS KELUARGA (per user) =====
export const identitasKeluarga = sqliteTable('identitas_keluarga', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  namaAyah: text('nama_ayah'),
  nikAyah: text('nik_ayah'),
  statusAyah: text('status_ayah'), // hidup/meninggal
  noTelpAyah: text('no_telp_ayah'),
  pendidikanAyah: text('pendidikan_ayah'),
  pekerjaanAyah: text('pekerjaan_ayah'),
  penghasilanAyah: integer('penghasilan_ayah'),
  namaIbu: text('nama_ibu'),
  nikIbu: text('nik_ibu'),
  statusIbu: text('status_ibu'),
  noTelpIbu: text('no_telp_ibu'),
  pendidikanIbu: text('pendidikan_ibu'),
  pekerjaanIbu: text('pekerjaan_ibu'),
  penghasilanIbu: integer('penghasilan_ibu'),
  nomorKk: text('nomor_kk'),
  jumlahTanggungan: integer('jumlah_tanggungan'),
  jumlahHutang: integer('jumlah_hutang'),
  cicilanHutang: integer('cicilan_hutang'),
  jumlahPiutang: integer('jumlah_piutang'),
  cicilanPiutang: integer('cicilan_piutang'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ===== SECTION 5: KONDISI RUMAH (per user) =====
export const kondisiRumah = sqliteTable('kondisi_rumah', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  luasTanah: text('luas_tanah'),
  kepemilikanRumah: text('kepemilikan_rumah'),
  biayaSewa: integer('biaya_sewa'),
  tanahLain: text('tanah_lain'),
  statusTanahLain: text('status_tanah_lain'),
  dayaListrik: text('daya_listrik'),
  statusListrik: text('status_listrik'),
  biayaListrik1: integer('biaya_listrik_1'),
  biayaListrik2: integer('biaya_listrik_2'),
  biayaListrik3: integer('biaya_listrik_3'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ===== SECTION 6: DOMISILI ORTU/WALI (per user) =====
export const domisiliOrtu = sqliteTable('domisili_ortu', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  provinsiAyah: text('provinsi_ayah'),
  kabupatenAyah: text('kabupaten_ayah'),
  kecamatanAyah: text('kecamatan_ayah'),
  kelurahanAyah: text('kelurahan_ayah'),
  alamatAyah: text('alamat_ayah'),
  rtRwAyah: text('rt_rw_ayah'),
  kodePosAyah: text('kode_pos_ayah'),
  gmapAyah: text('gmap_ayah'),
  provinsiIbu: text('provinsi_ibu'),
  kabupatenIbu: text('kabupaten_ibu'),
  kecamatanIbu: text('kecamatan_ibu'),
  kelurahanIbu: text('kelurahan_ibu'),
  alamatIbu: text('alamat_ibu'),
  rtRwIbu: text('rt_rw_ibu'),
  kodePosIbu: text('kode_pos_ibu'),
  gmapIbu: text('gmap_ibu'),
  namaWali: text('nama_wali'),
  nikWali: text('nik_wali'),
  noTelpWali: text('no_telp_wali'),
  hubunganWali: text('hubungan_wali'),
  pendidikanWali: text('pendidikan_wali'),
  pekerjaanWali: text('pekerjaan_wali'),
  penghasilanWali: integer('penghasilan_wali'),
  provinsiWali: text('provinsi_wali'),
  kabupatenWali: text('kabupaten_wali'),
  kecamatanWali: text('kecamatan_wali'),
  kelurahanWali: text('kelurahan_wali'),
  alamatWali: text('alamat_wali'),
  rtRwWali: text('rt_rw_wali'),
  kodePosWali: text('kode_pos_wali'),
  gmapWali: text('gmap_wali'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ===== SECTION 7: KEBUTUHAN KHUSUS (per user) =====
export const kebutuhanKhusus = sqliteTable('kebutuhan_khusus', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  penyandangDisabilitas: integer('penyandang_disabilitas').default(0), // 0=tidak, 1=ya
  jenisDisabilitas: text('jenis_disabilitas'), // jenis kebutuhan khusus/disabilitas
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ===== DOKUMEN (per user) =====
export const dokumen = sqliteTable('dokumen', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  bagian: text('bagian').notNull(),
  fieldName: text('field_name').notNull(),
  r2Key: text('r2_key'),
  originalFilename: text('original_filename'),
  mimeType: text('mime_type'),
  fileSize: integer('file_size'),
  uploadedAt: text('uploaded_at').notNull(),
});

// ===== PENGUMUMAN (rilis hasil seleksi per beasiswa — batch, bukan per individu) =====
export const pengumuman = sqliteTable('pengumuman', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  beasiswaId: integer('beasiswa_id').notNull().references(() => beasiswa.id),
  judul: text('judul').notNull(),
  isi: text('isi'), // catatan/narasi pengumuman
  skFileId: text('sk_file_id'), // Google Drive PDF (Surat Keputusan)
  skOriginalFilename: text('sk_original_filename'),
  skMimeType: text('sk_mime_type'),
  skFileSize: integer('sk_file_size'),
  published: integer('published').notNull().default(0), // 0=draft, 1=terbit
  publishedAt: text('published_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ===== BLOG POSTS =====
export const blogPosts = sqliteTable('blog_posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(), // HTML content
  excerpt: text('excerpt'), // ringkasan singkat
  coverImage: text('cover_image'), // URL/path gambar sampul
  docId: text('doc_id'), // Google Docs file ID
  authorId: integer('author_id'), // FK to admins (nullable — GARDA SSO)
  categoryId: integer('category_id').references(() => blogCategories.id), // optional category
  status: text('status').notNull().default('draft'), // draft|published
  publishedAt: text('published_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ===== BLOG CATEGORIES =====
export const blogCategories = sqliteTable('blog_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ===== BLOG TAGS =====
export const blogTags = sqliteTable('blog_tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: text('created_at').notNull(),
});

// ===== BLOG POST TAGS (junction) =====
export const blogPostTags = sqliteTable('blog_post_tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postId: integer('post_id').notNull().references(() => blogPosts.id),
  tagId: integer('tag_id').notNull().references(() => blogTags.id),
});
