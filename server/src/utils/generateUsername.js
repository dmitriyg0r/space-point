import { transliterate } from './transliterate.js';

export function generateUsername(name) {
  let username = transliterate(name.toLowerCase());

  username = username.replace(/[^a-zA-Z0-9_]/g, '');

  if (!username) {
    username = 'user';
  }

  const randomNumbers = Math.floor(10000 + Math.random() * 90000);
  username += randomNumbers;

  return username;
}


