export default function requestLogger(req, res, next) {
  const origin = req.get('Origin');
  const contentType = req.get('Content-Type');
  // eslint-disable-next-line no-console
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${origin} - Content-Type: ${contentType}`);
  if (req.method === 'POST' && req.path.includes('/auth/register')) {
    // eslint-disable-next-line no-console
    console.log('POST body:', JSON.stringify(req.body, null, 2));
  }
  next();
}


