import { HomeContainer } from "@/components/home/primitives";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

/**
 * Item M4: "Each line of business strengthens the others" band.
 * Soft, wide sun-like radial gradient from just outside the left edge (no ring, no hot spot);
 * the original three-circles artwork (same icons, same rim colours) rearranged as a triangle
 * on the right, directly on the background, each circle labelled.
 */

const NAVY = "#161E2C";

function SolarIcon() {
  return (
    <g stroke={NAVY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M-15 -9 H19 L11 7 H-23 Z" />
      <path d="M-19 -1 H15 M-4 -9 L-8 7 M8 -9 L4 7" />
      <path d="M-2 7 V15 M-10 15 H6" />
    </g>
  );
}

function InverterBatteryIcon() {
  return (
    <g stroke={NAVY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <rect x="-19" y="-16" width="16" height="31" rx="3" />
      <path d="M-15 -9 H-12 V-12 H-9 V-9 H-7" />
      <rect x="2" y="-16" width="16" height="31" rx="3" />
      <path d="M6 -9 H14 M6 -3 H14 M6 3 H14 M6 9 H14" />
    </g>
  );
}

function TurnkeyIcon() {
  return (
    <g stroke={NAVY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M-18 8 L-6 -4" />
      <path d="M-6 -4 a6 6 0 1 0 6 -9 l-3 4 l-4 -1 l-1 -4 l4 -3" />
      <path d="M2 4 L7 9 L17 -3" />
    </g>
  );
}

const nodes = [
  { key: "solar", label: "Solar plants", rim: "#F7961C", x: 210, y: 72, Icon: SolarIcon },
  { key: "storage", label: "Inverters and storage", rim: "#F7B619", x: 80, y: 290, Icon: InverterBatteryIcon },
  { key: "turnkey", label: "Turnkey solutions", rim: "#41A145", x: 340, y: 290, Icon: TurnkeyIcon },
] as const;

/** A bundle of fine arcs between two circles, like the original artwork. */
function ArcBundle({ from, to, color, bend }: { from: { x: number; y: number }; to: { x: number; y: number }; color: string; bend: number }) {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len;
  const ny = dx / len;
  return (
    <g stroke={color} strokeWidth="0.9" fill="none" strokeLinecap="round">
      {[-2, -1, 0, 1, 2].map((i) => {
        const b = bend + i * 7;
        return (
          <path
            key={i}
            d={`M${from.x} ${from.y} Q${mx + nx * b} ${my + ny * b} ${to.x} ${to.y}`}
            strokeOpacity={0.5 - Math.abs(i) * 0.1}
          />
        );
      })}
    </g>
  );
}

export function SynergyBand({ statement, accent }: { statement: string; accent: string }) {
  const before = statement.endsWith(accent) ? statement.slice(0, -accent.length) : statement;
  const [solar, storage, turnkey] = nodes;

  return (
    <section
      className="relative overflow-hidden py-16 xl:py-20"
      style={{
        background:
          "radial-gradient(ellipse 140% 220% at -6% 50%, #FFDBA6 0%, #FFE4BC 33%, #FFEED4 66%, #FFF6E8 100%)",
      }}
      aria-label="How our lines of business connect"
    >
      <ScrollReveal>
        <HomeContainer className="max-w-[1200px] xl:max-w-[1260px] 2xl:max-w-[1260px]">
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:justify-between lg:gap-14">
            <h2 className="max-w-[600px] text-[24px] font-bold leading-[1.45] text-[#161E2C] sm:text-[30px] xl:text-[34px]">
              {before}
              <span className="text-[#1F7A34]">{accent}</span>
            </h2>

            <svg
              viewBox="0 0 420 360"
              className="h-auto w-full max-w-[420px] shrink-0"
              role="img"
              aria-label="Three connected circles: Solar plants, Inverters and storage, Turnkey solutions"
            >
              <ArcBundle from={solar} to={storage} color="#F7961C" bend={-22} />
              <ArcBundle from={solar} to={turnkey} color="#F7B619" bend={22} />
              <ArcBundle from={storage} to={turnkey} color="#41A145" bend={-26} />

              {nodes.map(({ key, label, rim, x, y, Icon }) => (
                <g key={key} transform={`translate(${x} ${y})`}>
                  <circle r="62" fill={rim} fillOpacity="0.12" />
                  <circle r="40" fill="#FFFFFF" stroke={rim} strokeWidth="4" />
                  <Icon />
                  <text
                    y="66"
                    textAnchor="middle"
                    fill={NAVY}
                    fontSize="15"
                    fontWeight="700"
                    style={{ fontFamily: "inherit" }}
                  >
                    {label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </HomeContainer>
      </ScrollReveal>
    </section>
  );
}
