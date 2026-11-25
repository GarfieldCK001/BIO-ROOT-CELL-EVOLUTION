import React from 'react';
import { DNA_COLORS, ORGANISMS, SKILL_NODES } from '../game/data';
import { DnaType, OrganismKind, SkillBranch, SkillId } from '../game/types';

export const TitleEmblemSvg: React.FC<{ subtitle: string }> = ({ subtitle }) => (
  <div className="flex flex-col items-start gap-2 select-none">
    <svg
      viewBox="0 0 460 116"
      className="w-full max-w-[420px] h-auto overflow-visible"
      role="img"
      aria-label="BIO-ROOT: CELL EVOLUTION"
    >
      <defs>
        <filter id="bioGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Organic Root-Cell Crest Icon on left */}
      <g transform="translate(46, 56)">
        <circle cx="0" cy="0" r="34" fill="rgba(14, 72, 86, 0.78)" stroke="#4df7e6" strokeWidth="2.4" />
        <circle cx="0" cy="0" r="24" fill="none" stroke="rgba(126, 252, 240, 0.35)" strokeWidth="1.2" strokeDasharray="5 4" />
        {/* Branching 5-taproot bioluminescent roots inside crest */}
        <path
          d="M 0 -10 C -6 3, -21 10, -24 22 M 0 -10 C -3 5, -12 14, -13 28 M 0 -10 C 0 8, 0 18, 0 30 M 0 -10 C 3 5, 12 14, 13 28 M 0 -10 C 6 3, 21 10, 24 22"
          fill="none"
          stroke="#5ef59b"
          strokeWidth="1.9"
          strokeLinecap="round"
          filter="url(#bioGlow)"
        />
        {/* Glowing Nucleus */}
        <circle cx="0" cy="-10" r="9.5" fill="#d9fffb" filter="url(#bioGlow)" />
        <circle cx="0" cy="-10" r="4.5" fill="#0d9488" />
        {/* 5 Root tip nodes */}
        <circle cx="-24" cy="22" r="2.6" fill="#ff6b4a" />
        <circle cx="-13" cy="28" r="2.6" fill="#44f56b" />
        <circle cx="0" cy="30" r="2.8" fill="#f5c542" />
        <circle cx="13" cy="28" r="2.6" fill="#7ce8ff" />
        <circle cx="24" cy="22" r="2.6" fill="#c084fc" />
      </g>

      {/* Main Title Typography Lockup */}
      <text
        x="98"
        y="56"
        fill="#f0fffd"
        stroke="#03121c"
        strokeWidth="5"
        paintOrder="stroke fill"
        fontFamily="'Outfit', sans-serif"
        fontWeight="800"
        fontSize="44"
        letterSpacing="2.5"
      >
        BIO-ROOT
      </text>

      {/* Hairline biological divider vein */}
      <path
        d="M 98 67 L 312 67"
        stroke="#3be8ff"
        strokeOpacity="0.58"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="316" cy="67" r="2.8" fill="#5ef59b" />

      <text
        x="98"
        y="92"
        fill="#7efcf0"
        stroke="#03121c"
        strokeWidth="3.5"
        paintOrder="stroke fill"
        fontFamily="'Outfit', sans-serif"
        fontWeight="600"
        fontSize="18"
        letterSpacing="5.5"
      >
        CELL EVOLUTION
      </text>
    </svg>
    <p className="text-sm sm:text-base font-medium text-[#9ae9e2] tracking-wide pl-1 hud-text-stroke">
      {subtitle}
    </p>
  </div>
);

export const DnaIconSvg: React.FC<{ type: DnaType; size?: number }> = ({ type, size = 16 }) => {
  const color = DNA_COLORS[type];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <polygon
        points="12,2 20,12 12,22 4,12"
        fill={color}
        fillOpacity="0.28"
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.4" fill="#ffffff" />
    </svg>
  );
};

export const RootTreeIconSvg: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
    <circle cx="12" cy="5" r="3" fill="#d9fffb" stroke="#0b2833" strokeWidth="1.2" />
    <path
      d="M 12 8 C 10 12, 5.5 14, 4 19 M 12 8 C 11 13, 8.5 15.5, 8 19.5 M 12 8 L 12 20 M 12 8 C 13 13, 15.5 15.5, 16 19.5 M 12 8 C 14 12, 18.5 14, 20 19"
      fill="none"
      stroke="#5ef59b"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <circle cx="4" cy="19.5" r="1.9" fill="#ff7a33" />
    <circle cx="8" cy="20" r="1.9" fill="#44f56b" />
    <circle cx="12" cy="20.2" r="2" fill="#f5c542" />
    <circle cx="16" cy="20" r="1.9" fill="#7ce8ff" />
    <circle cx="20" cy="19.5" r="1.9" fill="#c084fc" />
  </svg>
);

export const BRANCH_COLORS: Record<SkillBranch, string> = {
  predator: '#ff7a52',
  biochem: '#44f596',
  immortal: '#f5c542',
  elemental: '#7ce8ff',
  symbiont: '#c084fc',
};

/**
 * Pure SVG <g> glyph centered at (0, 0) in a -14..14 box for each of the 5 Taproots.
 * Can be rendered inside another <svg> (like RootSkillTreeModal headers) or via BranchRootIconSvg.
 */
export function renderBranchRootGlyph(branch: SkillBranch): React.ReactNode {
  switch (branch) {
    case 'predator':
      return (
        <g stroke="#ff7a52" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 0 -11 C -2 -4, -7 -1, -10 9 M 0 -11 L 0 11 M 0 -11 C 2 -4, 7 -1, 10 9" strokeWidth="1.9" />
          <polygon points="-7,-2 -12,-9 -3,-6" fill="#ff3b5c" stroke="#ffb399" strokeWidth="1.1" />
          <polygon points="7,-2 12,-9 3,-6" fill="#ff3b5c" stroke="#ffb399" strokeWidth="1.1" />
          <circle cx="0" cy="-9" r="3" fill="#ffd4a3" stroke="none" />
        </g>
      );
    case 'biochem':
      return (
        <g stroke="#44f596" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 0 -11 C -5 -3, -9 2, -8 10 M 0 -11 C 5 -3, 9 2, 8 10" strokeWidth="1.9" />
          <circle cx="-6" cy="5" r="3.4" fill="#44f56b" fillOpacity="0.45" stroke="#44f56b" strokeWidth="1.4" />
          <polyline points="2,-6 -2,0 3,1 -1,9" stroke="#35d8ff" strokeWidth="2.1" />
          <circle cx="0" cy="-9.5" r="2.8" fill="#d2ffea" stroke="none" />
        </g>
      );
    case 'immortal':
      return (
        <g stroke="#f5c542" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="0,-11 10,-5 10,5 0,11 -10,5 -10,-5" fill="#f5c542" fillOpacity="0.22" strokeWidth="1.8" />
          <path d="M 0 -5 C -3 0, -5 4, -5 9 M 0 -5 L 0 9 M 0 -5 C 3 0, 5 4, 5 9" stroke="#f447a6" strokeWidth="1.6" />
          <circle cx="0" cy="-3" r="3" fill="#fff1b8" stroke="none" />
        </g>
      );
    case 'elemental':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Left Cryo half */}
          <path d="M 0 -11 L -9 -4 M -4 -8 L -8 -10 M 0 -11 L 0 11 M -9 4 L 0 0 L -8 -2" stroke="#7ce8ff" strokeWidth="1.8" fill="none" />
          {/* Right Thermal flame half */}
          <path
            d="M 1 -10 C 8 -6, 11 1, 8 8 C 6 11, 2 11, 1 9 C 4 5, 4 1, 1 -3 Z"
            fill="#ff6e3a"
            fillOpacity="0.72"
            stroke="#ffd166"
            strokeWidth="1.3"
          />
          <circle cx="0" cy="0" r="2.6" fill="#ffffff" />
        </g>
      );
    case 'symbiont':
      return (
        <g strokeLinecap="round" strokeLinejoin="round" fill="none">
          <ellipse cx="0" cy="0" rx="11" ry="5.5" transform="rotate(-28)" stroke="#c084fc" strokeWidth="1.7" />
          <ellipse cx="0" cy="0" rx="11" ry="5.5" transform="rotate(28)" stroke="#5ef59b" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="3.6" fill="#e879f9" stroke="#ffffff" strokeWidth="1.2" />
          <circle cx="-8" cy="-4" r="1.7" fill="#5ef59b" />
          <circle cx="8" cy="4" r="1.7" fill="#c084fc" />
        </g>
      );
  }
}

export const BranchRootIconSvg: React.FC<{ branch: SkillBranch; size?: number }> = ({
  branch,
  size = 24,
}) => {
  const color = BRANCH_COLORS[branch];
  return (
    <svg width={size} height={size} viewBox="-16 -16 32 32" aria-hidden="true" className="shrink-0">
      <circle cx="0" cy="0" r="14.5" fill="#051a26" stroke={color} strokeOpacity="0.65" strokeWidth="1.4" />
      {renderBranchRootGlyph(branch)}
    </svg>
  );
};

/**
 * Pure SVG <g> vector illustration for each of the 16 evolved organs/skills,
 * drawn in a centered -18..18 coordinate space so it embeds directly inside
 * RootSkillTreeModal nodes AND renders framed in SkillIconSvg.
 */
export function renderSkillGlyph(skillId: SkillId): React.ReactNode {
  switch (skillId) {
    case 'jet_flagella':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <path d="M -14 7 Q -8 -1 -3 5 T 5 0" fill="none" stroke="#ff7a33" strokeWidth="2.8" />
          <path d="M -13 1 Q -7 -5 -2 0" fill="none" stroke="#ffd4a3" strokeWidth="1.5" strokeOpacity="0.85" />
          <ellipse cx="7" cy="-3" rx="7.5" ry="5" transform="rotate(-25 7 -3)" fill="#ff7a33" fillOpacity="0.65" stroke="#ffe1bd" strokeWidth="1.7" />
          <circle cx="9.5" cy="-4" r="2.2" fill="#ffffff" />
        </g>
      );
    case 'chitin_spikes':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          {[0, 60, 120, 180, 240, 300].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const bx1 = Math.cos(rad - 0.25) * 7.5;
            const by1 = Math.sin(rad - 0.25) * 7.5;
            const tx = Math.cos(rad) * 15;
            const ty = Math.sin(rad) * 15;
            const bx2 = Math.cos(rad + 0.25) * 7.5;
            const by2 = Math.sin(rad + 0.25) * 7.5;
            return (
              <polygon
                key={deg}
                points={`${bx1},${by1} ${tx},${ty} ${bx2},${by2}`}
                fill="#ff3b5c"
                stroke="#ffb3c1"
                strokeWidth="1"
              />
            );
          })}
          <circle cx="0" cy="0" r="7.5" fill="#4f0d1c" stroke="#ff8fa3" strokeWidth="1.8" />
          <circle cx="0" cy="0" r="3" fill="#ffd6de" />
        </g>
      );
    case 'phantom_ambush':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M 0 -13 C 9 -13, 13 -5, 11 5 L 7 12 L 2 8 L -2 12 L -7 8 L -11 11 C -13 1, -10 -13, 0 -13 Z"
            fill="#b26bff"
            fillOpacity="0.34"
            stroke="#e0c2ff"
            strokeWidth="1.8"
            strokeDasharray="4 2.5"
          />
          <polygon points="-5,-2 -1,-4 -2,0" fill="#ffffff" />
          <polygon points="5,-2 1,-4 2,0" fill="#ffffff" />
        </g>
      );
    case 'corrosive_spit':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M 0 -13 C 6 -5, 11 0, 11 5 C 11 10.5, 6 13.5, 0 13.5 C -6 13.5, -11 10.5, -11 5 C -11 0, -6 -5, 0 -13 Z"
            fill="#44f56b"
            fillOpacity="0.48"
            stroke="#b8ffca"
            strokeWidth="1.8"
          />
          <circle cx="-3.2" cy="5.5" r="2.6" fill="#d9ffe2" />
          <circle cx="3.8" cy="2" r="1.7" fill="#a0ffb8" />
          <circle cx="2" cy="8.2" r="1.3" fill="#ffffff" />
        </g>
      );
    case 'bio_volt_pulse':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <circle cx="0" cy="0" r="13.5" fill="none" stroke="#35d8ff" strokeOpacity="0.42" strokeWidth="1.4" strokeDasharray="4 3" />
          <polygon
            points="2,-14 -8,1 0,1 -3,14 9,-2 1,-2"
            fill="#35d8ff"
            stroke="#e6fbff"
            strokeWidth="1.4"
          />
        </g>
      );
    case 'plasmic_nova':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <polygon
            points="0,-15 4,-4 15,0 4,4 0,15 -4,4 -15,0 -4,-4"
            fill="#3af7c8"
            fillOpacity="0.38"
            stroke="#7efcf0"
            strokeWidth="1.6"
          />
          <circle cx="0" cy="0" r="6.5" fill="#44f56b" fillOpacity="0.55" stroke="#ffffff" strokeWidth="1.5" />
          <polyline points="-3,-4 1,0 -2,1 3,5" fill="none" stroke="#ffffff" strokeWidth="1.6" />
        </g>
      );
    case 'hexa_carapace':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <polygon
            points="0,-14 12,-7 12,7 0,14 -12,7 -12,-7"
            fill="#f5c542"
            fillOpacity="0.3"
            stroke="#ffe885"
            strokeWidth="2.1"
          />
          <polygon
            points="0,-7.5 6.5,-3.7 6.5,3.7 0,7.5 -6.5,3.7 -6.5,-3.7"
            fill="#f5c542"
            fillOpacity="0.6"
            stroke="#ffffff"
            strokeWidth="1.2"
          />
        </g>
      );
    case 'siphon_tentacles':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <path d="M 0 0 C -8 -3, -12 -9, -13 -13" fill="none" stroke="#f447a6" strokeWidth="2.2" />
          <path d="M 0 0 C 9 -3, 12 -9, 13 -13" fill="none" stroke="#f447a6" strokeWidth="2.2" />
          <path d="M 0 0 C -9 4, -12 9, -11 13" fill="none" stroke="#ff8fd0" strokeWidth="2" />
          <path d="M 0 0 C 9 4, 12 9, 11 13" fill="none" stroke="#ff8fd0" strokeWidth="2" />
          <circle cx="0" cy="0" r="5.5" fill="#f447a6" stroke="#ffd6ed" strokeWidth="1.7" />
          <circle cx="0" cy="0" r="2" fill="#ffffff" />
        </g>
      );
    case 'mitosis_minions':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <circle cx="-6" cy="-5" r="5.5" fill="#ffe875" fillOpacity="0.45" stroke="#fff4b8" strokeWidth="1.6" />
          <circle cx="-6" cy="-5" r="2" fill="#ffffff" />
          <circle cx="7" cy="-3" r="4.8" fill="#ffe875" fillOpacity="0.45" stroke="#fff4b8" strokeWidth="1.5" />
          <circle cx="7" cy="-3" r="1.7" fill="#ffffff" />
          <circle cx="0" cy="7.5" r="5.2" fill="#5ef59b" fillOpacity="0.45" stroke="#c2ffd8" strokeWidth="1.6" />
          <circle cx="0" cy="7.5" r="1.8" fill="#ffffff" />
        </g>
      );
    case 'juggernaut_charge':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M -13 -9 L 1 -13 L 14 0 L 1 13 L -13 9 L -6 0 Z"
            fill="#ff9e4a"
            fillOpacity="0.45"
            stroke="#ffe1a8"
            strokeWidth="2"
          />
          <polyline points="-4,-6 5,0 -4,6" fill="none" stroke="#ffffff" strokeWidth="2.2" />
        </g>
      );
    case 'cryo_membrane':
      return (
        <g stroke="#b8f5ff" strokeLinecap="round" strokeLinejoin="round">
          {[0, 60, 120].map((deg) => {
            const r = (deg * Math.PI) / 180;
            return (
              <line
                key={deg}
                x1={Math.cos(r) * -13.5}
                y1={Math.sin(r) * -13.5}
                x2={Math.cos(r) * 13.5}
                y2={Math.sin(r) * 13.5}
                stroke="#7ce8ff"
                strokeWidth="2.1"
              />
            );
          })}
          <polygon points="0,-7 6,-3.5 6,3.5 0,7 -6,3.5 -6,-3.5" fill="#38bdf8" fillOpacity="0.55" stroke="#ffffff" strokeWidth="1.4" />
        </g>
      );
    case 'thermal_vent_core':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M 0 -14 C 5 -7, 11 -3, 11 4 C 11 10.5, 6 14, 0 14 C -6 14, -11 10.5, -11 4 C -11 -2, -5 -6, -3 -10 C -2 -6, 0 -8, 0 -14 Z"
            fill="#ff6e3a"
            fillOpacity="0.55"
            stroke="#ffd166"
            strokeWidth="1.8"
          />
          <path
            d="M 0 -4 C 4 0, 5 4, 4 7.5 C 3 10, -3 10, -4 7.5 C -5 4, -3 0, 0 -4 Z"
            fill="#fff099"
          />
        </g>
      );
    case 'frostfire_pulse':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <path d="M 0 -13 A 13 13 0 0 0 0 13" fill="none" stroke="#7ce8ff" strokeWidth="2.6" />
          <path d="M 0 -13 A 13 13 0 0 1 0 13" fill="none" stroke="#ff7a33" strokeWidth="2.6" />
          <polygon points="-2,-8 -9,0 -2,8" fill="#7ce8ff" fillOpacity="0.65" />
          <polygon points="2,-8 9,0 2,8" fill="#ff9e4a" fillOpacity="0.72" />
          <circle cx="0" cy="0" r="3.4" fill="#ffffff" />
        </g>
      );
    case 'gravity_cilia':
      return (
        <g strokeLinecap="round" strokeLinejoin="round" fill="none">
          <circle cx="0" cy="0" r="13" stroke="#c084fc" strokeOpacity="0.6" strokeWidth="1.5" strokeDasharray="5 3" />
          <path d="M -9 -8 C -4 -10, 4 -10, 8 -5 M 9 8 C 4 10, -4 10, -8 5" stroke="#e9d5ff" strokeWidth="2" />
          <circle cx="0" cy="0" r="5" fill="#9333ea" stroke="#f5d0fe" strokeWidth="1.6" />
          <circle cx="0" cy="0" r="2" fill="#ffffff" />
        </g>
      );
    case 'genome_catalyst':
      return (
        <g strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M -8 -12 C 8 -6, -8 6, 8 12" stroke="#5ef59b" strokeWidth="2.2" />
          <path d="M 8 -12 C -8 -6, 8 6, -8 12" stroke="#35d8ff" strokeWidth="2.2" />
          <line x1="-5" y1="-7" x2="5" y2="-7" stroke="#d9fff0" strokeWidth="1.5" />
          <line x1="-3.5" y1="0" x2="3.5" y2="0" stroke="#ffe875" strokeWidth="1.8" />
          <line x1="-5" y1="7" x2="5" y2="7" stroke="#d9fff0" strokeWidth="1.5" />
        </g>
      );
    case 'singularity_bloom':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="0" cy="0" rx="14.5" ry="6" transform="rotate(-24)" fill="none" stroke="#e879f9" strokeWidth="1.9" />
          <ellipse cx="0" cy="0" rx="14.5" ry="6" transform="rotate(24)" fill="none" stroke="#7ce8ff" strokeWidth="1.6" />
          <circle cx="0" cy="0" r="6.4" fill="#170426" stroke="#f5d0fe" strokeWidth="2" />
          <circle cx="0" cy="0" r="2.2" fill="#ffffff" />
        </g>
      );
  }
}

export const SkillIconSvg: React.FC<{ skillId: SkillId; size?: number }> = ({
  skillId,
  size = 44,
}) => {
  const node = SKILL_NODES[skillId];
  return (
    <svg width={size} height={size} viewBox="-22 -22 44 44" aria-hidden="true" className="shrink-0">
      <circle cx="0" cy="0" r="20" fill="#051a26" stroke={node.accent} strokeOpacity="0.72" strokeWidth="1.8" />
      <circle cx="0" cy="0" r="15.5" fill={node.accent} fillOpacity="0.12" />
      {renderSkillGlyph(skillId)}
    </svg>
  );
};

export const OrganismPreviewSvg: React.FC<{ kind: OrganismKind; size?: number }> = ({
  kind,
  size = 56,
}) => {
  const def = ORGANISMS[kind];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <circle cx="32" cy="32" r="27" fill="rgba(5, 18, 28, 0.85)" stroke={def.color} strokeOpacity="0.35" strokeWidth="1.5" />

      {kind === 'glucose_orb' && (
        <>
          <circle cx="32" cy="32" r="16" fill={def.color} fillOpacity="0.32" />
          <circle cx="32" cy="32" r="11" fill={def.color} />
          <circle cx="28" cy="28" r="4" fill={def.coreColor} />
        </>
      )}

      {kind === 'atp_spark' && (
        <polygon
          points="32,12 37,26 51,32 37,38 32,52 27,38 13,32 27,26"
          fill={def.color}
          stroke="#ffffff"
          strokeWidth="1.4"
        />
      )}

      {kind === 'flagella_dart' && (
        <>
          <path d="M 10 32 Q 16 24 22 32 T 32 32" fill="none" stroke={def.color} strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="38" cy="32" rx="13" ry="9" fill={def.color} fillOpacity="0.82" stroke={def.coreColor} strokeWidth="2" />
          <circle cx="41" cy="32" r="3.8" fill={def.coreColor} />
        </>
      )}

      {kind === 'spike_urchin' && (
        <>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="32"
              y1="32"
              x2={32 + Math.cos((deg * Math.PI) / 180) * 23}
              y2={32 + Math.sin((deg * Math.PI) / 180) * 23}
              stroke={def.color}
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          ))}
          <circle cx="32" cy="32" r="13" fill={def.color} stroke={def.coreColor} strokeWidth="2" />
          <circle cx="32" cy="32" r="5" fill={def.coreColor} />
        </>
      )}

      {kind === 'acid_amoeba' && (
        <>
          <path
            d="M 22 20 C 30 12, 46 16, 48 28 C 52 40, 40 52, 28 48 C 16 46, 12 30, 22 20 Z"
            fill={def.color}
            fillOpacity="0.72"
            stroke={def.coreColor}
            strokeWidth="2"
          />
          <circle cx="28" cy="30" r="4.5" fill={def.coreColor} />
          <circle cx="39" cy="37" r="3" fill="#baffc9" />
        </>
      )}

      {kind === 'shell_diatom' && (
        <>
          <polygon
            points="32,13 48,22 48,42 32,51 16,42 16,22"
            fill={def.color}
            fillOpacity="0.45"
            stroke="#ffe58f"
            strokeWidth="2.8"
          />
          <circle cx="32" cy="32" r="8" fill={def.coreColor} />
        </>
      )}

      {kind === 'volt_jelly' && (
        <>
          <path d="M 16 32 Q 14 44 10 48 M 26 36 Q 24 46 20 52 M 38 36 Q 40 46 44 52" stroke="#74e8ff" strokeWidth="2" fill="none" />
          <circle cx="32" cy="28" r="14" fill={def.color} fillOpacity="0.72" stroke="#ffffff" strokeWidth="1.8" />
          <path d="M 28 22 L 34 28 L 29 29 L 35 36" stroke="#ffffff" strokeWidth="2" fill="none" />
        </>
      )}

      {kind === 'leech_parasite' && (
        <>
          <ellipse cx="32" cy="32" rx="18" ry="8.5" fill={def.color} fillOpacity="0.82" stroke={def.coreColor} strokeWidth="2" />
          <circle cx="45" cy="32" r="4.5" fill="#ffffff" />
          <circle cx="45" cy="32" r="2" fill="#4a042e" />
        </>
      )}

      {kind === 'camo_ghost' && (
        <>
          <circle cx="32" cy="32" r="15" fill={def.color} fillOpacity="0.38" stroke={def.coreColor} strokeDasharray="4 3" strokeWidth="2" />
          <circle cx="27" cy="30" r="2.6" fill="#ffffff" />
          <circle cx="37" cy="30" r="2.6" fill="#ffffff" />
        </>
      )}

      {kind === 'colony_hydra' && (
        <>
          {[0, 72, 144, 216, 288].map((deg) => (
            <circle
              key={deg}
              cx={32 + Math.cos((deg * Math.PI) / 180) * 14}
              cy={32 + Math.sin((deg * Math.PI) / 180) * 14}
              r="7.5"
              fill={def.color}
              fillOpacity="0.7"
              stroke={def.coreColor}
              strokeWidth="1.5"
            />
          ))}
          <circle cx="32" cy="32" r="10" fill={def.coreColor} />
        </>
      )}

      {kind === 'iron_leviathan' && (
        <>
          <polygon
            points="32,10 47,17 54,32 47,47 32,54 17,47 10,32 17,17"
            fill={def.color}
            fillOpacity="0.6"
            stroke="#fff1b8"
            strokeWidth="3"
          />
          <circle cx="32" cy="32" r="9" fill="#ff3b5c" stroke="#ffffff" strokeWidth="1.8" />
        </>
      )}

      {kind === 'thermo_kraken' && (
        <>
          {[0, 60, 120, 180, 240, 300].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const x1 = 32 + Math.cos(rad) * 11;
            const y1 = 32 + Math.sin(rad) * 11;
            const cx = 32 + Math.cos(rad + 0.32) * 20;
            const cy = 32 + Math.sin(rad + 0.32) * 20;
            const x2 = 32 + Math.cos(rad) * 26;
            const y2 = 32 + Math.sin(rad) * 26;
            return (
              <path
                key={deg}
                d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                fill="none"
                stroke="#ff8a47"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            );
          })}
          <circle cx="32" cy="32" r="13" fill={def.color} fillOpacity="0.86" stroke="#ffe07d" strokeWidth="2.2" />
          <circle cx="32" cy="32" r="6" fill="#fff4b8" />
        </>
      )}

      {kind === 'parasite_matriarch' && (
        <>
          <circle cx="32" cy="32" r="22" fill="none" stroke="#ff7ab3" strokeWidth="1.8" strokeDasharray="5 4" />
          {[0, 90, 180, 270].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            return (
              <ellipse
                key={deg}
                cx={32 + Math.cos(rad) * 15}
                cy={32 + Math.sin(rad) * 15}
                rx="6.5"
                ry="4.2"
                transform={`rotate(${deg} ${32 + Math.cos(rad) * 15} ${32 + Math.sin(rad) * 15})`}
                fill="#ff5c9f"
                stroke="#ffd6e8"
                strokeWidth="1.4"
              />
            );
          })}
          <circle cx="32" cy="32" r="12" fill={def.color} fillOpacity="0.85" stroke="#ffafd2" strokeWidth="2.2" />
          <circle cx="32" cy="32" r="5" fill="#ffffff" />
          <circle cx="32" cy="32" r="2.2" fill="#5e0428" />
        </>
      )}

      {kind === 'omega_core' && (
        <>
          <circle cx="32" cy="32" r="22" fill="none" stroke="#7cf7ff" strokeWidth="2.4" strokeDasharray="7 5" />
          <circle cx="32" cy="32" r="14" fill={def.color} fillOpacity="0.82" stroke="#ffffff" strokeWidth="2" />
          <circle cx="32" cy="32" r="6" fill="#7cf7ff" />
        </>
      )}
    </svg>
  );
};
