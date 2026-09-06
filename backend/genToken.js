import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env') });

const token = jwt.sign({ id: "test_user" }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
console.log("TOKEN=" + token);
