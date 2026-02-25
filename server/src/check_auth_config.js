import dotenv from 'dotenv';
dotenv.config();

console.log('--- ENV CHECK ---');
console.log('CLIENT_ID Exists:', !!process.env.GOOGLE_CLIENT_ID);
if (process.env.GOOGLE_CLIENT_ID) {
    console.log('CLIENT_ID Length:', process.env.GOOGLE_CLIENT_ID.length);
}
console.log('CLIENT_SECRET Exists:', !!process.env.GOOGLE_CLIENT_SECRET);
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('-----------------');
