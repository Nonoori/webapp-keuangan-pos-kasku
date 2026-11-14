export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  // Header CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    // 1. AMBIL SEMUA TRANSAKSI (GET)
    if (method === 'GET') {
      const { results } = await env.DB.prepare(
        `SELECT * FROM transactions ORDER BY tanggal DESC, created_at DESC LIMIT 500`
      ).all();

      const formatted = results.map(row => ({
        ...row,
        input_tambahan: row.input_tambahan ? JSON.parse(row.input_tambahan) : {},
        edit_log: row.edit_log ? JSON.parse(row.edit_log) : []
      }));

      return new Response(JSON.stringify({ transactions: formatted }), { headers });
    }

    // 2. SIMPAN TRANSAKSI BARU (POST)
    if (method === 'POST') {
      const body = await request.json();
      await env.DB.prepare(
        `INSERT INTO transactions 
        (id, tanggal, modul, tipe, kategori, nominal, catatan, input_tambahan, foto_bukti_url, status, status_audit, created_by_role, edit_log)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        body.id,
        body.tanggal,
        body.modul,
        body.tipe,
        body.kategori,
        body.nominal,
        body.catatan || '',
        JSON.stringify(body.input_tambahan || {}),
        body.foto_bukti_url || null,
        'aktif',
        'menunggu',
        body.created_by_role || 'lapangan',
        JSON.stringify([])
      ).run();

      return new Response(JSON.stringify({ success: true }), { status: 201, headers });
    }

    // 3. SUNTING (EDIT), BATALKAN (VOID), ATAU VALIDASI AUDIT (PUT)
    if (method === 'PUT') {
      const body = await request.json();
      await env.DB.prepare(
        `UPDATE transactions SET 
          kategori = ?, nominal = ?, tanggal = ?, catatan = ?, 
          input_tambahan = ?, foto_bukti_url = ?, status = ?, 
          status_audit = ?, edit_log = ?
         WHERE id = ?`
      ).bind(
        body.kategori,
        body.nominal,
        body.tanggal,
        body.catatan || '',
        JSON.stringify(body.input_tambahan || {}),
        body.foto_bukti_url || null,
        body.status,
        body.status_audit,
        JSON.stringify(body.edit_log || []),
        body.id
      ).run();

      return new Response(JSON.stringify({ success: true }), { headers });
    }

    return new Response(JSON.stringify({ error: 'Method tidak didukung' }), { status: 405, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
