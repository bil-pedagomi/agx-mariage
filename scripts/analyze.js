const XLSX = require("xlsx");
const wb = XLSX.readFile("data/client_claude.xlsx");

const regWs = wb.Sheets["reglements"];
const regData = XLSX.utils.sheet_to_json(regWs);
console.log("=== Reglements date formats (first 5) ===");
regData.slice(0, 5).forEach(r => console.log(JSON.stringify({date: r["Date paiement"], nom: r["Nom client"], mode: r["Mode"], montant: r["Montant (DT)"]})));

const cliWs = wb.Sheets["clients"];
const cliData = XLSX.utils.sheet_to_json(cliWs);
const emptyDates = cliData.filter(c => c["Date inscription"] === undefined || c["Date inscription"] === "");
console.log("\n=== Clients sans date inscription:", emptyDates.length, "===");

const statuts = [...new Set(cliData.map(c => c["Statut"]))];
console.log("\n=== Statuts:", statuts, "===");

const modes = [...new Set(regData.map(r => r["Mode"]))];
console.log("\n=== Modes:", modes, "===");

const debWs = wb.Sheets["debits"];
const debData = XLSX.utils.sheet_to_json(debWs);
const cats = [...new Set(debData.map(d => d["Catégorie"]))];
console.log("\n=== Categories:", cats, "===");

const zeroDebits = debData.filter(d => d["Montant (DT)"] === undefined || d["Montant (DT)"] === 0);
console.log("\n=== Debits montant 0:", zeroDebits.length, "===");

const zeroRegs = regData.filter(r => r["Montant (DT)"] === undefined || r["Montant (DT)"] === 0);
console.log("\n=== Reglements montant 0:", zeroRegs.length, "===");

console.log("\n=== Sample client names (first 10) ===");
cliData.slice(0, 10).forEach(c => console.log("  ID=" + c["ID"] + " | " + c["Nom"] + " | " + (c["Prénom"] || "(vide)")));

console.log("\n=== Sample reglement names (first 10) ===");
regData.slice(0, 10).forEach(r => console.log("  " + r["Nom client"]));

console.log("\n=== Debit designations ===");
const desigs = [...new Set(debData.map(d => d["Désignation"]))];
console.log(desigs);
