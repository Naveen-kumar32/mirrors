/*
 * Create a staff account from the command line:
 *   npm run create-admin -- "Owner Name" owner@example.com "a-strong-password"
 *   npm run create-admin -- "Staff Name" staff@example.com "a-strong-password" employee
 */
import { db } from './db.js';
import { createUser, passwordProblem } from './auth.js';

const [name, email, password, role = 'admin'] = process.argv.slice(2);

if (!name || !email || !password || !['admin', 'employee'].includes(role)) {
  console.error('Usage: npm run create-admin -- "Full Name" email@example.com "password" [admin|employee]');
  process.exit(1);
}
const problem = passwordProblem(password);
if (problem) {
  console.error(problem);
  process.exit(1);
}
if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email.toLowerCase())) {
  console.error(`An account for ${email} already exists.`);
  process.exit(1);
}
createUser({ name, email, password, role });
console.log(`Created ${role} account for ${email}`);
