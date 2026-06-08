/**
 * actor-reader.js
 * Reads and normalises actor data from the PF2E system into a clean object
 * that the suggestion engine can work with.
 */

/**
 * Returns a normalised profile of an actor's relevant combat capabilities.
 * @param {Actor} actor - A Foundry/PF2E Actor document
 * @returns {object} profile
 */
export function readActorProfile(actor) {
  const system = actor.system;

  // --- Ability modifiers ---
  const abilities = {
    str: system.abilities?.str?.mod ?? 0,
    dex: system.abilities?.dex?.mod ?? 0,
    con: system.abilities?.con?.mod ?? 0,
    int: system.abilities?.int?.mod ?? 0,
    wis: system.abilities?.wis?.mod ?? 0,
    cha: system.abilities?.cha?.mod ?? 0
  };

  // --- Skill proficiency ranks (0=untrained, 1=trained, 2=expert, 3=master, 4=legendary) ---
  const skills = {};
  for (const [key, skill] of Object.entries(system.skills ?? {})) {
    skills[key] = {
      rank: skill.rank ?? 0,
      mod: skill.totalModifier ?? 0
    };
  }

  // --- Feats and features (these unlock specific actions) ---
  const featSlugs = actor.items
    .filter(i => ['feat', 'feature'].includes(i.type))
    .map(i => i.system.slug ?? i.name.toLowerCase().replace(/\s+/g, '-'));

  // --- Equipped weapons ---
  const weapons = actor.items
    .filter(i => i.type === 'weapon' && i.isEquipped)
    .map(i => ({
      slug: i.system.slug,
      traits: i.system.traits?.value ?? [],
      category: i.system.category,
      group: i.system.group
    }));

  // --- Actor type (character vs npc) ---
  const actorType = actor.type; // 'character' | 'npc'

  return {
    actorType,
    abilities,
    skills,
    featSlugs,
    weapons
  };
}
