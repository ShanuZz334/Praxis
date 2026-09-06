import db from "./config/localDb.js";
try {
    const stmt = db.prepare("SELECT 1");
    console.log(stmt.get());
} catch(err) {
    console.error("SQLite Error:", err);
}
