const fs = require('fs');
const path = require('path');

function makeSvg(id, initials, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" viewBox="0 0 280 280">
    <defs>
      <linearGradient id="bg_${id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#062C1E"/>
        <stop offset="100%" stop-color="#02140D"/>
      </linearGradient>
      <linearGradient id="gold_${id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F2D07C"/>
        <stop offset="100%" stop-color="#C5A059"/>
      </linearGradient>
    </defs>
    <rect width="280" height="280" fill="url(#bg_${id})"/>
    <circle cx="140" cy="140" r="132" fill="none" stroke="url(#gold_${id})" stroke-width="5"/>
    <circle cx="140" cy="108" r="52" fill="url(#gold_${id})"/>
    <path d="M40 248c0-50 44-84 100-84s100 34 100 84" fill="url(#gold_${id})"/>
    <text x="140" y="124" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="900" fill="#04140E" text-anchor="middle">${initials}</text>
    <rect x="40" y="234" width="200" height="28" rx="14" fill="#04140E" stroke="url(#gold_${id})" stroke-width="2"/>
    <text x="140" y="252" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="900" fill="#F2D07C" text-anchor="middle" letter-spacing="1.5">${title}</text>
  </svg>`;
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, '1.svg'), makeSvg('1', 'NR', 'FOUNDER'));
fs.writeFileSync(path.join(publicDir, '2.svg'), makeSvg('2', 'NS', 'CO-FOUNDER'));
fs.writeFileSync(path.join(publicDir, '3.svg'), makeSvg('3', 'NS', 'DIGITAL OPERATOR'));

console.log('Successfully created founder profile SVG assets in public/ directory.');
