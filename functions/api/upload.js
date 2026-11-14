export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    const incomingForm = await request.formData();
    const file = incomingForm.get('file');
    const fileName = incomingForm.get('fileName') || `bukti-${Date.now()}.webp`;

    if (!file) {
      return new Response(JSON.stringify({ error: 'File foto tidak ditemukan' }), { status: 400, headers });
    }

    const ikForm = new FormData();
    ikForm.append('file', file);
    ikForm.append('fileName', fileName);
    ikForm.append('folder', '/kasku-bukti');

    const authHeader = 'Basic ' + btoa(`${env.IMAGEKIT_PRIVATE_KEY}:`);

    const ikRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': authHeader
      },
      body: ikForm
    });

    const ikData = await ikRes.json();
    if (!ikRes.ok) {
      return new Response(JSON.stringify({ error: ikData.message || 'Gagal upload ke ImageKit' }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ publicUrl: ikData.url }), { headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

