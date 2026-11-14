export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    const privateKey = (env.IMAGEKIT_PRIVATE_KEY || '').trim();
    if (!privateKey) {
      return new Response(
        JSON.stringify({ error: 'IMAGEKIT_PRIVATE_KEY belum terbaca di Environment Variables Cloudflare Pages.' }),
        { status: 500, headers }
      );
    }

    const incomingForm = await request.formData();
    const file = incomingForm.get('file');
    const rawName = incomingForm.get('fileName') || (file && file.name) || `lampiran-${Date.now()}`;
    const safeFileName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');

    if (!file || typeof file === 'string') {
      return new Response(
        JSON.stringify({ error: 'File tidak ditemukan dalam permintaan unggahan.' }),
        { status: 400, headers }
      );
    }

    // Ubah ke ArrayBuffer lalu Blob baru agar pengiriman ke ImageKit tidak macet (stall)
    const arrayBuffer = await file.arrayBuffer();
    const cleanBlob = new Blob([arrayBuffer], { type: file.type || 'application/octet-stream' });

    const ikForm = new FormData();
    ikForm.append('file', cleanBlob, safeFileName);
    ikForm.append('fileName', safeFileName);
    ikForm.append('folder', '/kasku-bukti');
    ikForm.append('useUniqueFileName', 'true');

    const authHeader = 'Basic ' + btoa(`${privateKey}:`);

    const ikRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': authHeader
      },
      body: ikForm
    });

    const ikText = await ikRes.text();
    let ikData;
    try {
      ikData = JSON.parse(ikText);
    } catch (_) {
      return new Response(
        JSON.stringify({ error: `Respons ImageKit tidak valid (${ikRes.status}): ${ikText.slice(0, 150)}` }),
        { status: 502, headers }
      );
    }

    if (!ikRes.ok) {
      return new Response(
        JSON.stringify({ error: ikData.message || `Gagal upload ke ImageKit (Status ${ikRes.status})` }),
        { status: 500, headers }
      );
    }

    return new Response(
      JSON.stringify({
        publicUrl: ikData.url,
        fileType: ikData.fileType || 'non-image',
        name: ikData.name
      }),
      { headers }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Server Upload Error: ' + err.message }),
      { status: 500, headers }
    );
  }
}
