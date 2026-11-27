/**
 * Gentle live motion over the home banner artwork (CSS only, no JavaScript):
 * the sun's glow breathes, a faint ring turns around it, power dots run along the dotted
 * lines from the solar panels and the grid into the inverter and on to the battery, the
 * inverter screen shows a moving sine wave and the battery bars charge one after another.
 *
 * Each SVG uses its artwork's own pixel grid with the same "cover" fit as the image
 * (desktop: centred; mobile: anchored to the bottom), so every element sits on the drawing.
 * Everything stops for visitors who prefer reduced motion.
 */

const FLOW = { stroke: "#FFB12E", strokeLinecap: "round" as const, fill: "none" };

export function HeroMotion() {
  return (
    <div aria-hidden className="hero-motion pointer-events-none absolute inset-0">
      {/* Desktop artwork: 2576 × 1030 */}
      <svg viewBox="0 0 2576 1030" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 hidden size-full md:block">
        <defs>
          <radialGradient id="hm-glow">
            <stop offset="0%" stopColor="#FFE07A" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#FFC23A" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FFC23A" stopOpacity="0" />
          </radialGradient>
          <clipPath id="hm-screen">
            <rect x="1568" y="826" width="70" height="38" rx="5" />
          </clipPath>
        </defs>

        {/* sun: breathing glow and a slowly turning ring */}
        <circle className="hm-breathe" cx="1645" cy="630" r="470" fill="url(#hm-glow)" style={{ transformOrigin: "1645px 630px" }} />
        <circle
          className="hm-spin"
          cx="1645"
          cy="630"
          r="560"
          fill="none"
          stroke="#F7961C"
          strokeOpacity="0.28"
          strokeWidth="2"
          strokeDasharray="3 26"
          style={{ transformOrigin: "1645px 630px" }}
        />

        {/* light specks rising from the sun */}
        {[
          [1450, 560, "0s"],
          [1560, 520, "-2.4s"],
          [1720, 540, "-4.1s"],
          [1830, 580, "-1.2s"],
          [1650, 600, "-5.6s"],
        ].map(([x, y, d]) => (
          <circle key={`${x}`} className="hm-rise" cx={x as number} cy={y as number} r="5" fill="#FFF3C4" style={{ animationDelay: d as string }} />
        ))}

        {/* power flowing: grid tower → inverter, panels → inverter, inverter → battery */}
        <path className="hm-flow" d="M2115 645 C 2105 690, 1960 684, 1800 688 S 1606 712, 1603 800" {...FLOW} strokeWidth="9" strokeDasharray="0.1 34" />
        <path className="hm-flow" d="M1432 915 C 1470 872, 1515 868, 1546 876" {...FLOW} strokeWidth="9" strokeDasharray="0.1 30" />
        <path className="hm-flow" d="M1660 880 C 1688 880, 1698 870, 1717 868" {...FLOW} strokeWidth="9" strokeDasharray="0.1 22" />

        {/* inverter screen: moving sine wave over the drawn one */}
        <g clipPath="url(#hm-screen)">
          <rect x="1568" y="826" width="70" height="38" fill="#1F2633" />
          <path
            className="hm-wave"
            d="M1560 845 q 9 -13 18 0 t 18 0 t 18 0 t 18 0 t 18 0 t 18 0 t 18 0 t 18 0 t 18 0"
            fill="none"
            stroke="#FFC23A"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </g>

        {/* battery bars charging, bottom to top */}
        {[
          [930, "0s"],
          [878, "0.45s"],
          [826, "0.9s"],
          [774, "1.35s"],
        ].map(([y, d]) => (
          <rect
            key={y as number}
            className="hm-charge"
            x="1744"
            y={y as number}
            width="233"
            height="34"
            rx="8"
            fill="#FFFFFF"
            style={{ animationDelay: d as string }}
          />
        ))}
      </svg>

      {/* Mobile artwork: 768 × 1376, anchored to the bottom */}
      <svg viewBox="0 0 768 1376" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full md:hidden">
        <defs>
          <radialGradient id="hm-glow-m">
            <stop offset="0%" stopColor="#FFE07A" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#FFC23A" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FFC23A" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle className="hm-breathe" cx="338" cy="1060" r="300" fill="url(#hm-glow-m)" style={{ transformOrigin: "338px 1060px" }} />
        <path className="hm-flow" d="M735 1068 C 722 1102, 610 1100, 520 1110 S 418 1140, 416 1195" {...FLOW} strokeWidth="5" strokeDasharray="0.1 20" />
        <path className="hm-flow" d="M282 1288 C 318 1256, 348 1254, 371 1255" {...FLOW} strokeWidth="5" strokeDasharray="0.1 18" />
        <path className="hm-flow" d="M461 1256 C 480 1256, 490 1246, 505 1244" {...FLOW} strokeWidth="5" strokeDasharray="0.1 14" />
        {[
          [1294, "0s"],
          [1253, "0.45s"],
          [1212, "0.9s"],
          [1172, "1.35s"],
        ].map(([y, d]) => (
          <rect
            key={y as number}
            className="hm-charge"
            x="525"
            y={y as number}
            width="173"
            height="28"
            rx="6"
            fill="#FFFFFF"
            style={{ animationDelay: d as string }}
          />
        ))}
      </svg>
    </div>
  );
}
