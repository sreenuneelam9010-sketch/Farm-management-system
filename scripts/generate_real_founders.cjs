const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, '..', 'public', 'assets', 'founders');
const srcDir = path.join(__dirname, '..', 'src', 'assets', 'founders');

[publicDir, srcDir].forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

// Founder 1: Neelam Ramachandraiah (Founder)
// White shirt, black curly hair, mustache, red tilak, gold ring
function makeFounder1Svg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <defs>
      <linearGradient id="gold1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#D4AF37"/>
        <stop offset="50%" stop-color="#C5A059"/>
        <stop offset="100%" stop-color="#9A7B38"/>
      </linearGradient>
      <filter id="shadow1" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.3"/>
      </filter>
      <clipPath id="circleClip1">
        <circle cx="400" cy="400" r="370"/>
      </clipPath>
    </defs>

    <!-- Outer Shadow and Background -->
    <rect width="800" height="800" fill="#F8F9FA"/>

    <g clip-path="url(#circleClip1)">
      <!-- Clean White Studio Background -->
      <rect x="0" y="0" width="800" height="800" fill="#FFFFFF"/>
      <radialGradient id="bgGlow1" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#FFFFFF"/>
        <stop offset="100%" stop-color="#F2F4F5"/>
      </radialGradient>
      <rect x="0" y="0" width="800" height="800" fill="url(#bgGlow1)"/>

      <!-- Body / White Shirt -->
      <path d="M220 540 Q400 480 580 540 L650 800 L150 800 Z" fill="#F9FAFB" stroke="#E5E7EB" stroke-width="2"/>
      <!-- Collar -->
      <path d="M320 540 L370 630 L400 640 L430 630 L480 540 L430 520 L400 550 L370 520 Z" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="3"/>
      <path d="M370 630 L400 750 L430 630" fill="none" stroke="#E5E7EB" stroke-width="2"/>
      <!-- Buttons -->
      <circle cx="400" cy="670" r="5" fill="#E5E7EB" stroke="#9CA3AF" stroke-width="1"/>
      <circle cx="400" cy="720" r="5" fill="#E5E7EB" stroke="#9CA3AF" stroke-width="1"/>

      <!-- Neck -->
      <path d="M340 450 L340 540 Q400 570 460 540 L460 450 Z" fill="#A87352"/>

      <!-- Head Base -->
      <ellipse cx="400" cy="380" rx="145" ry="175" fill="#B87E5B"/>
      <!-- Facial Highlights/Shadows -->
      <ellipse cx="400" cy="390" rx="130" ry="155" fill="#C28663"/>
      <ellipse cx="400" cy="340" rx="115" ry="90" fill="#CA8E6B"/>

      <!-- Ears -->
      <ellipse cx="250" cy="380" rx="22" ry="40" fill="#B87E5B"/>
      <ellipse cx="550" cy="380" rx="22" ry="40" fill="#B87E5B"/>

      <!-- Curly Black Hair -->
      <path d="M240 340 Q250 200 400 190 Q550 200 560 340 Q580 270 540 210 Q480 160 400 160 Q320 160 260 210 Q220 270 240 340 Z" fill="#1A181B"/>
      <!-- Curls texture -->
      <circle cx="320" cy="200" r="35" fill="#221F23"/>
      <circle cx="380" cy="185" r="40" fill="#1A181B"/>
      <circle cx="440" cy="195" r="38" fill="#252226"/>
      <circle cx="280" cy="230" r="30" fill="#1A181B"/>
      <circle cx="510" cy="225" r="32" fill="#221F23"/>

      <!-- Eyebrows -->
      <path d="M300 320 Q330 310 360 322" fill="none" stroke="#1A181B" stroke-width="12" stroke-linecap="round"/>
      <path d="M440 322 Q470 310 500 320" fill="none" stroke="#1A181B" stroke-width="12" stroke-linecap="round"/>

      <!-- Eyes -->
      <ellipse cx="330" cy="345" rx="18" ry="12" fill="#FFFFFF"/>
      <circle cx="330" cy="345" r="8" fill="#2C1D11"/>
      <circle cx="332" cy="343" r="3" fill="#FFFFFF"/>

      <ellipse cx="470" cy="345" rx="18" ry="12" fill="#FFFFFF"/>
      <circle cx="470" cy="345" r="8" fill="#2C1D11"/>
      <circle cx="472" cy="343" r="3" fill="#FFFFFF"/>

      <!-- Red Tilak (Sindoor) on forehead -->
      <ellipse cx="400" cy="305" rx="6" ry="10" fill="#DC2626"/>
      <circle cx="400" cy="320" r="3" fill="#F59E0B"/>

      <!-- Nose -->
      <path d="M400 320 L390 410 Q400 425 410 410 Z" fill="#AA704C"/>
      <path d="M380 415 Q400 430 420 415" fill="none" stroke="#8F5B39" stroke-width="4" stroke-linecap="round"/>

      <!-- Mustache -->
      <path d="M320 440 Q370 425 400 442 Q430 425 480 440 Q490 460 450 465 Q400 468 350 465 Q310 460 320 440 Z" fill="#1A181B"/>

      <!-- Mouth / Lips -->
      <path d="M355 475 Q400 488 445 475" fill="none" stroke="#8F5238" stroke-width="6" stroke-linecap="round"/>

      <!-- Subtle Stubble/Beard Shadow -->
      <path d="M310 440 Q400 520 490 440 Q480 510 400 520 Q320 510 310 440 Z" fill="#1A181B" opacity="0.15"/>
    </g>

    <!-- Circular Gold Frame -->
    <circle cx="400" cy="400" r="372" fill="none" stroke="url(#gold1)" stroke-width="16" filter="url(#shadow1)"/>
    <circle cx="400" cy="400" r="364" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.6"/>
  </svg>`;
}

// Founder 2: Neelam Subbaiah (Founder)
// Slate blue shirt, receding hairline, mustache, gold ring
function makeFounder2Svg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <defs>
      <linearGradient id="gold2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#D4AF37"/>
        <stop offset="50%" stop-color="#C5A059"/>
        <stop offset="100%" stop-color="#9A7B38"/>
      </linearGradient>
      <filter id="shadow2" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.3"/>
      </filter>
      <clipPath id="circleClip2">
        <circle cx="400" cy="400" r="370"/>
      </clipPath>
    </defs>

    <rect width="800" height="800" fill="#F8F9FA"/>

    <g clip-path="url(#circleClip2)">
      <!-- Soft Cream Background -->
      <rect x="0" y="0" width="800" height="800" fill="#F5F3EF"/>

      <!-- Body / Slate Blue Button-down Shirt -->
      <path d="M200 540 Q400 480 600 540 L670 800 L130 800 Z" fill="#5A6B7C"/>
      <!-- Collar -->
      <path d="M310 540 L365 630 L400 640 L435 630 L490 540 L430 520 L400 550 L370 520 Z" fill="#4A5A6B" stroke="#3A4A5B" stroke-width="3"/>
      <path d="M365 630 L400 780 L435 630" fill="none" stroke="#3A4A5B" stroke-width="2"/>

      <!-- Neck -->
      <path d="M335 450 L335 540 Q400 570 465 540 L465 450 Z" fill="#AF7857"/>

      <!-- Head Base -->
      <ellipse cx="400" cy="380" rx="150" ry="170" fill="#BE835F"/>
      <ellipse cx="400" cy="390" rx="135" ry="150" fill="#C88C67"/>

      <!-- Ears -->
      <ellipse cx="245" cy="385" rx="22" ry="42" fill="#BE835F"/>
      <ellipse cx="555" cy="385" rx="22" ry="42" fill="#BE835F"/>

      <!-- Receding Hairline Black Hair -->
      <path d="M245 350 Q250 250 310 240 Q350 290 400 290 Q450 290 490 240 Q550 250 555 350 Q575 280 530 210 Q470 170 400 170 Q330 170 270 210 Q225 280 245 350 Z" fill="#1C1A1D"/>

      <!-- Eyebrows -->
      <path d="M295 325 Q330 315 365 328" fill="none" stroke="#1C1A1D" stroke-width="11" stroke-linecap="round"/>
      <path d="M435 328 Q470 315 505 325" fill="none" stroke="#1C1A1D" stroke-width="11" stroke-linecap="round"/>

      <!-- Eyes -->
      <ellipse cx="330" cy="350" rx="18" ry="12" fill="#FFFFFF"/>
      <circle cx="330" cy="350" r="8" fill="#2E1E12"/>
      <circle cx="332" cy="348" r="3" fill="#FFFFFF"/>

      <ellipse cx="470" cy="350" rx="18" ry="12" fill="#FFFFFF"/>
      <circle cx="470" cy="350" r="8" fill="#2E1E12"/>
      <circle cx="472" cy="348" r="3" fill="#FFFFFF"/>

      <!-- Nose -->
      <path d="M400 325 L388 415 Q400 430 412 415 Z" fill="#B37853"/>
      <path d="M378 420 Q400 435 422 420" fill="none" stroke="#965D39" stroke-width="4" stroke-linecap="round"/>

      <!-- Mustache -->
      <path d="M315 442 Q370 428 400 445 Q430 428 485 442 Q495 465 450 468 Q400 472 350 468 Q305 465 315 442 Z" fill="#1C1A1D"/>

      <!-- Mouth / Lips -->
      <path d="M350 480 Q400 492 450 480" fill="none" stroke="#965239" stroke-width="6" stroke-linecap="round"/>

      <!-- Stubble -->
      <path d="M305 440 Q400 525 495 440 Q485 515 400 525 Q315 515 305 440 Z" fill="#1C1A1D" opacity="0.12"/>
    </g>

    <!-- Circular Gold Frame -->
    <circle cx="400" cy="400" r="372" fill="none" stroke="url(#gold2)" stroke-width="16" filter="url(#shadow2)"/>
    <circle cx="400" cy="400" r="364" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.6"/>
  </svg>`;
}

// Founder 3: Neelam Sreenivasulu (Digital Operator)
// Young smiling man, ocean/beach background, patterned shirt, beard, gold ring
function makeFounder3Svg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <defs>
      <linearGradient id="gold3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#D4AF37"/>
        <stop offset="50%" stop-color="#C5A059"/>
        <stop offset="100%" stop-color="#9A7B38"/>
      </linearGradient>
      <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#C5DAE8"/>
        <stop offset="100%" stop-color="#E2EDF5"/>
      </linearGradient>
      <linearGradient id="ocean" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#4A829E"/>
        <stop offset="100%" stop-color="#2D5A73"/>
      </linearGradient>
      <filter id="shadow3" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.3"/>
      </filter>
      <clipPath id="circleClip3">
        <circle cx="400" cy="400" r="370"/>
      </clipPath>
    </defs>

    <rect width="800" height="800" fill="#F8F9FA"/>

    <g clip-path="url(#circleClip3)">
      <!-- Sky Background -->
      <rect x="0" y="0" width="800" height="420" fill="url(#sky)"/>
      <!-- Soft Clouds -->
      <ellipse cx="200" cy="180" rx="150" ry="40" fill="#FFFFFF" opacity="0.6"/>
      <ellipse cx="600" cy="220" rx="180" ry="50" fill="#FFFFFF" opacity="0.5"/>

      <!-- Ocean & Waves -->
      <rect x="0" y="420" width="800" height="380" fill="url(#ocean)"/>
      <path d="M0 430 Q200 410 400 430 Q600 450 800 430 L800 450 Q600 470 400 450 Q200 430 0 450 Z" fill="#6EA8C4" opacity="0.7"/>
      <path d="M0 460 Q250 445 500 460 Q750 475 800 460 L800 490 Q550 500 300 485 Q100 480 0 490 Z" fill="#E8F4F8" opacity="0.8"/>

      <!-- Body / Patterned Casual White Shirt -->
      <path d="M180 560 Q400 500 620 560 L690 800 L110 800 Z" fill="#F8FAFC"/>
      <!-- Embroidered leaves/patterns on shirt -->
      <path d="M240 600 Q260 580 280 610" fill="none" stroke="#CBD5E1" stroke-width="3"/>
      <path d="M520 610 Q540 580 560 600" fill="none" stroke="#CBD5E1" stroke-width="3"/>
      <!-- Open Collar -->
      <path d="M310 560 L370 650 L430 650 L490 560 L420 535 L400 570 L380 535 Z" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>

      <!-- Neck / Chest -->
      <path d="M330 460 L330 570 Q400 600 470 570 L470 460 Z" fill="#A86F4C"/>
      <!-- Chest Hair detail -->
      <path d="M380 550 Q400 540 420 550" fill="none" stroke="#252225" stroke-width="2" opacity="0.4"/>

      <!-- Head Base -->
      <ellipse cx="400" cy="370" rx="135" ry="160" fill="#B87B56"/>
      <ellipse cx="400" cy="380" rx="122" ry="142" fill="#C48660"/>

      <!-- Ears -->
      <ellipse cx="260" cy="370" rx="20" ry="38" fill="#B87B56"/>
      <ellipse cx="540" cy="370" rx="20" ry="38" fill="#B87B56"/>

      <!-- Modern Stylish Black Hair -->
      <path d="M260 320 Q270 180 400 170 Q530 180 540 320 Q560 230 510 180 Q450 140 400 140 Q350 140 290 180 Q240 230 260 320 Z" fill="#1C191C"/>
      <path d="M300 210 Q380 150 450 200 Q410 180 340 195 Z" fill="#2E2A2E"/>

      <!-- Eyebrows -->
      <path d="M305 310 Q335 298 365 312" fill="none" stroke="#1C191C" stroke-width="11" stroke-linecap="round"/>
      <path d="M435 312 Q465 298 495 310" fill="none" stroke="#1C191C" stroke-width="11" stroke-linecap="round"/>

      <!-- Smiling Eyes -->
      <ellipse cx="335" cy="335" rx="17" ry="10" fill="#FFFFFF"/>
      <circle cx="335" cy="335" r="7" fill="#2B1D14"/>
      <circle cx="337" cy="333" r="2.5" fill="#FFFFFF"/>

      <ellipse cx="465" cy="335" rx="17" ry="10" fill="#FFFFFF"/>
      <circle cx="465" cy="335" r="7" fill="#2B1D14"/>
      <circle cx="467" cy="333" r="2.5" fill="#FFFFFF"/>

      <!-- Nose -->
      <path d="M400 310 L390 390 Q400 402 410 390 Z" fill="#AA714D"/>

      <!-- Big Warm Smile with Visible White Teeth -->
      <path d="M330 420 Q400 475 470 420 Z" fill="#1C191C"/>
      <path d="M338 424 Q400 460 462 424 L458 438 Q400 455 342 438 Z" fill="#FFFFFF"/>

      <!-- Full Neat Beard & Mustache -->
      <path d="M265 350 Q260 460 340 500 Q400 520 460 500 Q540 460 535 350 Q520 470 460 508 Q400 528 340 508 Q280 470 265 350 Z" fill="#1C191C"/>
      <path d="M330 408 Q370 395 400 410 Q430 395 470 408 Q480 422 450 424 Q400 428 350 424 Q320 422 330 408 Z" fill="#1C191C"/>
    </g>

    <!-- Circular Gold Frame -->
    <circle cx="400" cy="400" r="372" fill="none" stroke="url(#gold3)" stroke-width="16" filter="url(#shadow3)"/>
    <circle cx="400" cy="400" r="364" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.6"/>
  </svg>`;
}

async function run() {
  const f1Svg = makeFounder1Svg();
  const f2Svg = makeFounder2Svg();
  const f3Svg = makeFounder3Svg();

  const targets = [
    { name: 'founder-1.jpg', svg: f1Svg },
    { name: 'founder-2.jpg', svg: f2Svg },
    { name: 'founder-3.jpg', svg: f3Svg },
  ];

  for (const t of targets) {
    const pubFile = path.join(publicDir, t.name);
    const srcFile = path.join(srcDir, t.name);

    const buf = await sharp(Buffer.from(t.svg))
      .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
      .toBuffer();

    fs.writeFileSync(pubFile, buf);
    fs.writeFileSync(srcFile, buf);
    console.log(`Generated: ${pubFile} and ${srcFile}`);
  }
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
