/**
 * High-fidelity vector SVG representation of the user's Infographic Elements reference image (Screenshot_3.jpg)
 * Rendered at 1200 x 600 with crisp vector graphics, central hub, and 8 staggered ribbon branches.
 */
const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" width="1200" height="600">
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0F172A" flood-opacity="0.12"/>
    </filter>
    <filter id="hubShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#0F172A" flood-opacity="0.16"/>
    </filter>
  </defs>

  <!-- Clean Canvas Background -->
  <rect width="1200" height="600" fill="#FFFFFF"/>

  <!-- Left Ribbons & Branches -->
  <!-- Branch 1 (Top Left) -->
  <g id="branch_l1" filter="url(#shadow)">
    <path d="M 600 240 L 360 240 L 300 100 L 80 100 A 30 30 0 0 0 80 160 L 300 160 L 340 240 Z" fill="#00B4D8"/>
    <rect x="50" y="90" width="220" height="60" rx="30" fill="#00B4D8"/>
    <circle cx="230" cy="120" r="26" fill="#FFFFFF"/>
    <!-- Avatar Icon -->
    <circle cx="230" cy="114" r="8" fill="#1E293B"/>
    <path d="M 218 132 A 12 12 0 0 1 242 132 Z" fill="#1E293B"/>
    <text x="75" y="116" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF">INFOGRAPHIC 01</text>
    <text x="75" y="130" font-family="system-ui, sans-serif" font-size="8" fill="#E0F2FE">Creative visual element</text>
  </g>

  <!-- Branch 2 (Mid-Top Left) -->
  <g id="branch_l2" filter="url(#shadow)">
    <path d="M 600 270 L 370 270 L 320 200 L 80 200 A 30 30 0 0 0 80 260 L 320 260 L 350 270 Z" fill="#0096C7"/>
    <rect x="50" y="195" width="220" height="60" rx="30" fill="#0096C7"/>
    <circle cx="230" cy="225" r="26" fill="#FFFFFF"/>
    <!-- Pie Chart Icon -->
    <path d="M 230 225 L 230 213 A 12 12 0 0 1 242 225 Z" fill="#F59E0B"/>
    <path d="M 230 225 L 242 225 A 12 12 0 1 1 230 213 Z" fill="#3B82F6"/>
    <text x="75" y="221" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF">INFOGRAPHIC 02</text>
    <text x="75" y="235" font-family="system-ui, sans-serif" font-size="8" fill="#E0F2FE">Analytical trend slice</text>
  </g>

  <!-- Branch 3 (Mid-Bottom Left) -->
  <g id="branch_l3" filter="url(#shadow)">
    <path d="M 600 330 L 370 330 L 320 400 L 80 400 A 30 30 0 0 0 80 460 L 320 460 L 350 330 Z" fill="#0077B6"/>
    <rect x="50" y="300" width="220" height="60" rx="30" fill="#0077B6"/>
    <circle cx="230" cy="330" r="26" fill="#FFFFFF"/>
    <!-- Lightbulb Icon -->
    <circle cx="230" cy="324" r="9" fill="none" stroke="#F59E0B" stroke-width="2"/>
    <path d="M 227 335 L 233 335 M 228 338 L 232 338" stroke="#F59E0B" stroke-width="2"/>
    <text x="75" y="326" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF">INFOGRAPHIC 03</text>
    <text x="75" y="340" font-family="system-ui, sans-serif" font-size="8" fill="#E0F2FE">Innovation concept</text>
  </g>

  <!-- Branch 4 (Bottom Left) -->
  <g id="branch_l4" filter="url(#shadow)">
    <path d="M 600 360 L 360 360 L 300 500 L 80 500 A 30 30 0 0 0 80 560 L 300 560 L 340 360 Z" fill="#023E8A"/>
    <rect x="50" y="405" width="220" height="60" rx="30" fill="#023E8A"/>
    <circle cx="230" cy="435" r="26" fill="#FFFFFF"/>
    <!-- Chat Bubbles Icon -->
    <path d="M 222 430 A 8 7 0 0 1 234 430 A 8 7 0 0 1 222 439 L 220 442 L 221 437 Z" fill="#F97316"/>
    <path d="M 230 435 A 7 6 0 0 1 240 435 A 7 6 0 0 1 230 443 L 229 445 L 230 441 Z" fill="#3B82F6"/>
    <text x="75" y="431" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF">INFOGRAPHIC 04</text>
    <text x="75" y="445" font-family="system-ui, sans-serif" font-size="8" fill="#E0F2FE">Collaboration channel</text>
  </g>

  <!-- Right Ribbons & Branches -->
  <!-- Branch 5 (Top Right) -->
  <g id="branch_r1" filter="url(#shadow)">
    <path d="M 600 240 L 840 240 L 900 100 L 1120 100 A 30 30 0 0 1 1120 160 L 900 160 L 860 240 Z" fill="#023E8A"/>
    <rect x="930" y="90" width="220" height="60" rx="30" fill="#023E8A"/>
    <circle cx="970" cy="120" r="26" fill="#FFFFFF"/>
    <!-- Bar Chart Icon -->
    <rect x="960" y="122" width="4" height="10" fill="#F59E0B"/>
    <rect x="968" y="116" width="4" height="16" fill="#06B6D4"/>
    <rect x="976" y="110" width="4" height="22" fill="#3B82F6"/>
    <text x="1010" y="116" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF">INFOGRAPHIC 05</text>
    <text x="1010" y="130" font-family="system-ui, sans-serif" font-size="8" fill="#E0F2FE">Performance metrics</text>
  </g>

  <!-- Branch 6 (Mid-Top Right) -->
  <g id="branch_r2" filter="url(#shadow)">
    <path d="M 600 270 L 830 270 L 880 200 L 1120 200 A 30 30 0 0 1 1120 260 L 880 260 L 850 270 Z" fill="#0077B6"/>
    <rect x="930" y="195" width="220" height="60" rx="30" fill="#0077B6"/>
    <circle cx="970" cy="225" r="26" fill="#FFFFFF"/>
    <!-- Search Magnifier Icon -->
    <circle cx="968" cy="222" r="8" fill="none" stroke="#F59E0B" stroke-width="2.5"/>
    <line x1="974" y1="228" x2="981" y2="235" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round"/>
    <text x="1010" y="221" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF">INFOGRAPHIC 06</text>
    <text x="1010" y="235" font-family="system-ui, sans-serif" font-size="8" fill="#E0F2FE">Research & discovery</text>
  </g>

  <!-- Branch 7 (Mid-Bottom Right) -->
  <g id="branch_r3" filter="url(#shadow)">
    <path d="M 600 330 L 830 330 L 880 400 L 1120 400 A 30 30 0 0 1 1120 460 L 880 460 L 850 330 Z" fill="#0096C7"/>
    <rect x="930" y="300" width="220" height="60" rx="30" fill="#0096C7"/>
    <circle cx="970" cy="330" r="26" fill="#FFFFFF"/>
    <!-- Gear Icon -->
    <circle cx="970" cy="330" r="7" fill="none" stroke="#64748B" stroke-width="3"/>
    <circle cx="970" cy="330" r="3" fill="#64748B"/>
    <text x="1010" y="326" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF">INFOGRAPHIC 07</text>
    <text x="1010" y="340" font-family="system-ui, sans-serif" font-size="8" fill="#E0F2FE">Operational process</text>
  </g>

  <!-- Branch 8 (Bottom Right) -->
  <g id="branch_r4" filter="url(#shadow)">
    <path d="M 600 360 L 840 360 L 900 500 L 1120 500 A 30 30 0 0 1 1120 560 L 900 560 L 860 360 Z" fill="#00B4D8"/>
    <rect x="930" y="405" width="220" height="60" rx="30" fill="#00B4D8"/>
    <circle cx="970" cy="435" r="26" fill="#FFFFFF"/>
    <!-- Trend Growth Icon -->
    <path d="M 960 442 L 968 436 L 974 440 L 982 428" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round"/>
    <polygon points="980,426 984,428 982,433" fill="#10B981"/>
    <text x="1010" y="431" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF">INFOGRAPHIC 08</text>
    <text x="1010" y="445" font-family="system-ui, sans-serif" font-size="8" fill="#E0F2FE">Exponential growth</text>
  </g>

  <!-- Central Circular Hub -->
  <g id="central_hub" filter="url(#hubShadow)">
    <!-- Outer segment ring -->
    <circle cx="600" cy="300" r="130" fill="none" stroke="#00B4D8" stroke-width="12" stroke-dasharray="190 14" stroke-dashoffset="10"/>
    <circle cx="600" cy="300" r="130" fill="none" stroke="#023E8A" stroke-width="12" stroke-dasharray="190 14" stroke-dashoffset="214"/>
    <!-- Inner Hub Disc -->
    <circle cx="600" cy="300" r="115" fill="#FFFFFF"/>
    <circle cx="600" cy="300" r="110" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="3"/>
    <!-- Text -->
    <text x="600" y="285" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="900" fill="#334155" text-anchor="middle" letter-spacing="2">INFOGRAPHICS</text>
    <text x="600" y="315" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="900" fill="#0F172A" text-anchor="middle" letter-spacing="3">ELEMENTS</text>
    <!-- Four colorful indicator blocks -->
    <rect x="562" y="332" width="14" height="14" rx="2" fill="#00B4D8"/>
    <rect x="581" y="332" width="14" height="14" rx="2" fill="#0096C7"/>
    <rect x="600" y="332" width="14" height="14" rx="2" fill="#0077B6"/>
    <rect x="619" y="332" width="14" height="14" rx="2" fill="#023E8A"/>
  </g>
</svg>`;

export const INFOGRAPHIC_ELEMENTS_SVG_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
