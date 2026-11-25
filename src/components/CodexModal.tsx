import React, { useState } from 'react';
import { X } from 'lucide-react';
import { DNA_COLORS, ORGANISM_LIST, ORGANISMS, SKILL_LIST, ZONE_LIST } from '../game/data';
import { TRANSLATIONS } from '../game/i18n';
import { Lang } from '../game/types';
import { DnaIconSvg, BranchRootIconSvg, OrganismPreviewSvg, SkillIconSvg } from './BioIcons';

interface CodexModalProps {
  lang: Lang;
  onClose: () => void;
}

type CodexTab = 'organisms' | 'skills' | 'story';

export const CodexModal: React.FC<CodexModalProps> = ({ lang, onClose }) => {
  const t = TRANSLATIONS[lang];
  const [tab, setTab] = useState<CodexTab>('organisms');

  const foodList = ORGANISM_LIST.filter((k) => ORGANISMS[k].category === 'food');
  const enemyList = ORGANISM_LIST.filter((k) => ORGANISMS[k].category === 'enemy');
  const bossList = ORGANISM_LIST.filter((k) => ORGANISMS[k].category === 'boss');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#020912]/88"
      role="dialog"
      aria-modal="true"
      aria-label={t.codex.title}
    >
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[#04141f] border border-[#2a8694]/70 shadow-[0_18px_60px_rgba(0,0,0,0.75)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#1c5566]/65 bg-[#061c2a]">
          <h2 className="font-display font-bold text-lg sm:text-xl text-[#e6fffc]">
            {t.codex.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.codex.close}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d3344] hover:bg-[#154b63] text-sm font-semibold text-[#d9fffc] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            <span>{t.codex.close}</span>
          </button>
        </div>

        {/* Segmented Tab Controls */}
        <div className="flex items-center gap-2 px-5 py-3 bg-[#031019] border-b border-[#153f50]/70 overflow-x-auto">
          {(
            [
              { id: 'organisms', label: t.codex.tabOrganisms },
              { id: 'skills', label: t.codex.tabSkills },
              { id: 'story', label: t.codex.tabStory },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                tab === item.id
                  ? 'bg-[#22e0cf] text-[#02151e]'
                  : 'bg-[#092332] text-[#a2d9dc] hover:text-white hover:bg-[#0f3448]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {tab === 'organisms' && (
            <>
              {[
                { title: t.codex.catFood, items: foodList },
                { title: t.codex.catEnemy, items: enemyList },
                { title: t.codex.catBoss, items: bossList },
              ].map((section) => (
                <section key={section.title} className="space-y-3">
                  <h3 className="font-display font-bold text-base text-[#7efcf0] border-b border-[#194c5c]/60 pb-1.5">
                    {section.title}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {section.items.map((kind) => {
                      const def = ORGANISMS[kind];
                      const copy = t.organisms[kind];
                      return (
                        <div
                          key={kind}
                          className="flex items-start gap-3.5 p-3 rounded-xl bg-[#061c2a] border border-[#194c5c]/65"
                        >
                          <OrganismPreviewSvg kind={kind} size={54} />
                          <div className="min-w-0 flex-1">
                            <div className="font-display font-bold text-sm text-white">
                              {copy.name}
                            </div>
                            <div className="text-xs text-[#89c4ca] mt-0.5 flex items-center gap-2 flex-wrap">
                              <span>{copy.role}</span>
                              <span aria-hidden="true">·</span>
                              {def.dnaDrop ? (
                                <span
                                  className="inline-flex items-center gap-1 font-semibold"
                                  style={{ color: DNA_COLORS[def.dnaDrop] }}
                                >
                                  <DnaIconSvg type={def.dnaDrop} size={12} />
                                  {t.dna[def.dnaDrop]}
                                </span>
                              ) : (
                                <span className="text-[#6effb8]">{t.codex.none}</span>
                              )}
                            </div>
                            <p className="text-xs text-[#bfe1e3] mt-1.5 leading-relaxed">
                              {copy.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </>
          )}

          {tab === 'skills' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SKILL_LIST.map((node) => {
                const copy = t.skills[node.id];
                const branch = t.branches[node.branch];
                return (
                  <div
                    key={node.id}
                    className="p-3.5 rounded-xl bg-[#061c2a] border border-[#1a4e5e]/70 flex items-start gap-3"
                  >
                    <SkillIconSvg skillId={node.id} size={46} />
                    <div className="min-w-0 flex-1 flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-bold"
                          style={{ color: node.accent }}
                        >
                          <BranchRootIconSvg branch={node.branch} size={16} />
                          <span>{branch.name}</span>
                        </span>
                        <span className="text-[11px] font-mono-num text-[#8bc7cc] shrink-0">
                          Max Lv.{node.maxLevel}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-sm text-white">{copy.name}</h3>
                      <p className="text-xs text-[#c2e3e5] leading-relaxed">{copy.desc}</p>
                      <div className="text-xs font-semibold text-[#6bf0c6] pt-0.5">
                        {copy.organ}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'story' && (
            <div className="space-y-6 max-w-2xl">
              <section className="space-y-2">
                <h3 className="font-display font-bold text-base text-[#7efcf0]">
                  {t.gameTitle}
                </h3>
                <p className="text-sm text-[#cceae8] leading-relaxed">{t.storyFull}</p>
              </section>

              <section className="space-y-2.5">
                <h3 className="font-display font-bold text-base text-[#7efcf0]">
                  {t.codex.howToPlayTitle}
                </h3>
                <ul className="space-y-2 text-sm text-[#c6e5e6]">
                  {t.codex.howToPlayBullets.map((line, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="font-mono-num font-bold text-[#22e0cf] shrink-0">
                        0{i + 1}.
                      </span>
                      <span className="leading-relaxed">{line}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-display font-bold text-base text-[#7efcf0]">
                  {t.codex.zonesHeading}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ZONE_LIST.map((z) => (
                    <div key={z} className="p-3 rounded-xl bg-[#061c2a] border border-[#1a4e5e]/60">
                      <div className="font-bold text-sm text-white">
                        {t.hud.zone} {z} · {t.zones[z].name}
                      </div>
                      <p className="text-xs text-[#b5d8db] mt-1 leading-relaxed">
                        {t.zones[z].desc}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
