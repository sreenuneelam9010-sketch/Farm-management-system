const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(__dirname, '..', 'public', 'assets', 'founders');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

function generateFounderSvg(id, initials, name, title) {
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
      <linearGradient id="bg_${safeId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#041E15"/>
        <stop offset="50%" stop-color="#062C1E"/>
        <stop offset="100%" stop-color="#02140D"/>
      </linearGradient>

      <linearGradient id="gold_${safeId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFE4A0"/>
        <stop offset="50%" stop-color="#C5A059"/>
        <stop offset="100%" stop-color="#8C6A2D"/>
      </linearGradient>

      <radialGradient id="glow_${safeId}" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stop-color="#C5A059" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#062C1E" stop-opacity="0"/>
      </radialGradient>

      <filter id="shadow_${safeId}" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.5"/>
      </filter>
    </defs>

    <!-- Background Canvas -->
    <rect width="600" height="600" fill="url(#bg_${safeId})"/>
    <circle cx="300" cy="240" r="200" fill="url(#glow_${safeId})"/>

    <!-- Outer Decorative Rings -->
    <circle cx="300" cy="300" r="280" fill="none" stroke="url(#gold_${safeId})" stroke-width="3" opacity="0.4"/>
    <circle cx="300" cy="300" r="268" fill="none" stroke="url(#gold_${safeId})" stroke-width="8" filter="url(#shadow_${safeId})"/>

    <!-- Portrait Silhouette / Base -->
    <g filter="url(#shadow_${safeId})">
      <!-- Head Circle -->
      <circle cx="300" cy="230" r="110" fill="url(#gold_${safeId})"/>
      
      <!-- Torso Base -->
      <path d="M100 520 C 100 400, 200 350, 300 350 C 400 350, 500 400, 500 520 Z" fill="url(#gold_${safeId})"/>
      
      <!-- Initials Overlay -->
      <text x="300" y="265" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="96" font-weight="900" fill="#04140E" text-anchor="middle" letter-spacing="2">${initials}</text>
    </g>

    <!-- Name Badge Card -->
    <g filter="url(#shadow_${safeId})">
      <rect x="80" y="480" width="440" height="72" rx="36" fill="#02140D" stroke="url(#gold_${safeId})" stroke-width="3"/>
      <text x="300" y="514" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" fill="#FFFFFF" text-anchor="middle">${name}</text>
      <text x="300" y="538" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#F2D07C" text-anchor="middle" letter-spacing="3">${title}</text>
    </g>
  </svg>`;
}

async function main() {
  const founders = [
    { id: 'founder-1', name: 'Neelam Ramachandraiah', title: 'FOUNDER &amp; MANAGING DIRECTOR', initials: 'NR' },
    { id: 'founder-2', name: 'Neelam Subbaiah', title: 'CO-FOUNDER &amp; FIELD OPERATIONS', initials: 'NS' },
    { id: 'founder-3', name: 'Neelam Sreenivasulu', title: 'DIGITAL OPERATOR &amp; TECH LEAD', initials: 'NS' },
  ];

  for (const f of founders) {
    const svgContent = generateFounderSvg(f.id, f.initials, f.name, f.title);
    const jpgPath = path.join(dir, `${f.id}.jpg`);
    
    await sharp(Buffer.from(svgContent))
      .jpeg({ quality: 95 })
      .toFile(jpgPath);

    console.log(`Successfully generated: ${jpgPath}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
