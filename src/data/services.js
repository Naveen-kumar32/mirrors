import { IMG } from './site';

/*
 * Treatments, as supplied and approved by the clinic (Dr. Saranya Rajee Saminathan).
 * Prices are intentionally not shown on the website.
 * Photos are stock images until the clinic supplies its own.
 */
export const SERVICES = [
  {
    slug: 'chemical-peeling',
    title: 'Chemical Peeling',
    short: 'Acne, mild pigmentation, tanning, dull skin',
    text: 'A controlled application of a chemical solution to exfoliate the skin and improve its tone, texture and appearance.',
    idealFor: 'Acne, mild pigmentation, tanning, uneven skin tone and dull skin.',
    benefits: 'Brighter skin, smoother texture, reduced acne and superficial pigmentation.',
    limitations: 'Multiple sessions may be needed; deeper scars and severe pigmentation may require combination treatments.',
    aftercare:
      'Use sunscreen regularly, moisturize well, avoid scrubbing/peeling the skin and temporarily avoid irritating active ingredients as advised.',
    image: IMG.cPeel,
    image2: IMG.cPeel,
  },
  {
    slug: 'laser-hair-removal',
    title: 'Laser Hair Removal',
    short: 'Long-term reduction of unwanted hair',
    text: 'Laser energy targets hair follicles to reduce unwanted hair growth over multiple sessions.',
    idealFor: 'Patients with unwanted facial or body hair seeking long-term reduction.',
    benefits: 'Long-term reduction in hair growth, smoother skin and reduced need for shaving/waxing.',
    limitations:
      'It is a hair-reduction, not guaranteed permanent hair-removal procedure. Results vary with hair colour, skin type and hormonal factors.',
    aftercare:
      'Avoid waxing/plucking between sessions, minimize sun exposure, use sunscreen and follow the recommended shaving and skincare routine.',
    image: IMG.nLaser,
    image2: IMG.nLaser2,
  },
  {
    slug: 'acne-scar-revision',
    title: 'Acne Scar Revision',
    short: 'Depressed, uneven or textural acne scars',
    text: 'A personalized combination of procedures used to improve depressed, uneven or textural acne scars.',
    idealFor: 'Patients with persistent acne scars after active acne is controlled.',
    benefits: 'Improves skin texture, scar depth and overall skin appearance.',
    limitations: 'Complete scar removal is usually not possible; multiple sessions and combination treatments may be required.',
    aftercare: 'Strict sun protection, gentle skincare, avoid picking/scratching and follow prescribed post-procedure medications.',
    image: IMG.cAcne,
    image2: IMG.cAcne,
  },
  {
    slug: 'keloid-treatment',
    title: 'Keloid Treatment',
    short: 'Raised, firm scars that itch or cause discomfort',
    text: 'Dermatological treatment aimed at flattening, softening and reducing symptoms of raised keloid scars.',
    idealFor: 'Raised, firm scars that extend beyond the original wound and may cause itching or discomfort.',
    benefits: 'Can reduce size, firmness, itching and discomfort.',
    limitations: 'Keloids can recur even after successful treatment; combination or repeated treatment may be necessary.',
    aftercare: 'Keep the area protected, avoid unnecessary trauma and follow pressure/silicone or medication advice when prescribed.',
    image: IMG.iDerm,
    image2: IMG.fKeloid,
  },
  {
    slug: 'pigmentation-melasma',
    title: 'Pigmentation / Melasma Treatment',
    short: 'Melasma, sun pigmentation, post-acne marks',
    text: 'A customized treatment plan combining medical skincare and, when appropriate, peels or laser-based procedures to control pigmentation.',
    idealFor: 'Melasma, sun-induced pigmentation, post-acne marks and uneven skin tone.',
    benefits: 'Gradual reduction in pigmentation and improvement in skin tone and brightness.',
    limitations: 'Melasma can be chronic and recurrent. Results require maintenance and strict sun protection.',
    aftercare:
      'Daily broad-spectrum sunscreen, preferably with visible-light protection when appropriate, regular moisturization and adherence to the prescribed skincare routine.',
    image: IMG.cPig,
    image2: IMG.cPig,
  },
  {
    slug: 'prp-gfc',
    title: 'PRP / GFC',
    short: 'Hair thinning and early hair loss',
    text: 'Regenerative treatments using concentrated components derived from your own blood to support hair growth and selected skin-rejuvenation goals.',
    idealFor:
      'Selected patients with hair thinning and certain early-stage hair-loss conditions; suitability depends on the diagnosis.',
    benefits: 'May improve hair density and reduce hair shedding in suitable patients; results develop gradually.',
    limitations:
      'Response varies between individuals and it does not restore completely lost hair follicles. Multiple sessions and maintenance may be required.',
    aftercare:
      'Keep the treated area clean, avoid vigorous exercise and irritating products for the advised period, and follow prescribed hair/skin care.',
    image: IMG.cPrp,
    image2: IMG.cHairLoss,
  },
  {
    slug: 'medifacial',
    title: 'Medifacial',
    short: 'Dullness, congestion, dehydration',
    text: 'A medically supervised facial treatment combining cleansing, exfoliation and selected skin-specific procedures/products.',
    idealFor: 'Patients seeking improvement in dullness, mild congestion, dehydration and overall skin appearance.',
    benefits: 'Temporary improvement in hydration, smoothness, radiance and skin texture.',
    limitations:
      'It is primarily a supportive skin-care procedure and does not replace treatment for acne, melasma or significant scarring.',
    aftercare: 'Gentle cleansing, moisturization and daily sunscreen; avoid harsh exfoliation immediately after treatment.',
    image: IMG.cMedi,
    image2: IMG.cMedi,
  },
  {
    slug: 'ear-lobe-repair',
    title: 'Ear Lobe Repair',
    short: 'Torn, stretched or split earlobes',
    text: 'A minor surgical procedure to repair a torn, stretched or split earlobe and restore its shape.',
    idealFor: 'Completely or partially torn earlobes due to earrings, trauma or excessive stretching.',
    benefits: 'Restores earlobe shape and symmetry and allows future reconstruction where appropriate.',
    limitations:
      'Healing takes time, and re-piercing should only be done after adequate healing. Recurrence is possible if the repaired lobe is subjected to excessive tension.',
    aftercare:
      'Keep the wound clean and dry as advised, attend follow-up visits, avoid heavy earrings and follow wound-care instructions carefully.',
    image: IMG.cEar,
    image2: IMG.cEar,
  },
  {
    slug: 'mole-wart-cyst-skin-tag-removal',
    title: 'Mole / Wart / Cyst / Skin Tag Removal',
    short: 'Benign moles, warts, cysts and skin tags',
    text: 'Removal of selected benign skin growths using electrocautery / surgical method whichever is appropriate based on the lesion and clinical assessment.',
    idealFor: 'Benign moles, warts, skin tags and cysts that are bothersome, symptomatic or cosmetically unwanted.',
    benefits: 'Removes the targeted lesion and may improve comfort and appearance.',
    limitations:
      'Some lesions can recur; scarring or pigmentation changes can occur. Suspicious lesions may require biopsy/histopathological examination.',
    aftercare:
      'Keep the treated area clean, follow wound-care instructions, avoid picking the site and use sun protection to minimize post-inflammatory pigmentation.',
    image: IMG.cMole,
    image2: IMG.cMole,
  },
];

export const TREATMENT_DISCLAIMER =
  'Every procedure is planned after individual skin assessment. Results vary between patients, and some conditions may require multiple sessions or combination treatments. Your dermatologist will recommend the most appropriate treatment and aftercare based on your skin type and diagnosis.';

/*
 * Featured treatments on the home page (the clinic's list).
 * `slug` links to the matching treatment page; without one the card opens the booking form.
 */
export const FEATURED_TREATMENTS = [
  { name: 'Acne', text: 'Medical treatment to control breakouts and prevent marks and scars.', image: IMG.cAcne },
  { name: 'Pigmentation', text: 'Melasma, sun pigmentation, post-acne marks and uneven skin tone.', image: IMG.cPig, slug: 'pigmentation-melasma' },
  { name: 'Hair Fall Restoration', text: 'Finding the cause of hair fall and treating it to restore density.', image: IMG.cHairLoss, slug: 'prp-gfc' },
  { name: 'Vitiligo', text: 'Assessment and treatment of vitiligo (white patches).', image: IMG.cVitiligo },
  { name: 'Chemical Peel', text: 'Clearer, brighter skin for acne, tanning and mild pigmentation.', image: IMG.cPeel, slug: 'chemical-peeling' },
  { name: 'PRP / GFC', text: 'Treatment from your own blood to support hair growth.', image: IMG.cPrp, slug: 'prp-gfc' },
  { name: 'Laser Hair Removal', text: 'Long-term reduction of unwanted facial and body hair.', image: IMG.nLaser, slug: 'laser-hair-removal' },
  { name: 'Mole / Skin Tag Removal', text: 'Removal of benign moles, warts, cysts and skin tags.', image: IMG.cMole, slug: 'mole-wart-cyst-skin-tag-removal' },
  { name: 'Ear Lobe Repair', text: 'Repair of torn, stretched or split earlobes.', image: IMG.cEar, slug: 'ear-lobe-repair' },
];
