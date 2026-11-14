CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  tanggal TEXT NOT NULL,
  modul TEXT NOT NULL,
  tipe TEXT NOT NULL,
  kategori TEXT NOT NULL,
  nominal REAL NOT NULL,
  catatan TEXT,
  input_tambahan TEXT,
  foto_bukti_url TEXT,
  status TEXT DEFAULT 'aktif',
  status_audit TEXT DEFAULT 'menunggu',
  created_by_role TEXT,
  edit_log TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
