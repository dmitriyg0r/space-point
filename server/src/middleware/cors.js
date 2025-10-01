export default function corsMiddleware(req, res, next) {
  const origin = req.get('Origin');
  res.header('Access-Control-Allow-Origin', origin || 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-id');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
}


