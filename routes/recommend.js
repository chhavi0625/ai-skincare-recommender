// routes/recommend.js
// Rule-based AI logic engine + POST /recommend handler

const express = require('express');
const router = express.Router();
const supabase = require('../db');

// ─── Rule-Based AI Engine ───────────────────────────────────────────────────

/**
 * Builds a full skincare recommendation from user inputs.
 * Rules are layered: base rules from skin type, then concern overrides.
 */
function buildRecommendation({ skinType, concerns, lifestyle }) {
  const morning = [];
  const night = [];
  const tips = [];
  const products = [];

  // ── Base rules by skin type ──────────────────────────────────────────────

  if (skinType === 'Dry') {
    morning.push('Gentle cream cleanser (e.g. CeraVe Hydrating Cleanser)');
    morning.push('Hyaluronic acid serum');
    morning.push('Rich moisturizing cream (e.g. La Roche-Posay Toleriane)');
    morning.push('SPF 50 broad-spectrum sunscreen');

    night.push('Cream or oil-based cleanser');
    night.push('Hyaluronic acid + Niacinamide serum');
    night.push('Overnight hydrating mask (2–3x per week)');
    night.push('Thick barrier repair moisturizer');

    products.push('Hyaluronic acid serum', 'Ceramide-rich moisturizer', 'Overnight repair mask');
    tips.push('Drink at least 2 liters of water daily to support skin hydration.');
    tips.push('Use a humidifier at night to prevent moisture loss while sleeping.');

  } else if (skinType === 'Oily') {
    morning.push('Foaming gel cleanser (e.g. Neutrogena Oil-Free)');
    morning.push('Niacinamide 10% serum (controls sebum)');
    morning.push('Lightweight oil-free moisturizer');
    morning.push('Mattifying SPF 50 sunscreen');

    night.push('Double cleanse: micellar water then gel cleanser');
    night.push('BHA (Salicylic Acid) toner 2–3x per week');
    night.push('Lightweight gel moisturizer');

    products.push('Niacinamide serum', 'BHA exfoliant', 'Oil-free gel moisturizer');
    tips.push('Avoid heavy creams and mineral oils — they clog pores on oily skin.');
    tips.push('Use blotting papers during the day instead of powder to avoid buildup.');

  } else if (skinType === 'Combination') {
    morning.push('Balancing gel-cream cleanser');
    morning.push('Niacinamide serum (balances T-zone oiliness)');
    morning.push('Light moisturizer on dry zones, skip T-zone or use gel');
    morning.push('SPF 50 sunscreen');

    night.push('Gentle foam cleanser');
    night.push('AHA exfoliant (Glycolic Acid) 2x per week');
    night.push('Light serum across face; richer cream only on dry cheeks');

    products.push('Niacinamide serum', 'AHA exfoliant', 'Zone-specific moisturizer');
    tips.push('Apply heavier moisturizers only on dry patches (cheeks, temples), not the T-zone.');

  } else if (skinType === 'Sensitive') {
    morning.push('Fragrance-free micellar water or cream cleanser');
    morning.push('Centella Asiatica (Cica) soothing serum');
    morning.push('Mineral-only SPF 30–50 (zinc oxide / titanium dioxide)');
    morning.push('Gentle barrier cream (fragrance-free)');

    night.push('Fragrance-free micellar water');
    night.push('Aloe vera or chamomile calming essence');
    night.push('Oat-extract or Cica repair cream');

    products.push('Cica calming serum', 'Oat repair cream', 'Mineral sunscreen');
    tips.push('Patch-test every new product for 48 hours before full application.');
    tips.push('Avoid fragrances, alcohol, and harsh exfoliants entirely.');
  }

  // ── Concern-specific overrides ───────────────────────────────────────────

  if (concerns.includes('Wrinkles')) {
    night.push('Retinol 0.3%–0.5% (start 2x/week, build up gradually)');
    night.push('Peptide night cream (e.g. Olay Regenerist)');
    morning.push('Vitamin C serum L-ascorbic acid 10–15%');
    products.push('Retinol serum (0.3%)', 'Peptide night cream', 'Vitamin C serum');
    tips.push('Retinol is a gold-standard anti-aging ingredient for 40+ — patience is key, results in 8–12 weeks.');
    tips.push('Always wear SPF when using Retinol, as it increases sun sensitivity.');
  }

  if (concerns.includes('Pigmentation')) {
    morning.push('Vitamin C serum (L-ascorbic acid 15–20%)');
    morning.push('SPF 50+ sunscreen with PA++++ rating (essential for pigmentation)');
    night.push('Alpha-Arbutin serum or Kojic acid treatment');
    products.push('Vitamin C brightening serum', 'Alpha-Arbutin serum', 'High-SPF sunscreen');
    tips.push('Vitamin C + SPF in the morning is the most effective combination against pigmentation.');
    tips.push('Consistency for 3–6 months is needed to visibly fade dark spots.');
  }

  if (concerns.includes('Dryness')) {
    morning.push('Ceramide + Peptide moisturizer (rebuilds skin barrier)');
    night.push('Slugging method: apply Vaseline/Aquaphor as final step to seal moisture');
    products.push('Ceramide moisturizer', 'Barrier repair ointment');
    tips.push('Apply moisturizer while skin is still slightly damp to lock in hydration.');
  }

  if (concerns.includes('Acne')) {
    morning.push('2% Salicylic Acid cleanser (on breakout days)');
    night.push('Benzoyl Peroxide 2.5% spot treatment (targeted only)');
    night.push('Avoid heavy occlusive creams on acne-prone areas');
    products.push('Salicylic acid cleanser', 'Benzoyl peroxide spot treatment');
    tips.push('Hormonal acne at 40+ is common. Consult a dermatologist if breakouts are frequent.');
    tips.push('Avoid picking blemishes — it causes scarring that is harder to treat at 40+.');
  }

  // ── Lifestyle-based tips ─────────────────────────────────────────────────

  if (lifestyle.stress === 'High') {
    tips.push('High stress raises cortisol, which breaks down collagen. Try 10-minute daily meditation.');
  }
  if (lifestyle.sleep === 'Poor') {
    tips.push('Skin repairs itself at night. Aim for 7–8 hours; use a silk pillowcase to reduce friction.');
  }
  if (lifestyle.diet === 'Poor') {
    tips.push('Eat antioxidant-rich foods (berries, leafy greens, nuts) to support skin health from within.');
  }

  // Deduplicate all arrays while preserving order
  const unique = (arr) => [...new Set(arr)];

  return {
    morning: unique(morning),
    night: unique(night),
    products: unique(products),
    tips: unique(tips),
  };
}

// ─── POST /recommend ─────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const { name, age, skinType, concerns, lifestyle } = req.body;

    // Validate required fields
    if (!name || !age || !skinType || !concerns || !lifestyle) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 40) {
      return res.status(400).json({ error: 'Age must be 40 or older.' });
    }

    if (!Array.isArray(concerns) || concerns.length === 0) {
      return res.status(400).json({ error: 'Please select at least one skin concern.' });
    }

    // Generate recommendation using rule-based AI engine
    const recommendation = buildRecommendation({ skinType, concerns, lifestyle });

    // Persist to Supabase
    const { error: dbError } = await supabase
      .from('skincare_users')
      .insert({
        name,
        age: parsedAge,
        skin_type: skinType,
        concerns,
        lifestyle,
        recommendation,
      });

    if (dbError) {
      console.error('Supabase insert error:', dbError.message);
      // Non-blocking: still return recommendation even if DB write fails
    }

    return res.json({
      success: true,
      name,
      skinType,
      concerns,
      recommendation,
    });

  } catch (err) {
    console.error('Recommendation error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

module.exports = router;
