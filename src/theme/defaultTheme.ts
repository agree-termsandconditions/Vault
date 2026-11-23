import { SiteTheme } from '../types';

export const STRING_LIGHTS_SVG = `<svg viewBox="0 0 1440 26" preserveAspectRatio="none" style="width:100%;height:100%;display:block;"><path d="M0,4 Q36,16 72,4 T144,4 T216,4 T288,4 T360,4 T432,4 T504,4 T576,4 T648,4 T720,4 T792,4 T864,4 T936,4 T1008,4 T1080,4 T1152,4 T1224,4 T1296,4 T1368,4 T1440,4" fill="none" stroke="#1e293b" stroke-width="1.6"/>${Array.from({ length: 28 }, (_, i) => {
  const colors = ["#ef4444", "#fbbf24", "#22c55e", "#38bdf8", "#f472b6"];
  const c = colors[i % colors.length];
  const x = i * 52 + 24;
  const delay = (i % 5) * 0.35;
  return `<circle cx="${x}" cy="13" r="4.2" fill="${c}" style="animation:wwBulbGlow 1.8s ${delay}s ease-in-out infinite;"/>`;
}).join("")}</svg>`;

export const SNOWBANK_FOOTER_SVG = `<svg viewBox="0 0 1440 84" preserveAspectRatio="none" style="width:100%;height:100%;display:block;"><path d="M0,44 C220,24 410,56 670,34 C910,14 1140,52 1440,32 L1440,84 L0,84 Z" fill="#e0f2fe"/><path d="M0,52 C160,36 330,62 540,48 C760,34 960,62 1190,44 C1310,35 1385,44 1440,50 L1440,84 L0,84 Z" fill="#ffffff" stroke="#bae6fd" stroke-width="1.2"/></svg>`;

export const TREE_SNOWMAN_GIFTS_SVG = `<svg viewBox="0 0 200 98" style="width:100%;height:auto;overflow:visible;"><ellipse cx="100" cy="91" rx="92" ry="5.5" fill="#94a3b8" opacity="0.32"/><rect x="36" y="77" width="10" height="13" rx="2" fill="#78350f"/><path d="M41 46 L8 79 L74 79 Z" fill="#15803d"/><path d="M41 29 L13 59 L69 59 Z" fill="#16a34a"/><path d="M41 14 L20 39 L62 39 Z" fill="#22c55e"/><circle cx="33" cy="33" r="2.5" fill="#ef4444"/><circle cx="49" cy="35" r="2.3" fill="#fbbf24"/><circle cx="27" cy="51" r="2.7" fill="#38bdf8"/><circle cx="55" cy="52" r="2.5" fill="#fbbf24"/><circle cx="22" cy="70" r="2.8" fill="#fbbf24"/><circle cx="41" cy="69" r="2.8" fill="#38bdf8"/><circle cx="59" cy="71" r="2.8" fill="#ef4444"/><polygon points="41,3 43.4,8.3 49.2,8.9 44.8,12.7 46.1,18.3 41,15.3 35.9,18.3 37.2,12.7 32.8,8.9 38.6,8.3" fill="#fbbf24"/><g transform="translate(76,33) scale(0.58)"><line x1="24" y1="54" x2="8" y2="47" stroke="#78350f" stroke-width="2.8" stroke-linecap="round"/><line x1="64" y1="53" x2="81" y2="42" stroke="#78350f" stroke-width="2.8" stroke-linecap="round"/><ellipse cx="44" cy="68" rx="25" ry="23" fill="#ffffff" stroke="#94a3b8" stroke-width="1.2"/><circle cx="43" cy="61" r="2.3" fill="#1e293b"/><circle cx="43" cy="70" r="2.3" fill="#1e293b"/><circle cx="43" cy="79" r="2.2" fill="#1e293b"/><circle cx="44" cy="34" r="17.5" fill="#ffffff" stroke="#94a3b8" stroke-width="1.2"/><ellipse cx="33.5" cy="37.5" rx="3.4" ry="2.2" fill="#fb7185" opacity="0.65"/><ellipse cx="53.5" cy="37.5" rx="3.4" ry="2.2" fill="#fb7185" opacity="0.65"/><path d="M35.5 31.5 Q37.8 28.5 40 31.5" fill="none" stroke="#1e293b" stroke-width="2.2" stroke-linecap="round"/><path d="M47 31.5 Q49.2 28.5 51.5 31.5" fill="none" stroke="#1e293b" stroke-width="2.2" stroke-linecap="round"/><polygon points="43,33.5 55,36 43,38.2" fill="#f97316"/><rect x="28" y="45.5" width="32" height="7.5" rx="3.7" fill="#dc2626"/><path d="M51 47 L58 63 L50 65 L45 49 Z" fill="#dc2626"/><g transform="translate(43,17) rotate(-8)"><ellipse cx="0" cy="2" rx="18" ry="3.6" fill="#0f172a"/><rect x="-11.5" y="-14" width="23" height="16" rx="2" fill="#1e293b"/><rect x="-11.5" y="-4.5" width="23" height="4" fill="#dc2626"/><circle cx="7.5" cy="-3" r="1.8" fill="#ef4444"/></g></g><rect x="131" y="67" width="31" height="23" rx="3" fill="#dc2626"/><rect x="144" y="65" width="5" height="25" fill="#fbbf24"/><rect x="131" y="76" width="31" height="4.5" fill="#fbbf24"/><rect x="166" y="72" width="26" height="18" rx="2.5" fill="#10b981"/><rect x="176.8" y="70" width="4.4" height="20" fill="#fbbf24"/><rect x="166" y="79.5" width="26" height="3.8" fill="#fbbf24"/></svg>`;

export const WINTER_WONDERLAND_THEME: SiteTheme = {
  id: 'winter-wonderland',
  name: 'Winter Wonderland (Holiday 2026)',
  description: 'Festive holiday theme with navbar string lights, running Santa sleigh, snowbanks, tree & snowman corner scene, Christmas Fox mascot, and 4 rotating card skins.',
  author: 'Campus Study Vault Team',
  version: '1.3.0',
  createdAt: '2026-11-20T00:00:00.000Z',
  isBuiltIn: true,
  mascotOverride: '/assets/themes/fox-idle.png',
  navbar: {
    bannerText: "❄️ Season's Greetings & Happy Holidays from Campus Study Vault! 🎄",
    bannerBg: 'linear-gradient(90deg, #064e3b, #991b1b, #064e3b)',
    bannerTextColor: '#ffffff',
    stringLights: true,
    stringLightsSvg: STRING_LIGHTS_SVG,
    runnerHeight: 42,
    runnerAnimation: 'slide',
  },
  footer: {
    blendHeight: 54,
    blendSvg: SNOWBANK_FOOTER_SVG,
  },
  corners: {
    scaleOnMobile: true,
    bottomLeftSvg: TREE_SNOWMAN_GIFTS_SVG,
  },
  ambient: {
    type: 'snow',
    fallingSnow: true,
    runningSanta: true,
    festiveCursor: true,
    particleColor: 'rgba(255, 255, 255, 0.82)',
    particleCount: 55,
    speed: 1,
  },
  cardSkins: [
    // Variant 1 (Warm Cream): Top-left holly garland + bottom-left red cardinal
    {
      id: 'variant-1-warm-cream',
      name: 'Warm Cream Holly & Cardinal',
      bgColor: '#fffdf5',
      borderColor: '#fef3c7',
      decorations: {
        topLeftSvg: `<svg viewBox="0 0 110 50" style="width:78px;height:auto;overflow:visible;pointer-events:none;display:block;"><path d="M12 28 C6 22 2 12 10 4 C18 -2 28 6 32 14 C26 14 20 20 18 26 Z" fill="#15803d"/><path d="M14 6 L22 18" stroke="#166534" stroke-width="1.2" stroke-linecap="round"/><path d="M28 8 C36 4 48 6 52 16 C54 24 46 28 38 24 C40 18 36 12 28 8 Z" fill="#166534"/><path d="M32 10 L44 18" stroke="#14532d" stroke-width="1.2" stroke-linecap="round"/><path d="M6 18 C-1 24 1 36 10 38 C18 40 22 32 20 24 C14 24 10 20 6 18 Z" fill="#15803d"/><circle cx="20" cy="18" r="4.2" fill="#dc2626"/><circle cx="18.8" cy="16.8" r="1.3" fill="#ffffff" opacity="0.85"/><circle cx="26" cy="17" r="3.8" fill="#b91c1c"/><circle cx="25" cy="15.8" r="1.2" fill="#ffffff" opacity="0.85"/><circle cx="22" cy="24" r="4" fill="#ef4444"/><circle cx="21" cy="22.8" r="1.3" fill="#ffffff" opacity="0.85"/><path d="M24 20 C22 14 12 12 10 17 C8 22 18 23 23 21 Z" fill="#b91c1c"/><path d="M24 20 C26 14 36 12 38 17 C40 22 30 23 25 21 Z" fill="#b91c1c"/><ellipse cx="24" cy="20.5" rx="3.5" ry="3" fill="#dc2626"/><path d="M22 23 Q18 32 14 38 Q17 37 20 35 Q22 31 23 24 Z" fill="#991b1b"/><path d="M26 23 Q30 32 34 38 Q31 37 28 35 Q26 31 25 24 Z" fill="#991b1b"/></svg>`,
        bottomLeftSvg: `<svg viewBox="0 0 110 75" style="width:82px;height:auto;overflow:visible;pointer-events:none;display:block;"><path d="M-5 62 Q35 56 70 58 Q85 59 95 62" stroke="#78350f" stroke-width="3.5" stroke-linecap="round" fill="none"/><path d="M15 60 L8 48 M18 60 L14 46 M22 60 L22 45 M25 61 L30 47 M28 61 L36 50" stroke="#166534" stroke-width="1.8" stroke-linecap="round"/><path d="M60 58 L54 48 M63 58 L62 45 M67 58 L72 46 M70 59 L78 50" stroke="#15803d" stroke-width="1.8" stroke-linecap="round"/><path d="M38 52 L20 66 L25 68 L42 54 Z" fill="#991b1b"/><ellipse cx="48" cy="46" rx="13" ry="10" transform="rotate(-15 48 46)" fill="#dc2626"/><path d="M42 43 Q48 40 54 45 Q48 55 38 52 Z" fill="#b91c1c"/><circle cx="58" cy="36" r="7.5" fill="#dc2626"/><polygon points="56,36 53,24 62,31" fill="#dc2626"/><polygon points="58,34 65,37 62,41 57,39" fill="#0f172a"/><circle cx="59.5" cy="35.5" r="1.1" fill="#ffffff"/><circle cx="59.7" cy="35.5" r="0.6" fill="#000000"/><polygon points="64,36 71,37.5 64,39.5" fill="#f59e0b"/><path d="M46 54 L44 59 M51 53 L50 58" stroke="#451a03" stroke-width="1.8" stroke-linecap="round"/></svg>`,
      },
    },
    // Variant 2 (Soft Ice Blue): Hanging gold stars + snowy winter cabin, pine trees & deer
    {
      id: 'variant-2-soft-ice-blue',
      name: 'Soft Ice Blue Cabin & Deer',
      bgColor: '#f1f8fe',
      borderColor: '#dbeafe',
      decorations: {
        topSvg: `<svg viewBox="0 0 240 38" preserveAspectRatio="none" style="width:100%;height:26px;overflow:visible;pointer-events:none;display:block;"><line x1="25" y1="0" x2="25" y2="18" stroke="#d97706" stroke-width="0.9" stroke-dasharray="1.5,1"/><polygon points="25,18 26.8,22 31,22.3 27.8,25 28.8,29 25,26.8 21.2,29 22.2,25 19,22.3 23.2,22" fill="#fbbf24" stroke="#d97706" stroke-width="0.5"/><line x1="75" y1="0" x2="75" y2="11" stroke="#d97706" stroke-width="0.9" stroke-dasharray="1.5,1"/><polygon points="75,11 76.5,14.5 80,14.8 77.3,17 78.1,20.5 75,18.7 71.9,20.5 72.7,17 70,14.8 73.5,14.5" fill="#f59e0b" stroke="#d97706" stroke-width="0.4"/><line x1="125" y1="0" x2="125" y2="22" stroke="#d97706" stroke-width="0.9" stroke-dasharray="1.5,1"/><polygon points="125,22 127,26.5 132,27 128,30.2 129.2,35 125,32.3 120.8,35 122,30.2 118,27 123,26.5" fill="#fde047" stroke="#d97706" stroke-width="0.5"/><line x1="175" y1="0" x2="175" y2="13" stroke="#d97706" stroke-width="0.9" stroke-dasharray="1.5,1"/><polygon points="175,13 176.5,16.5 180,16.8 177.3,19 178.1,22.5 175,20.7 171.9,22.5 172.7,19 170,16.8 173.5,16.5" fill="#f59e0b" stroke="#d97706" stroke-width="0.4"/><line x1="215" y1="0" x2="215" y2="19" stroke="#d97706" stroke-width="0.9" stroke-dasharray="1.5,1"/><polygon points="215,19 216.8,23 221,23.3 217.8,26 218.8,30 215,27.8 211.2,30 212.2,26 209,23.3 213.2,23" fill="#fbbf24" stroke="#d97706" stroke-width="0.5"/></svg>`,
        bottomSvg: `<svg viewBox="0 0 260 48" preserveAspectRatio="none" style="width:100%;height:38px;overflow:visible;pointer-events:none;display:block;"><path d="M0 32 Q40 24 85 28 Q140 33 180 26 Q220 20 260 27 L260 48 L0 48 Z" fill="#e0f2fe" opacity="0.9"/><path d="M0 38 Q50 32 110 37 Q170 42 220 35 Q245 32 260 36 L260 48 L0 48 Z" fill="#ffffff"/><polygon points="28,14 20,26 36,26" fill="#1e3a5f"/><polygon points="28,8 23,17 33,17" fill="#2563eb" opacity="0.8"/><polygon points="16,18 10,29 22,29" fill="#1e293b"/><rect x="46" y="22" width="26" height="15" rx="1" fill="#78350f"/><polygon points="59,13 42,23 76,23" fill="#92400e"/><path d="M59 12 L41 23 Q59 20 77 23 Z" fill="#ffffff"/><rect x="67" y="15" width="4" height="6" fill="#451a03"/><circle cx="69" cy="11" r="1.5" fill="#cbd5e1" opacity="0.7"/><circle cx="71" cy="7" r="2" fill="#cbd5e1" opacity="0.5"/><rect x="52" y="26" width="6" height="6" rx="1" fill="#fbbf24"/><line x1="55" y1="26" x2="55" y2="32" stroke="#78350f" stroke-width="0.8"/><line x1="52" y1="29" x2="58" y2="29" stroke="#78350f" stroke-width="0.8"/><polygon points="175,16 168,28 182,28" fill="#1e3a5f"/><polygon points="175,9 170,18 180,18" fill="#3b82f6" opacity="0.7"/><g transform="translate(205, 14)"><path d="M12 4 L14 1 M12 3 L10 1 M13 2 L15 3" stroke="#78350f" stroke-width="0.9" stroke-linecap="round"/><polygon points="11,5 14,8 10,10 9,7" fill="#78350f"/><polygon points="13,8 16,9 13,10" fill="#92400e"/><ellipse cx="7" cy="13" rx="6" ry="4" fill="#78350f"/><line x1="4" y1="16" x2="3" y2="24" stroke="#78350f" stroke-width="1.2" stroke-linecap="round"/><line x1="6" y1="16" x2="6" y2="24" stroke="#78350f" stroke-width="1.2" stroke-linecap="round"/><line x1="10" y1="16" x2="11" y2="24" stroke="#78350f" stroke-width="1.2" stroke-linecap="round"/><line x1="12" y1="16" x2="13" y2="24" stroke="#78350f" stroke-width="1.2" stroke-linecap="round"/><circle cx="1" cy="11" r="1.2" fill="#f8fafc"/></g></svg>`,
      },
    },
    // Variant 3 (Soft Mint Green): Hanging mistletoe + Christmas tree with gifts
    {
      id: 'variant-3-soft-mint-green',
      name: 'Soft Mint Green Mistletoe & Tree',
      bgColor: '#f0fbf5',
      borderColor: '#d1fae5',
      decorations: {
        topLeftSvg: `<svg viewBox="0 0 90 60" style="width:68px;height:auto;overflow:visible;pointer-events:none;display:block;"><line x1="18" y1="0" x2="18" y2="12" stroke="#dc2626" stroke-width="1.5"/><path d="M18 14 C12 8 4 10 5 16 C6 20 14 18 18 15 Z" fill="#dc2626"/><path d="M18 14 C24 8 32 10 31 16 C30 20 22 18 18 15 Z" fill="#dc2626"/><circle cx="18" cy="14.5" r="3" fill="#b91c1c"/><path d="M16 17 Q12 26 9 32 Q13 30 15 26 Z" fill="#991b1b"/><path d="M20 17 Q24 26 27 32 Q23 30 21 26 Z" fill="#991b1b"/><path d="M17 18 C10 24 6 36 14 42 C18 36 20 26 18 20 Z" fill="#10b981"/><path d="M19 18 C26 24 30 36 22 42 C18 36 16 26 18 20 Z" fill="#059669"/><path d="M18 19 C14 26 16 38 20 44 C22 36 21 27 19 20 Z" fill="#34d399"/><circle cx="15" cy="22" r="2.8" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.5"/><circle cx="21" cy="23" r="2.6" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.5"/><circle cx="18" cy="26" r="2.5" fill="#f8fafc" stroke="#cbd5e1" stroke-width="0.5"/></svg>`,
        bottomRightSvg: `<svg viewBox="0 0 115 95" style="width:84px;height:auto;overflow:visible;pointer-events:none;display:block;"><rect x="36" y="74" width="10" height="15" rx="1.5" fill="#78350f"/><polygon points="41,20 14,50 68,50" fill="#14532d"/><polygon points="41,36 10,66 72,66" fill="#166534"/><polygon points="41,52 6,80 76,80" fill="#15803d"/><polygon points="41,9 43,15 49,15.5 44.5,19.5 46,25 41,22 36,25 37.5,19.5 33,15.5 39,15" fill="#fbbf24" stroke="#d97706" stroke-width="0.6"/><circle cx="28" cy="46" r="2.8" fill="#ef4444"/><circle cx="52" cy="44" r="2.8" fill="#fbbf24"/><circle cx="24" cy="62" r="3" fill="#3b82f6"/><circle cx="42" cy="60" r="3" fill="#ef4444"/><circle cx="58" cy="61" r="3" fill="#fbbf24"/><circle cx="20" cy="76" r="3.2" fill="#fbbf24"/><circle cx="36" cy="74" r="3" fill="#ec4899"/><circle cx="62" cy="75" r="3.2" fill="#ef4444"/><path d="M22 49 Q41 56 60 48" stroke="#fde047" stroke-width="1.1" stroke-dasharray="2,2" fill="none"/><path d="M16 65 Q41 72 66 64" stroke="#fde047" stroke-width="1.1" stroke-dasharray="2,2" fill="none"/><rect x="74" y="65" width="22" height="19" rx="2" fill="#dc2626"/><rect x="83" y="63" width="4" height="21" fill="#fbbf24"/><rect x="74" y="73" width="22" height="3.5" fill="#fbbf24"/><rect x="94" y="71" width="16" height="13" rx="1.5" fill="#059669"/><rect x="100.5" y="69.5" width="3" height="14.5" fill="#ffffff"/></svg>`,
      },
    },
    // Variant 4 (Soft Blush Pink): Fairy lights along top + penguin with Santa hat & gift box
    {
      id: 'variant-4-soft-blush-pink',
      name: 'Soft Blush Pink Fairy Lights & Penguin',
      bgColor: '#fff0f6',
      borderColor: '#fce7f3',
      decorations: {
        topSvg: `<svg viewBox="0 0 240 32" preserveAspectRatio="none" style="width:100%;height:22px;overflow:visible;pointer-events:none;display:block;"><path d="M0 6 Q30 18 60 8 Q90 20 120 7 Q150 19 180 8 Q210 20 240 6" stroke="#475569" stroke-width="1" fill="none"/><rect x="29" y="11" width="2" height="3" fill="#334155"/><ellipse cx="30" cy="17" rx="3.5" ry="4.5" fill="#ef4444"/><circle cx="29" cy="15.5" r="1" fill="#ffffff" opacity="0.8"/><rect x="59" y="7" width="2" height="3" fill="#334155"/><ellipse cx="60" cy="13" rx="3.5" ry="4.5" fill="#f59e0b"/><circle cx="59" cy="11.5" r="1" fill="#ffffff" opacity="0.8"/><rect x="89" y="12" width="2" height="3" fill="#334155"/><ellipse cx="90" cy="18" rx="3.5" ry="4.5" fill="#10b981"/><circle cx="89" cy="16.5" r="1" fill="#ffffff" opacity="0.8"/><rect x="119" y="6" width="2" height="3" fill="#334155"/><ellipse cx="120" cy="12" rx="3.5" ry="4.5" fill="#3b82f6"/><circle cx="119" cy="10.5" r="1" fill="#ffffff" opacity="0.8"/><rect x="149" y="12" width="2" height="3" fill="#334155"/><ellipse cx="150" cy="18" rx="3.5" ry="4.5" fill="#ec4899"/><circle cx="149" cy="16.5" r="1" fill="#ffffff" opacity="0.8"/><rect x="179" y="7" width="2" height="3" fill="#334155"/><ellipse cx="180" cy="13" rx="3.5" ry="4.5" fill="#f59e0b"/><circle cx="179" cy="11.5" r="1" fill="#ffffff" opacity="0.8"/><rect x="209" y="12" width="2" height="3" fill="#334155"/><ellipse cx="210" cy="18" rx="3.5" ry="4.5" fill="#ef4444"/><circle cx="209" cy="16.5" r="1" fill="#ffffff" opacity="0.8"/></svg>`,
        bottomLeftSvg: `<svg viewBox="0 0 110 85" style="width:80px;height:auto;overflow:visible;pointer-events:none;display:block;"><ellipse cx="38" cy="54" rx="16" ry="20" fill="#0f172a"/><ellipse cx="38" cy="57" rx="11" ry="15" fill="#ffffff"/><ellipse cx="20" cy="54" rx="4" ry="11" transform="rotate(20 20 54)" fill="#0f172a"/><ellipse cx="56" cy="54" rx="4" ry="11" transform="rotate(-20 56 54)" fill="#0f172a"/><ellipse cx="31" cy="74" rx="6" ry="3" fill="#f97316"/><ellipse cx="45" cy="74" rx="6" ry="3" fill="#f97316"/><circle cx="34" cy="44" r="2.2" fill="#0f172a"/><circle cx="33.5" cy="43.5" r="0.7" fill="#ffffff"/><circle cx="42" cy="44" r="2.2" fill="#0f172a"/><circle cx="41.5" cy="43.5" r="0.7" fill="#ffffff"/><polygon points="36,47 40,47 38,51" fill="#f97316"/><rect x="26" y="48" width="24" height="6" rx="2.5" fill="#15803d"/><path d="M44 52 L42 66 L48 66 L49 52 Z" fill="#16a34a"/><rect x="42.5" y="56" width="6" height="2.5" fill="#dc2626"/><path d="M26 38 C28 24 48 24 50 38 Z" fill="#dc2626"/><path d="M48 28 Q58 32 56 40" stroke="#dc2626" stroke-width="4.5" stroke-linecap="round" fill="none"/><circle cx="56" cy="42" r="3.5" fill="#ffffff"/><rect x="24" y="36" width="28" height="5" rx="2.5" fill="#ffffff"/><rect x="66" y="55" width="22" height="19" rx="2" fill="#ec4899"/><rect x="75" y="53" width="4" height="21" fill="#fef08a"/><rect x="66" y="63" width="22" height="3.5" fill="#fef08a"/><circle cx="77" cy="52" r="2.5" fill="#fef08a"/></svg>`,
      },
    },
  ],
};

export const STARTER_THEME_TEMPLATE = {
  $schema: 'https://vault.campus/schemas/theme.v1.json',
  id: 'custom-seasonal-theme',
  name: 'Custom Seasonal Holiday Theme',
  description: 'Documented starter starter template demonstrating all supported theme layout zones in Campus Study Vault.',
  author: 'Campus Administrator',
  version: '1.0.0',
  createdAt: '2026-11-20T00:00:00.000Z',
  mascotOverride: '/assets/themes/fox-idle.png',
  navbar: {
    bannerText: '✨ Special Campus Seasonal Announcement or Holiday Greetings! ✨',
    bannerBg: 'linear-gradient(90deg, #1e3a8a, #4338ca, #1e3a8a)',
    bannerTextColor: '#ffffff',
    stringLights: true,
    stringLightsSvg: STRING_LIGHTS_SVG,
    runnerHeight: 40,
    runnerAnimation: 'slide',
  },
  footer: {
    blendHeight: 54,
    blendSvg: SNOWBANK_FOOTER_SVG,
  },
  corners: {
    scaleOnMobile: true,
    bottomLeftSvg: TREE_SNOWMAN_GIFTS_SVG,
    bottomRightSvg: '',
  },
  ambient: {
    type: 'snow',
    fallingSnow: true,
    runningSanta: true,
    festiveCursor: true,
    particleColor: 'rgba(255, 255, 255, 0.85)',
    particleCount: 55,
    speed: 1,
  },
  cardSkins: [
    {
      id: 'skin-1',
      name: 'Variant 1: Warm Gold Glow',
      bgColor: '#fffbeb',
      borderColor: '#fde68a',
      decorations: {
        topLeftSvg: '<svg viewBox="0 0 60 40" style="width:50px;"><text x="5" y="25" font-size="22">🌿</text></svg>',
        bottomLeftSvg: '<svg viewBox="0 0 60 40" style="width:50px;"><text x="5" y="25" font-size="22">🐦</text></svg>',
      },
    },
    {
      id: 'skin-2',
      name: 'Variant 2: Soft Blue Frost',
      bgColor: '#f0f9ff',
      borderColor: '#bae6fd',
      decorations: {
        topSvg: '<svg viewBox="0 0 200 24" preserveAspectRatio="none" style="width:100%;height:18px;"><text x="10" y="18" font-size="14">★  ★  ★  ★  ★</text></svg>',
        bottomSvg: '<svg viewBox="0 0 200 24" preserveAspectRatio="none" style="width:100%;height:18px;"><text x="10" y="18" font-size="14">🌲 🌲 🏠 🌲 🦌</text></svg>',
      },
    },
    {
      id: 'skin-3',
      name: 'Variant 3: Mint Holly',
      bgColor: '#f0fdf4',
      borderColor: '#bbf7d0',
      decorations: {
        topLeftSvg: '<svg viewBox="0 0 60 40" style="width:50px;"><text x="5" y="25" font-size="22">🎀</text></svg>',
        bottomRightSvg: '<svg viewBox="0 0 60 40" style="width:50px;"><text x="15" y="25" font-size="22">🎄</text></svg>',
      },
    },
    {
      id: 'skin-4',
      name: 'Variant 4: Blush Festive',
      bgColor: '#fdf2f8',
      borderColor: '#fbcfe8',
      decorations: {
        topSvg: '<svg viewBox="0 0 200 24" preserveAspectRatio="none" style="width:100%;height:18px;"><text x="10" y="18" font-size="14">💡 💡 💡 💡 💡</text></svg>',
        bottomLeftSvg: '<svg viewBox="0 0 60 40" style="width:50px;"><text x="5" y="25" font-size="22">🐧</text></svg>',
      },
    },
  ],
};
