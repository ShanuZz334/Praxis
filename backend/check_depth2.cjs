const fs = require("fs");
const content = fs.readFileSync("c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
const lines = content.split("\n");

// Track JSX open/close from the beginning of the component function to line 1505
// Find the return( statement first
let returnLine = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('return (') && i > 50) {
        returnLine = i;
        break;
    }
}
console.log("First return( at line:", returnLine + 1);

// Now count div opens/closes from that point to line 1502
let depth = 0;
for (let i = returnLine; i < 1502 && i < lines.length; i++) {
    const line = lines[i];
    // count <div, <span, etc that open
    const opens = (line.match(/<(?!\/)[A-Za-z][^>]*[^/]>/g) || []).length + (line.match(/<(?!\/)[A-Za-z][^>]*[^/]>\s*$/g) || []).length;
    // simpler: just count < not preceded by / 
    const simpleOpens = (line.match(/<div|<span|<p |<button|<label|<input|<select|<form|<section|<nav|<header|<footer|<main|<ul|<li|<table|<tr|<td|<th|<tbody|<thead|<article|<aside|<h[1-6] /g) || []).length;
    const simpleCloses = (line.match(/<\/div>|<\/span>|<\/p>|<\/button>|<\/label>|<\/select>|<\/form>|<\/section>|<\/nav>|<\/header>|<\/footer>|<\/main>|<\/ul>|<\/li>|<\/table>|<\/tr>|<\/td>|<\/th>|<\/tbody>|<\/thead>|<\/article>|<\/aside>|<\/h[1-6]>/g) || []).length;
    depth += simpleOpens - simpleCloses;
}
console.log("JSX element depth at line 1502:", depth);
