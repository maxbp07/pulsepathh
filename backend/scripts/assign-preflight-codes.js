import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', '..', 'docs', 'preflight');
const sheet = path.join(outDir, 'hoja-registro-codigos.md');

const codes = Array.from({ length: 30 }, (_, i) => `PP-2026-${String(i + 1).padStart(3, '0')}`);

let md = `# Hoja de registro de códigos — preflight 30×14\n\n`;
md += `App: *(URL Vercel pendiente de deploy)*  \n`;
md += `Org: \`study_mixed_2026\`  \n`;
md += `Formato: \`PP-YYYY-NNN\`\n\n`;
md += `| # | Código | Nombre / alias | WhatsApp | Activado | Notas |\n`;
md += `|---|--------|----------------|----------|----------|-------|\n`;
codes.forEach((c, i) => {
  md += `| ${i + 1} | \`${c}\` |  |  |  |  |\n`;
});
md += `\nReserva operativa: \`PP-2026-031\` … \`PP-2026-120\` (ya sembrados en Neon).\n`;
md += `\n> No subir CSV de provision al git. Los códigos en esta hoja son para captación del preflight.\n`;

fs.writeFileSync(sheet, md, 'utf8');
console.log('SHEET_OK', codes.length);
