console.log('Starting test server...');

import express from 'express';

console.log('Express imported');

const app = express();
const PORT = 5000;

console.log('App created');

app.get('/test', (req, res) => {
    res.json({ message: 'Test works!' });
});

console.log('Route added');

app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
});

console.log('Listen called');