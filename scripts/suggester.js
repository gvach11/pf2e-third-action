/**
 * suggester.js
 * The core suggestion engine. Takes an actor, reads their profile,
 * runs it through the action catalog, and returns ranked suggestions.
 *
 * Each suggestion object: { name, description, actions, why }
 */

import { readActorProfile } from './actor-reader.js';

/**
 * Main entry point. Returns up to 3 suggestions for the actor's third action.
 * @param {Actor} actor
 * @returns {Array<{name: string, description: string, actions: number, why: string}>}
 */
export function getThirdActionSuggestions(actor) {
  const profile = readActorProfile(actor);
  const candidates = [];

  for (const rule of ACTION_RULES) {
    if (rule.condition(profile)) {
      candidates.push({
        name: rule.name,
        description: rule.description,
        actions: rule.actions,
        why: rule.why(profile)
      });
    }
  }

  // Sort by priority score descending, return top 3
  candidates.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  return candidates.slice(0, 3);
}

// ---------------------------------------------------------------------------
// ACTION RULES CATALOG
// Each rule has:
//   name        — display name of the action
//   description — brief reminder of what the action does
//   actions     — number of actions it costs
//   condition   — function(profile) => boolean
//   why         — function(profile) => string explaining why it's suggested
//   priority    — base priority weight (higher = shown first when conditions tie)
//   source      — Archives of Nethys URL
// ---------------------------------------------------------------------------

const ACTION_RULES = [

  // ── TRIP ────────────────────────────────────────────────────────────────
  {
    name: 'Trip',
    description: 'Athletics check to knock a foe prone. Prone enemies are easier to hit in melee.',
    actions: 1,
    source: 'https://2e.aonprd.com/Actions.aspx?ID=40',
    priority: 10,
    condition: (p) =>
      p.skills['ath']?.rank >= 1 &&        // Trained in Athletics
      p.abilities.str >= 2,                 // Decent Strength
    why: (p) => `Strong Athletics (${p.skills['ath']?.mod >= 0 ? '+' : ''}${p.skills['ath']?.mod}) — a prone enemy gives adjacent allies a +1 bonus and can't Stand without cost.`
  },

  // ── SHOVE ───────────────────────────────────────────────────────────────
  {
    name: 'Shove',
    description: 'Athletics check to push a foe 5 ft. (10 ft. on critical success). Great for repositioning.',
    actions: 1,
    source: 'https://2e.aonprd.com/Actions.aspx?ID=38',
    priority: 9,
    condition: (p) =>
      p.skills['ath']?.rank >= 1 &&
      p.abilities.str >= 2,
    why: (p) => `Strong Athletics (${p.skills['ath']?.mod >= 0 ? '+' : ''}${p.skills['ath']?.mod}) — push enemies into hazards, off ledges, or out of formation.`
  },

  // ── DEMORALIZE ──────────────────────────────────────────────────────────
  {
    name: 'Demoralize',
    description: 'Intimidation check to give a foe the Frightened condition, imposing penalties on all their rolls.',
    actions: 1,
    source: 'https://2e.aonprd.com/Actions.aspx?ID=53',
    priority: 9,
    condition: (p) =>
      p.skills['itm']?.rank >= 1 &&
      p.abilities.cha >= 2,
    why: (p) => `Strong Intimidation (${p.skills['itm']?.mod >= 0 ? '+' : ''}${p.skills['itm']?.mod}) — Frightened 1+ imposes a status penalty to all of the target's checks.`
  },

  // ── RAISE A SHIELD ──────────────────────────────────────────────────────
  {
    name: 'Raise a Shield',
    description: 'Gain +2 circumstance bonus to AC until next turn. Free action to use the shield.',
    actions: 1,
    source: 'https://2e.aonprd.com/Actions.aspx?ID=98',
    priority: 7,
    condition: (p) =>
      p.weapons.some(w => w.category === 'shield') ||
      p.featSlugs.includes('raise-a-shield'),
    why: () => 'You have a shield equipped. +2 AC is always valuable when you have a free action.'
  },

  // ── AIDED STRIKE (AID) ──────────────────────────────────────────────────
  {
    name: 'Aid',
    description: 'Prepare to Aid an ally next round, giving them a +1 (or better) bonus on their next check.',
    actions: 1,
    source: 'https://2e.aonprd.com/Actions.aspx?ID=75',
    priority: 5,
    condition: (p) =>
      p.featSlugs.includes('cooperative-nature') ||
      p.skills['itm']?.rank >= 2 ||
      p.skills['dip']?.rank >= 2,
    why: () => 'You have the social skills to Aid effectively — set up an ally\'s next big action.'
  },

  // ── RECALL KNOWLEDGE ────────────────────────────────────────────────────
  {
    name: 'Recall Knowledge',
    description: 'Use a relevant skill to learn a fact about a creature — possibly exposing a weakness.',
    actions: 1,
    source: 'https://2e.aonprd.com/Actions.aspx?ID=26',
    priority: 4,
    condition: (p) =>
      Object.values(p.skills).some(s => s.rank >= 2),
    why: () => 'You have expert-level knowledge skills. Identifying a creature\'s weakness can swing the encounter.'
  }

  // ── MORE ACTIONS WILL BE ADDED IN PHASE 3 ───────────────────────────────

];
