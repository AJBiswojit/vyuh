/**
 * Phase 7 question bank. Eighty-four authored questions across Physics,
 * Chemistry, Mathematics and Biology, with keys, explanations, Bloom levels and
 * historical item statistics. This is the faculty's side of the bank; the
 * student-facing NEET paper in questions.js stays separate because it ships
 * sixty numbered questions, not a searchable library.
 *
 * @typedef {import('../contracts/faculty.js').BankQuestion} BankQuestion
 * @typedef {import('../contracts/faculty.js').BankOption} BankOption
 * @typedef {import('../contracts/faculty.js').QuestionKind} QuestionKind
 * @typedef {import('../contracts/faculty.js').Difficulty} Difficulty
 * @typedef {import('../contracts/faculty.js').BloomLevel} BloomLevel
 * @typedef {import('../contracts/faculty.js').QuestionSource} QuestionSource
 */

const now = Date.now()
/** @param {number} days */ function daysAgo(days) { return new Date(now - days * 86_400_000).toISOString() }

/** @type {{ id: string, name: string, shortName: string }[]} */
export const bankSubjects = [
  { id: 'sub-phy', name: 'Physics', shortName: 'PHY' },
  { id: 'sub-che', name: 'Chemistry', shortName: 'CHE' },
  { id: 'sub-mat', name: 'Mathematics', shortName: 'MAT' },
  { id: 'sub-bio', name: 'Biology', shortName: 'BIO' },
]

/**
 * The bank's own topic tree. Chapter ids that overlap academics.js keep the same
 * id, so a result-sheet topic and a bank topic are the same object.
 * @type {{ id: string, subjectId: string, name: string, code: string, subtopics: string[] }[]}
 */
export const bankTopics = [
  { id: 'ch-rot', subjectId: 'sub-phy', name: 'Rotational Motion', code: 'ROT', subtopics: ['Moment of inertia', 'Torque & equilibrium', 'Rolling motion', 'Angular momentum'] },
  { id: 'ch-elec', subjectId: 'sub-phy', name: 'Electrostatics', code: 'ELE', subtopics: ['Coulomb field', 'Gauss law', 'Capacitance', 'Conductors'] },
  { id: 'ch-opt', subjectId: 'sub-phy', name: 'Ray Optics', code: 'OPT', subtopics: ['Mirrors', 'Lenses', 'Total internal reflection'] },
  { id: 'ch-thermo', subjectId: 'sub-phy', name: 'Thermodynamics', code: 'THM', subtopics: ['First law', 'Processes', 'Heat engines'] },
  { id: 'ch-current', subjectId: 'sub-phy', name: 'Current Electricity', code: 'CUR', subtopics: ['Ohm law', 'Drift velocity', 'Bridge circuits'] },
  { id: 'ch-modern', subjectId: 'sub-phy', name: 'Modern Physics', code: 'MOD', subtopics: ['Photoelectric effect', 'Atomic models', 'Nuclear decay'] },
  { id: 'ch-bond', subjectId: 'sub-che', name: 'Chemical Bonding', code: 'BND', subtopics: ['Hybridisation', 'VSEPR', 'Dipole moment', 'Hydrogen bonding'] },
  { id: 'ch-org', subjectId: 'sub-che', name: 'Organic Reaction Mechanisms', code: 'ORG', subtopics: ['Nucleophiles', 'Addition reactions', 'Substitution', 'Aromaticity'] },
  { id: 'ch-eq', subjectId: 'sub-che', name: 'Equilibrium', code: 'EQM', subtopics: ['Ionic product', 'Le Chatelier', 'pH & pOH', 'Catalysis'] },
  { id: 'ch-kinetics', subjectId: 'sub-che', name: 'Chemical Kinetics', code: 'KIN', subtopics: ['Rate laws', 'Order & molecularity', 'Half life'] },
  { id: 'ch-coord', subjectId: 'sub-che', name: 'Coordination Compounds', code: 'CRD', subtopics: ['Oxidation state', 'Ligands', 'Isomerism'] },
  { id: 'ch-pblock', subjectId: 'sub-che', name: 'p-Block Elements', code: 'PBL', subtopics: ['Group trends', 'Anomalous behaviour', 'Oxides'] },
  { id: 'ch-calc', subjectId: 'sub-mat', name: 'Definite Integrals', code: 'CAL', subtopics: ['Standard integrals', 'Properties', 'Substitution'] },
  { id: 'ch-prob', subjectId: 'sub-mat', name: 'Probability', code: 'PRO', subtopics: ['Classical probability', 'Conditional probability', 'Expectation'] },
  { id: 'ch-vec', subjectId: 'sub-mat', name: 'Vectors & 3D geometry', code: 'VEC', subtopics: ['Dot product', 'Cross product', 'Triple product'] },
  { id: 'ch-algebra', subjectId: 'sub-mat', name: 'Algebra', code: 'ALG', subtopics: ['Quadratic roots', 'Complex numbers', 'Permutations'] },
  { id: 'ch-coord', subjectId: 'sub-mat', name: 'Coordinate Geometry', code: 'CRD', subtopics: ['Circles', 'Ellipse', 'Straight lines'] },
  { id: 'ch-cell', subjectId: 'sub-bio', name: 'Cell Structure and Function', code: 'CEL', subtopics: ['Organelles', 'Cell division', 'Cell wall'] },
  { id: 'ch-genetics', subjectId: 'sub-bio', name: 'Genetics and Evolution', code: 'GEN', subtopics: ['Mendelian ratios', 'DNA replication', 'Genetic code'] },
  { id: 'ch-plant', subjectId: 'sub-bio', name: 'Plant Physiology', code: 'PLT', subtopics: ['Photosynthesis', 'Transpiration', 'Mineral nutrition'] },
  { id: 'ch-human', subjectId: 'sub-bio', name: 'Human Physiology', code: 'HUM', subtopics: ['Excretion', 'Endocrinology', 'Circulation', 'Immunity'] },
  { id: 'ch-ecology', subjectId: 'sub-bio', name: 'Ecology', code: 'ECO', subtopics: ['Energy flow', 'Biodiversity', 'Populations'] },
]

const TOPIC_BY_ID = new Map(bankTopics.map((topic) => [topic.id, topic]))
const SUBJECT_BY_ID = new Map(bankSubjects.map((subject) => [subject.id, subject]))

/**
 * Deterministic item statistics. The bank is a fixture, so its history must not
 * change between reloads: the same index always yields the same p-value.
 * @param {number} index @param {number} salt
 */
function noise(index, salt) {
  const value = Math.sin((index + 1) * (salt + 1) * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

/** @type {Difficulty[]} */
const DIFFICULTY_ORDER = ['easy', 'medium', 'hard']

/**
 * @param {Object} input
 * @param {string} input.kind
 * @param {string} input.topicId
 * @param {string} input.subtopic
 * @param {Difficulty} input.difficulty
 * @param {BloomLevel} input.bloom
 * @param {QuestionSource} input.source
 * @param {string} input.body
 * @param {string[]} [input.options]
 * @param {string|string[]} [input.correct]
 * @param {number|null} [input.correctNumeric]
 * @param {string|null} [input.unit]
 * @param {number} [input.tolerance]
 * @param {string} input.explanation
 * @param {string[]} [input.tags]
 * @param {number} [input.marks]
 * @param {number} [input.negativeMarks]
 * @param {string|null} [input.image]
 * @param {number} index
 * @returns {BankQuestion}
 */
function compose(input, index) {
  const topic = TOPIC_BY_ID.get(input.topicId)
  if (!topic) throw new Error(`Unknown bank topic: ${input.topicId}`)
  const subject = SUBJECT_BY_ID.get(topic.subjectId)
  if (!subject) throw new Error(`Unknown bank subject: ${topic.subjectId}`)
  const keys = input.options ?? []
  const correct = input.correct === undefined ? [] : Array.isArray(input.correct) ? input.correct : [input.correct]
  const base = input.difficulty === 'easy' ? 0.71 : input.difficulty === 'hard' ? 0.3 : 0.51
  const difficultyIndex = Math.round((base + (noise(index, 3) - 0.5) * 0.14) * 100) / 100
  const discriminationBase = input.difficulty === 'easy' ? 0.24 : input.difficulty === 'hard' ? 0.33 : 0.42
  const discrimination = Math.round((discriminationBase + (noise(index, 7) - 0.5) * 0.18) * 100) / 100
  const attempts = 48 + Math.round(noise(index, 11) * 190)
  return {
    id: `qb-${String(index + 1).padStart(3, '0')}`,
    code: `${subject.shortName}-${topic.code}-${String(index + 1).padStart(4, '0')}`,
    kind: /** @type {QuestionKind} */ (input.kind),
    subjectId: subject.id,
    subjectName: subject.name,
    topicId: topic.id,
    topicName: topic.name,
    subtopic: input.subtopic,
    difficulty: input.difficulty,
    bloom: input.bloom,
    source: input.source,
    body: input.body,
    options: /** @type {BankOption[]} */ (keys.map((body, position) => ({
      key: /** @type {'A'|'B'|'C'|'D'} */ (['A', 'B', 'C', 'D'][position] ?? 'A'),
      body,
    }))),
    correctOptions: correct,
    correctNumeric: input.correctNumeric ?? null,
    numericTolerance: input.tolerance ?? 0.01,
    unit: input.unit ?? null,
    explanation: input.explanation,
    tags: input.tags ?? [topic.name, input.subtopic],
    marks: input.marks ?? 4,
    negativeMarks: input.negativeMarks ?? 1,
    status: 'published',
    authorName: index % 5 === 0 ? 'Rituparna Das' : 'Dr. Snehasish Mohapatra',
    createdAt: daysAgo(4 + Math.round(noise(index, 13) * 120)),
    updatedAt: daysAgo(Math.round(noise(index, 17) * 9)),
    usageCount: Math.round(noise(index, 19) * 14),
    imageUrl: input.image ?? null,
    analysis: {
      attempts,
      correctPercent: Math.round(difficultyIndex * 100),
      difficultyIndex,
      discrimination,
    },
  }
}

/* ── Physics ──────────────────────────────────────────────────────────── */

/** @type {Omit<Parameters<typeof compose>[0], 'kind'>[]} */
const physics = [
  {
    topicId: 'ch-rot', subtopic: 'Moment of inertia', difficulty: 'easy', bloom: 'remember', source: 'authored',
    body: String.raw`The moment of inertia of a uniform circular disc of mass $M$ and radius $R$ about an axis through its centre and perpendicular to its plane is`,
    options: [String.raw`$MR^2$`, String.raw`$\dfrac{MR^2}{2}$`, String.raw`$\dfrac{MR^2}{4}$`, String.raw`$\dfrac{2MR^2}{5}$`],
    correct: 'B', explanation: String.raw`For a disc, $I=\int r^2\,dm=\dfrac{MR^2}{2}$ about the central perpendicular axis.`, tags: ['moment of inertia', 'disc'],
  },
  {
    topicId: 'ch-rot', subtopic: 'Rolling motion', difficulty: 'medium', bloom: 'apply', source: 'previous_year',
    body: String.raw`A solid cylinder rolls without slipping down a plane inclined at $30^\circ$. The acceleration of its centre of mass is`,
    options: [String.raw`$g/3$`, String.raw`$2g/5$`, String.raw`$g/2$`, String.raw`$3g/7$`],
    correct: 'A', explanation: String.raw`$a=\dfrac{g\sin\theta}{1+I/MR^2}=\dfrac{g/2}{3/2}=\dfrac{g}{3}$ for a solid cylinder.`, tags: ['rolling', 'acceleration'],
  },
  {
    topicId: 'ch-rot', subtopic: 'Torque & equilibrium', difficulty: 'medium', bloom: 'apply', source: 'authored', kind: 'numerical',
    body: String.raw`A uniform rod of mass $3\ \mathrm{kg}$ and length $2\ \mathrm{m}$ is hinged at one end and held horizontally. Taking $g=10\ \mathrm{m\,s^{-2}}$, the magnitude of the torque of its weight about the hinge is ____ $\mathrm{N\,m}$.`,
    correctNumeric: 30, unit: 'N m', explanation: 'The weight acts at the midpoint, 1 m from the hinge, so τ = 30 N × 1 m = 30 N m.',
  },
  {
    topicId: 'ch-rot', subtopic: 'Torque & equilibrium', difficulty: 'medium', bloom: 'understand', source: 'authored', kind: 'multi',
    body: 'A rigid body is in mechanical equilibrium. Which of the following statements must be true?',
    options: ['The net force on it is zero', 'The net torque about any point is zero', 'Its angular velocity must be zero', 'It must be at rest in the observer’s frame'],
    correct: ['A', 'B'], explanation: 'Equilibrium constrains force and torque, not motion: a body moving with constant velocity is in equilibrium while its angular velocity need not vanish.',
  },
  {
    topicId: 'ch-rot', subtopic: 'Angular momentum', difficulty: 'easy', bloom: 'understand', source: 'authored',
    body: 'A dancer on frictionless ice folds her arms while spinning. Which quantity stays constant?',
    options: ['Angular speed', 'Rotational kinetic energy', 'Angular momentum', 'Moment of inertia'],
    correct: 'C', explanation: 'No external torque acts, so L = Iω is conserved; I falls and ω rises, which is why kinetic energy increases.',
  },
  {
    topicId: 'ch-elec', subtopic: 'Coulomb field', difficulty: 'easy', bloom: 'apply', source: 'authored',
    body: String.raw`Two equal positive charges $+q$ are separated by a distance $2r$. The electric field at the midpoint of the line joining them is`,
    options: [String.raw`$\dfrac{kq}{r^2}$`, String.raw`$\dfrac{2kq}{r^2}$`, 'Zero', String.raw`$\dfrac{4kq}{r^2}$`],
    correct: 'C', explanation: 'The two field vectors are equal in magnitude and opposite in direction at the midpoint, so they cancel.',
  },
  {
    topicId: 'ch-elec', subtopic: 'Gauss law', difficulty: 'medium', bloom: 'apply', source: 'authored',
    body: String.raw`A closed surface encloses a charge $2q$. The net electric flux through the surface is`,
    options: [String.raw`$\dfrac{q}{\varepsilon_0}$`, String.raw`$\dfrac{2q}{\varepsilon_0}$`, 'Zero', String.raw`$\dfrac{q}{2\varepsilon_0}$`],
    correct: 'B', explanation: 'Gauss’s law gives flux = enclosed charge / ε₀; the shape of the surface is irrelevant.',
  },
  {
    topicId: 'ch-elec', subtopic: 'Capacitance', difficulty: 'medium', bloom: 'understand', source: 'authored',
    body: 'A parallel-plate capacitor is filled completely with a dielectric of constant K while the battery stays connected. Its stored charge',
    options: ['Is unchanged', 'Becomes K times larger', 'Becomes K times smaller', 'Becomes K² times larger'],
    correct: 'B', explanation: 'With V fixed, Q = CV and C rises to K times its air value, so the charge rises by the same factor.',
  },
  {
    topicId: 'ch-elec', subtopic: 'Capacitance', difficulty: 'hard', bloom: 'apply', source: 'previous_year', kind: 'numerical',
    body: String.raw`Three capacitors of $3\ \mu\mathrm{F}$ each are joined in series. The equivalent capacitance is ____ $\mu\mathrm{F}$.`,
    correctNumeric: 1, unit: 'µF', explanation: 'For series, 1/C = 1/3 + 1/3 + 1/3 = 1, so C = 1 µF.',
  },
  {
    topicId: 'ch-elec', subtopic: 'Conductors', difficulty: 'medium', bloom: 'understand', source: 'coaching', kind: 'multi',
    body: 'A conductor is in electrostatic equilibrium. Which statements are true?',
    options: ['The electric field inside it is zero', 'Its whole volume is at one potential', 'The field just outside is tangential to the surface', 'Charge resides only in the interior'],
    correct: ['A', 'B'], explanation: 'Charge sits on the surface and the external field is normal to it; both false options invert the rule.',
  },
  {
    topicId: 'ch-opt', subtopic: 'Mirrors', difficulty: 'easy', bloom: 'remember', source: 'authored',
    body: 'The lateral magnification produced by a plane mirror is',
    options: ['−1', '+1', 'Zero', 'Infinite'],
    correct: 'B', explanation: 'A plane mirror forms an upright image of the same size, so m = +1.',
  },
  {
    topicId: 'ch-opt', subtopic: 'Mirrors', difficulty: 'medium', bloom: 'apply', source: 'previous_year', kind: 'numerical',
    body: String.raw`An object is placed $30\ \mathrm{cm}$ from a concave mirror of focal length $10\ \mathrm{cm}$. The image distance is ____ $\mathrm{cm}$.`,
    correctNumeric: 15, unit: 'cm', explanation: String.raw`Mirror equation: $1/v+1/u=1/f$ with $u=-30$, $f=-10$ gives $v=-15$ cm.`,
  },
  {
    topicId: 'ch-opt', subtopic: 'Total internal reflection', difficulty: 'medium', bloom: 'apply', source: 'authored',
    body: String.raw`The critical angle for a medium of refractive index $1.5$ against air is closest to`,
    options: [String.raw`$30^\circ$`, String.raw`$42^\circ$`, String.raw`$49^\circ$`, String.raw`$60^\circ$`],
    correct: 'B', explanation: String.raw`$\sin C=1/1.5=0.667$, so $C\approx41.8^\circ$.`,
  },
  {
    topicId: 'ch-opt', subtopic: 'Lenses', difficulty: 'easy', bloom: 'apply', source: 'authored',
    body: String.raw`A converging lens of focal length $20\ \mathrm{cm}$ has a power of`,
    options: [String.raw`$+5\ \mathrm{D}$`, String.raw`$+0.05\ \mathrm{D}$`, String.raw`$-5\ \mathrm{D}$`, String.raw`$+20\ \mathrm{D}$`],
    correct: 'A', explanation: 'P = 1/f in metres = 1/0.20 = +5 D.',
  },
  {
    topicId: 'ch-opt', subtopic: 'Mirrors', difficulty: 'medium', bloom: 'analyse', source: 'imported', kind: 'image',
    body: 'The diagram shows a ray striking a concave mirror parallel to the principal axis. Which statement describes the reflected ray?',
    options: ['It passes through the centre of curvature', 'It passes through the principal focus', 'It retraces its own path', 'It reflects back parallel to the axis'],
    correct: 'B', explanation: 'A ray parallel to the principal axis reflects through the focus — the definition of the focal point for paraxial rays.',
    image: '/media/rotational-dynamics-sample-poster.svg',
  },
  {
    topicId: 'ch-thermo', subtopic: 'Processes', difficulty: 'easy', bloom: 'remember', source: 'authored',
    body: 'In an adiabatic process on an ideal gas',
    options: ['Q = 0', 'W = 0', 'ΔU = 0', 'ΔT = 0'],
    correct: 'A', explanation: 'Adiabatic means no heat exchange, so the first law becomes ΔU = −W.',
  },
  {
    topicId: 'ch-thermo', subtopic: 'Heat engines', difficulty: 'medium', bloom: 'apply', source: 'previous_year',
    body: String.raw`A Carnot engine works between $500\ \mathrm{K}$ and $300\ \mathrm{K}$. Its efficiency is`,
    options: ['20%', '40%', '60%', '80%'],
    correct: 'B', explanation: 'η = 1 − T_cold/T_hot = 1 − 300/500 = 0.4, i.e. 40%.',
  },
  {
    topicId: 'ch-thermo', subtopic: 'Processes', difficulty: 'hard', bloom: 'apply', source: 'authored', kind: 'numerical',
    body: String.raw`One mole of an ideal gas expands isothermally at $300\ \mathrm{K}$ until its volume doubles. Take $R=8.314\ \mathrm{J\,mol^{-1}K^{-1}}$ and $\ln 2=0.693$. The work done by the gas is approximately ____ $\mathrm{J}$.`,
    correctNumeric: 1729, tolerance: 3, unit: 'J', explanation: 'W = nRT ln(V₂/V₁) = 1 × 8.314 × 300 × 0.693 ≈ 1729 J.',
  },
  {
    topicId: 'ch-thermo', subtopic: 'First law', difficulty: 'medium', bloom: 'analyse', source: 'coaching', kind: 'multi',
    body: 'For an ideal gas taken through an isochoric process, which statements hold?',
    options: ['The work done is zero', 'Q = ΔU', 'Pressure is proportional to temperature', 'Q = 0'],
    correct: ['A', 'B', 'C'], explanation: 'Constant volume means W = 0, so Q = ΔU, and P/T is fixed. Only an adiabatic process has Q = 0.',
  },
  {
    topicId: 'ch-current', subtopic: 'Drift velocity', difficulty: 'medium', bloom: 'understand', source: 'authored',
    body: String.raw`In a metallic conductor carrying current $I$, the drift velocity $v_d$ is related to current density $J$ by`,
    options: [String.raw`$J=nev_d$`, String.raw`$J=ev_d/n$`, String.raw`$J=I^2nev_d$`, String.raw`$J=ne^2v_d$`],
    correct: 'A', explanation: 'Current density equals carrier density × charge × drift velocity; the wire area converts J into I.',
  },
  {
    topicId: 'ch-current', subtopic: 'Bridge circuits', difficulty: 'medium', bloom: 'apply', source: 'previous_year', kind: 'numerical',
    body: String.raw`Resistances of $4\ \Omega$ and $6\ \Omega$ are connected in parallel. The equivalent resistance is ____ $\Omega$.`,
    correctNumeric: 2.4, unit: 'Ω', explanation: '1/R = 1/4 + 1/6 = 5/12, so R = 2.4 Ω.',
  },
  {
    topicId: 'ch-current', subtopic: 'Ohm law', difficulty: 'hard', bloom: 'analyse', source: 'coaching',
    body: 'A Wheatstone bridge is balanced. Which single change keeps it balanced?',
    options: ['Interchange the battery and the galvanometer', 'Double every resistance', 'Change only one ratio arm', 'Reduce the battery voltage to zero'],
    correct: 'B', explanation: 'Balance depends on the ratio of the arms, so scaling all four by the same factor leaves the ratio unchanged.',
  },
  {
    topicId: 'ch-modern', subtopic: 'Photoelectric effect', difficulty: 'medium', bloom: 'understand', source: 'authored',
    body: 'On increasing the intensity of incident light on a photosensitive surface above threshold, the photoelectric current',
    options: ['Decreases', 'Increases, while the stopping potential is unchanged', 'Falls to zero', 'Increases and the stopping potential rises with it'],
    correct: 'B', explanation: 'Intensity sets the number of emitted electrons; the stopping potential follows frequency, not intensity.',
  },
  {
    topicId: 'ch-modern', subtopic: 'Nuclear decay', difficulty: 'medium', bloom: 'apply', source: 'previous_year',
    body: String.raw`A radioactive sample has a half-life of $8$ days. The fraction remaining after $24$ days is`,
    options: ['1/2', '1/4', '1/8', '1/16'],
    correct: 'C', explanation: 'Twenty-four days is three half-lives, so the remaining fraction is (1/2)³ = 1/8.',
  },
]

/* ── Chemistry ────────────────────────────────────────────────────────── */

/** @type {Omit<Parameters<typeof compose>[0], 'kind'>[]} */
const chemistry = [
  {
    topicId: 'ch-bond', subtopic: 'Hybridisation', difficulty: 'easy', bloom: 'remember', source: 'authored',
    body: String.raw`The hybridisation of carbon in $\mathrm{CH_4}$ is`,
    options: [String.raw`$sp$`, String.raw`$sp^2$`, String.raw`$sp^3$`, String.raw`$sp^3d$`],
    correct: 'C', explanation: 'Four sigma bonds and no lone pairs give tetrahedral geometry and sp³ hybridisation.',
  },
  {
    topicId: 'ch-bond', subtopic: 'VSEPR', difficulty: 'easy', bloom: 'remember', source: 'authored',
    body: String.raw`The bond angle in a water molecule is approximately`,
    options: [String.raw`$180^\circ$`, String.raw`$120^\circ$`, String.raw`$104.5^\circ$`, String.raw`$90^\circ$`],
    correct: 'C', explanation: 'Two lone pairs compress the tetrahedral angle from 109.5° to about 104.5°.',
  },
  {
    topicId: 'ch-bond', subtopic: 'Hybridisation', difficulty: 'medium', bloom: 'apply', source: 'previous_year', kind: 'numerical',
    body: String.raw`The number of sigma bonds in one molecule of ethene, $\mathrm{C_2H_4}$, is ____.`,
    correctNumeric: 5, explanation: 'Four C–H sigma bonds plus one C–C sigma bond; the π bond is not a sigma bond.',
  },
  {
    topicId: 'ch-bond', subtopic: 'VSEPR', difficulty: 'medium', bloom: 'apply', source: 'authored',
    body: String.raw`The shape of $\mathrm{BF_3}$ is`,
    options: ['Trigonal planar', 'Pyramidal', 'Tetrahedral', 'Linear'],
    correct: 'A', explanation: 'Three bond pairs and an empty p orbital on boron give a trigonal planar, 120° molecule.',
  },
  {
    topicId: 'ch-bond', subtopic: 'Dipole moment', difficulty: 'medium', bloom: 'analyse', source: 'coaching',
    body: 'Which molecule has a zero net dipole moment?',
    options: [String.raw`$\mathrm{H_2O}$`, String.raw`$\mathrm{NH_3}$`, String.raw`$\mathrm{CO_2}$`, String.raw`$\mathrm{HCl}$`],
    correct: 'C', explanation: 'Linear CO₂ has two equal, opposite bond dipoles that cancel exactly.',
  },
  {
    topicId: 'ch-bond', subtopic: 'Hydrogen bonding', difficulty: 'easy', bloom: 'understand', source: 'authored',
    body: 'Hydrogen bonding is strongest in',
    options: [String.raw`$\mathrm{H_2S}$`, String.raw`$\mathrm{HF}$`, String.raw`$\mathrm{HCl}$`, String.raw`$\mathrm{PH_3}$`],
    correct: 'B', explanation: 'Fluorine is small and the most electronegative, so the H–F···F bond is the strongest of the four.',
  },
  {
    topicId: 'ch-org', subtopic: 'Nucleophiles', difficulty: 'easy', bloom: 'remember', source: 'authored',
    body: 'Which species behaves as a nucleophile?',
    options: [String.raw`$\mathrm{NH_3}$`, String.raw`$\mathrm{BF_3}$`, String.raw`$\mathrm{AlCl_3}$`, String.raw`$\mathrm{H^+}$`],
    correct: 'A', explanation: 'Ammonia donates a lone pair; the other three are electron-pair acceptors.',
  },
  {
    topicId: 'ch-org', subtopic: 'Addition reactions', difficulty: 'easy', bloom: 'apply', source: 'previous_year',
    body: 'Markovnikov addition of HBr to propene gives mainly',
    options: ['1-bromopropane', '2-bromopropane', 'Propan-1-ol', 'Propane'],
    correct: 'B', explanation: 'The proton adds to the carbon with more hydrogens, so bromine lands on the more substituted carbon.',
  },
  {
    topicId: 'ch-org', subtopic: 'Substitution', difficulty: 'medium', bloom: 'understand', source: 'authored',
    body: String.raw`The rate of an $\mathrm{S_N1}$ reaction is determined by`,
    options: ['The concentration of the nucleophile only', 'The concentration of the substrate only', 'Both concentrations', 'Neither concentration'],
    correct: 'B', explanation: 'The slow step is the unimolecular ionisation of the substrate, so the rate depends only on its concentration.',
  },
  {
    topicId: 'ch-org', subtopic: 'Aromaticity', difficulty: 'medium', bloom: 'understand', source: 'authored',
    body: 'Benzene reacts mainly by',
    options: ['Electrophilic substitution', 'Nucleophilic addition', 'Free-radical addition', 'Polymerisation'],
    correct: 'A', explanation: 'Substitution preserves the aromatic sextet; addition would destroy the delocalisation energy.',
  },
  {
    topicId: 'ch-org', subtopic: 'Nucleophiles', difficulty: 'medium', bloom: 'analyse', source: 'imported', kind: 'image',
    body: 'The mechanism sketch shows a curved arrow beginning on a positive charge. What is wrong with it?',
    options: ['The arrow should start at an electron pair, not a positive centre', 'The arrow should end on the leaving group', 'Nothing: arrows can start anywhere', 'The arrow should be double-headed'],
    correct: 'A', explanation: 'Curved arrows track electron movement, so the tail must sit on a lone pair or a bond, never on an electron-poor centre.',
    image: '/media/organic-mechanisms-sample-poster.svg',
  },
  {
    topicId: 'ch-eq', subtopic: 'Ionic product', difficulty: 'easy', bloom: 'remember', source: 'authored',
    body: String.raw`The ionic product of water at $25^\circ\mathrm{C}$ is`,
    options: [String.raw`$10^{-7}$`, String.raw`$10^{-14}$`, String.raw`$10^{14}$`, '1'],
    correct: 'B', explanation: String.raw`$K_w=[\mathrm{H^+}][\mathrm{OH^-}]=10^{-14}$ at 25 °C.`,
  },
  {
    topicId: 'ch-eq', subtopic: 'Le Chatelier', difficulty: 'medium', bloom: 'apply', source: 'authored',
    body: 'For an exothermic reaction at equilibrium, raising the temperature shifts the position',
    options: ['Towards products', 'Towards reactants', 'No shift', 'Towards the catalyst'],
    correct: 'B', explanation: 'Heat behaves as a product here, so adding heat drives the reverse direction.',
  },
  {
    topicId: 'ch-eq', subtopic: 'pH & pOH', difficulty: 'medium', bloom: 'apply', source: 'previous_year', kind: 'numerical',
    body: String.raw`The pOH of an aqueous solution of pH $4$ at $25^\circ\mathrm{C}$ is ____.`,
    correctNumeric: 10, explanation: 'pH + pOH = 14 at 25 °C, so pOH = 10.',
  },
  {
    topicId: 'ch-eq', subtopic: 'Catalysis', difficulty: 'easy', bloom: 'understand', source: 'authored',
    body: 'A catalyst raises the rate of a reaction by',
    options: ['Increasing the equilibrium constant', 'Lowering the activation energy', 'Increasing the enthalpy change', 'Changing the stoichiometry'],
    correct: 'B', explanation: 'A catalyst offers an alternative path with lower activation energy; it leaves the equilibrium constant unchanged.',
  },
  {
    topicId: 'ch-kinetics', subtopic: 'Rate laws', difficulty: 'easy', bloom: 'remember', source: 'authored',
    body: 'The SI unit of the rate constant of a first-order reaction is',
    options: [String.raw`$\mathrm{s^{-1}}$`, String.raw`$\mathrm{mol\,L^{-1}s^{-1}}$`, String.raw`$\mathrm{L\,mol^{-1}s^{-1}}$`, String.raw`$\mathrm{mol^{-1}L\,s^{-1}}$`],
    correct: 'A', explanation: 'For first order, rate = k[A], so k carries the reciprocal of time.',
  },
  {
    topicId: 'ch-kinetics', subtopic: 'Half life', difficulty: 'medium', bloom: 'apply', source: 'previous_year',
    body: String.raw`For a first-order reaction, the half-life is`,
    options: [String.raw`$k/0.693$`, String.raw`$0.693/k$`, String.raw`$1/k$`, String.raw`$2k$`],
    correct: 'B', explanation: 'First-order half-life is independent of concentration and equals ln2/k ≈ 0.693/k.',
  },
  {
    topicId: 'ch-kinetics', subtopic: 'Half life', difficulty: 'hard', bloom: 'apply', source: 'coaching', kind: 'numerical',
    body: 'A first-order reaction is 50% complete in 10 minutes. The percentage remaining after 30 minutes is ____ %.',
    correctNumeric: 12.5, unit: '%', explanation: 'Thirty minutes is three half-lives, so the remaining fraction is (1/2)³ = 12.5%.',
  },
  {
    topicId: 'ch-kinetics', subtopic: 'Order & molecularity', difficulty: 'hard', bloom: 'analyse', source: 'coaching',
    body: 'A reaction has the rate law rate = k[A][B]². Its overall order is',
    options: ['1', '2', '3', '0'],
    correct: 'C', explanation: 'Overall order is the sum of the exponents: 1 + 2 = 3.',
  },
  {
    topicId: 'ch-coord', subtopic: 'Oxidation state', difficulty: 'medium', bloom: 'apply', source: 'previous_year', kind: 'numerical',
    body: String.raw`The oxidation state of iron in $\mathrm{K_4[Fe(CN)_6]}$ is ____.`,
    correctNumeric: 2, explanation: String.raw`$4(+1)+x+6(-1)=0$, so $x=+2$.`,
  },
  {
    topicId: 'ch-coord', subtopic: 'Ligands', difficulty: 'medium', bloom: 'remember', source: 'authored',
    body: 'EDTA is best described as a',
    options: ['Monodentate ligand', 'Bidentate ligand', 'Hexadentate ligand', 'Neutral bridge'],
    correct: 'C', explanation: 'EDTA binds through two nitrogen atoms and four carboxylate oxygens, giving six donor sites.',
  },
  {
    topicId: 'ch-pblock', subtopic: 'Anomalous behaviour', difficulty: 'medium', bloom: 'analyse', source: 'coaching', kind: 'multi',
    body: 'Which properties of water are anomalous for a molecule of its mass?',
    options: ['Exceptionally high boiling point', 'High surface tension', 'Low specific heat capacity', 'Expands on freezing'],
    correct: ['A', 'B', 'D'], explanation: 'Extensive hydrogen bonding gives water a high boiling point and surface tension and an open ice lattice; its specific heat is unusually high, not low.',
  },
]

/* ── Mathematics ──────────────────────────────────────────────────────── */

/** @type {Omit<Parameters<typeof compose>[0], 'kind'>[]} */
const mathematics = [
  {
    topicId: 'ch-calc', subtopic: 'Standard integrals', difficulty: 'easy', bloom: 'apply', source: 'authored', kind: 'numerical',
    body: String.raw`$\displaystyle\int_0^{\pi}\sin x\,dx$ = ____.`,
    correctNumeric: 2, explanation: String.raw`$[-\cos x]_0^{\pi}=-(-1)-(-1)=2$.`,
  },
  {
    topicId: 'ch-calc', subtopic: 'Properties', difficulty: 'medium', bloom: 'understand', source: 'previous_year',
    body: String.raw`$\displaystyle\int_0^{a} f(x)\,dx$ equals`,
    options: [String.raw`$\displaystyle\int_0^{a} f(a-x)\,dx$`, String.raw`$\displaystyle\int_0^{a} f(x+a)\,dx$`, String.raw`$2\displaystyle\int_0^{a} f(x)\,dx$`, String.raw`$\displaystyle\int_{-a}^{a} f(x)\,dx$`],
    correct: 'A', explanation: 'The substitution x = a − t changes the limits to each other and reverses the differential twice, leaving the value unchanged.',
  },
  {
    topicId: 'ch-calc', subtopic: 'Substitution', difficulty: 'medium', bloom: 'apply', source: 'authored',
    body: String.raw`$\displaystyle\int x\,e^{x}\,dx$ equals`,
    options: [String.raw`$x e^{x}-e^{x}+C$`, String.raw`$x e^{x}+e^{x}+C$`, String.raw`$\dfrac{x^2}{2}e^{x}+C$`, String.raw`$e^{x}+C$`],
    correct: 'A', explanation: 'Integrating by parts with u = x gives x eˣ − ∫eˣ dx = x eˣ − eˣ + C.',
  },
  {
    topicId: 'ch-calc', subtopic: 'Properties', difficulty: 'hard', bloom: 'create', source: 'coaching', kind: 'subjective',
    body: String.raw`Prove that $\displaystyle\int_0^{1} x(1-x)^{n}\,dx=\dfrac{1}{(n+1)(n+2)}$ for every integer $n\geq 0$.`,
    explanation: String.raw`Substitute $u=1-x$, so $x=1-u$ and the integral becomes $\int_0^1 (1-u)u^{n}\,du=\frac{1}{n+1}-\frac{1}{n+2}$, which simplifies to the required form.`,
    tags: ['definite integrals', 'proof'], marks: 5, negativeMarks: 0,
  },
  {
    topicId: 'ch-calc', subtopic: 'Standard integrals', difficulty: 'hard', bloom: 'apply', source: 'previous_year', kind: 'numerical',
    body: String.raw`$\displaystyle\int_0^{1}\dfrac{1}{1+x^2}\,dx$ = ____ (take $\pi=3.1416$; answer to two decimals).`,
    correctNumeric: 0.79, tolerance: 0.01, explanation: 'The antiderivative is arctan x, so the value is π/4 ≈ 0.79.',
  },
  {
    topicId: 'ch-prob', subtopic: 'Classical probability', difficulty: 'easy', bloom: 'apply', source: 'authored',
    body: 'A fair coin is tossed three times. The probability of at least one head is',
    options: [String.raw`$\dfrac{1}{8}$`, String.raw`$\dfrac{3}{8}$`, String.raw`$\dfrac{7}{8}$`, String.raw`$\dfrac{1}{2}$`],
    correct: 'C', explanation: 'The complement is three tails, with probability 1/8, so the answer is 7/8.',
  },
  {
    topicId: 'ch-prob', subtopic: 'Expectation', difficulty: 'medium', bloom: 'apply', source: 'previous_year', kind: 'numerical',
    body: 'A fair six-sided die is rolled once. The expected value of the outcome is ____.',
    correctNumeric: 3.5, explanation: 'The mean of the equally likely values 1 to 6 is (1+2+3+4+5+6)/6 = 3.5.',
  },
  {
    topicId: 'ch-prob', subtopic: 'Conditional probability', difficulty: 'medium', bloom: 'understand', source: 'authored',
    body: String.raw`For two events with $P(A\cap B)=0.2$ and $P(B)=0.5$, $P(A\mid B)$ is`,
    options: ['0.1', '0.4', '0.7', '2.5'],
    correct: 'B', explanation: 'P(A|B) = P(A∩B)/P(B) = 0.2/0.5 = 0.4.',
  },
  {
    topicId: 'ch-prob', subtopic: 'Classical probability', difficulty: 'hard', bloom: 'analyse', source: 'coaching', kind: 'multi',
    body: String.raw`For two independent events $A$ and $B$ with non-zero probability, which statements are true?`,
    options: [String.raw`$P(A\cap B)=P(A)P(B)$`, String.raw`$P(A\cup B)=P(A)+P(B)-P(A)P(B)$`, String.raw`$P(A\mid B)=P(A)$`, String.raw`$A$ and $B$ must be mutually exclusive`],
    correct: ['A', 'B', 'C'], explanation: 'Independence gives multiplication and conditional equality; it also forces the events to overlap, so mutual exclusivity is impossible here.',
  },
  {
    topicId: 'ch-vec', subtopic: 'Dot product', difficulty: 'easy', bloom: 'apply', source: 'authored',
    body: String.raw`The vectors $\mathbf{a}=2\hat{i}+3\hat{j}$ and $\mathbf{b}=3\hat{i}-2\hat{j}$ are`,
    options: ['Parallel', 'Perpendicular', 'Antiparallel', 'Equal in magnitude only'],
    correct: 'B', explanation: 'Their dot product is 6 − 6 = 0, so the angle between them is 90°.',
  },
  {
    topicId: 'ch-vec', subtopic: 'Triple product', difficulty: 'medium', bloom: 'apply', source: 'previous_year', kind: 'numerical',
    body: String.raw`The volume of the parallelepiped with edges $\hat{i}$, $\hat{j}$ and $2\hat{k}$ is ____ cubic units.`,
    correctNumeric: 2, explanation: 'The scalar triple product is the determinant of the identity rows scaled by 2, giving 2.',
  },
  {
    topicId: 'ch-vec', subtopic: 'Cross product', difficulty: 'medium', bloom: 'understand', source: 'authored',
    body: String.raw`$\hat{i}\times\hat{j}$ equals`,
    options: [String.raw`$\hat{k}$`, String.raw`$-\hat{k}$`, String.raw`$\hat{i}$`, 'Zero'],
    correct: 'A', explanation: 'The right-handed cyclic order i, j, k gives i × j = k.',
  },
  {
    topicId: 'ch-vec', subtopic: 'Dot product', difficulty: 'hard', bloom: 'analyse', source: 'coaching',
    body: String.raw`If $\mathbf{a}\cdot\mathbf{b}=0$ and $\mathbf{a}\times\mathbf{b}=\mathbf{0}$ for non-zero vectors, then`,
    options: ['Both vectors are parallel', 'Both vectors are perpendicular', 'The data is contradictory', 'They add to zero'],
    correct: 'C', explanation: 'A zero dot product makes them perpendicular while a zero cross product makes them parallel; for non-zero vectors both cannot hold.',
  },
  {
    topicId: 'ch-algebra', subtopic: 'Quadratic roots', difficulty: 'easy', bloom: 'remember', source: 'authored',
    body: String.raw`If $\alpha$ and $\beta$ are the roots of $x^2-5x+6=0$, then $\alpha+\beta$ is`,
    options: ['5', '6', '−5', '11'],
    correct: 'A', explanation: 'The sum of roots is −b/a = 5; the product is c/a = 6.',
  },
  {
    topicId: 'ch-algebra', subtopic: 'Complex numbers', difficulty: 'medium', bloom: 'apply', source: 'previous_year',
    body: String.raw`The modulus of $3+4i$ is`,
    options: ['5', '7', '12', String.raw`$\sqrt{7}$`],
    correct: 'A', explanation: '|3 + 4i| = √(9 + 16) = 5.',
  },
  {
    topicId: 'ch-algebra', subtopic: 'Permutations', difficulty: 'medium', bloom: 'apply', source: 'authored', kind: 'numerical',
    body: 'The number of distinct arrangements of the four letters in VYUH is ____.',
    correctNumeric: 24, explanation: 'All four letters are distinct, so the count is 4! = 24.',
  },
  {
    topicId: 'ch-algebra', subtopic: 'Quadratic roots', difficulty: 'hard', bloom: 'evaluate', source: 'coaching',
    body: String.raw`If $x^2+px+q=0$ has real roots, which condition must hold?`,
    options: [String.raw`$p^2\geq 4q$`, String.raw`$p^2\leq 4q$`, String.raw`$p^2=4q^2$`, String.raw`$p+q\geq 0$`],
    correct: 'A', explanation: 'The discriminant of x² + px + q is p² − 4q, and real roots require it to be non-negative.',
  },
  {
    topicId: 'ch-coord', subtopic: 'Circles', difficulty: 'easy', bloom: 'apply', source: 'authored',
    body: String.raw`The centre of the circle $x^2+y^2-4x+6y-12=0$ is`,
    options: [String.raw`$(2,-3)$`, String.raw`$(-2,3)$`, String.raw`$(4,-6)$`, String.raw`$(2,3)$`],
    correct: 'A', explanation: 'Complete the squares: (x − 2)² + (y + 3)² = 25, so the centre is (2, −3).',
  },
  {
    topicId: 'ch-coord', subtopic: 'Ellipse', difficulty: 'medium', bloom: 'apply', source: 'previous_year',
    body: String.raw`The eccentricity of the ellipse $\dfrac{x^2}{25}+\dfrac{y^2}{9}=1$ is`,
    options: [String.raw`$\dfrac{4}{5}$`, String.raw`$\dfrac{3}{5}$`, String.raw`$\dfrac{4}{3}$`, String.raw`$\dfrac{5}{4}$`],
    correct: 'A', explanation: String.raw`$e=\sqrt{1-b^2/a^2}=\sqrt{1-9/25}=4/5$.`,
  },
  {
    topicId: 'ch-coord', subtopic: 'Straight lines', difficulty: 'medium', bloom: 'apply', source: 'authored', kind: 'numerical',
    body: String.raw`The slope of the line $3x+4y=12$ is ____ (give a decimal).`,
    correctNumeric: -0.75, tolerance: 0.01, explanation: 'Rearrange to y = 3 − (3/4)x, so the slope is −0.75.',
  },
  {
    topicId: 'ch-coord', subtopic: 'Circles', difficulty: 'hard', bloom: 'analyse', source: 'coaching', kind: 'subjective',
    body: String.raw`Show that the circle $x^2+y^2-2x-2y+1=0$ touches the coordinate axes, and state both points of contact.`,
    explanation: 'The centre is (1, 1) and the radius is 1, equal to the distance from the centre to each axis, so the circle is tangent at (1, 0) and (0, 1).',
    tags: ['circle', 'tangency'], marks: 5, negativeMarks: 0,
  },
]

/* ── Biology ──────────────────────────────────────────────────────────── */

/** @type {Omit<Parameters<typeof compose>[0], 'kind'>[]} */
const biology = [
  {
    topicId: 'ch-cell', subtopic: 'Organelles', difficulty: 'easy', bloom: 'remember', source: 'authored',
    body: 'The organelle described as the powerhouse of the cell is the',
    options: ['Ribosome', 'Mitochondrion', 'Lysosome', 'Golgi apparatus'],
    correct: 'B', explanation: 'Mitochondria produce most of the cell’s ATP through aerobic respiration.',
  },
  {
    topicId: 'ch-cell', subtopic: 'Organelles', difficulty: 'easy', bloom: 'remember', source: 'authored',
    body: 'Which organelle contains hydrolytic digestive enzymes?',
    options: ['Lysosome', 'Ribosome', 'Centriole', 'Nucleolus'],
    correct: 'A', explanation: 'Lysosomes carry acid hydrolases for intracellular digestion.',
  },
  {
    topicId: 'ch-cell', subtopic: 'Organelles', difficulty: 'medium', bloom: 'understand', source: 'previous_year',
    body: 'Protein synthesis in the cell takes place on',
    options: ['Ribosomes', 'Lysosomes', 'Vacuoles', 'Centrosomes'],
    correct: 'A', explanation: 'Ribosomes translate mRNA into polypeptides, free in the cytosol or bound to the rough ER.',
  },
  {
    topicId: 'ch-cell', subtopic: 'Cell division', difficulty: 'medium', bloom: 'remember', source: 'authored',
    body: 'Sister chromatids separate during which phase of mitosis?',
    options: ['Prophase', 'Metaphase', 'Anaphase', 'Telophase'],
    correct: 'C', explanation: 'Anaphase pulls sister chromatids to opposite poles once the spindle attaches.',
  },
  {
    topicId: 'ch-cell', subtopic: 'Cell wall', difficulty: 'medium', bloom: 'remember', source: 'authored',
    body: 'The cell wall of fungi is composed mainly of',
    options: ['Cellulose', 'Chitin', 'Peptidoglycan', 'Silica'],
    correct: 'B', explanation: 'Fungal walls use chitin; plant walls use cellulose and bacterial walls peptidoglycan.',
  },
  {
    topicId: 'ch-cell', subtopic: 'Organelles', difficulty: 'hard', bloom: 'analyse', source: 'coaching', kind: 'multi',
    body: 'Which of these structures are bounded by a double membrane?',
    options: ['Mitochondrion', 'Chloroplast', 'Nucleus', 'Lysosome'],
    correct: ['A', 'B', 'C'], explanation: 'Mitochondria, chloroplasts and the nucleus have two membranes; a lysosome has one.',
  },
  {
    topicId: 'ch-genetics', subtopic: 'Mendelian ratios', difficulty: 'easy', bloom: 'apply', source: 'authored',
    body: String.raw`In a monohybrid cross $Aa\times Aa$ with complete dominance, the phenotypic ratio is`,
    options: ['1:1', '3:1', '9:3:3:1', '1:2:1'],
    correct: 'B', explanation: 'Three dominant phenotypes to one recessive, although the genotypic ratio is 1:2:1.',
  },
  {
    topicId: 'ch-genetics', subtopic: 'DNA replication', difficulty: 'easy', bloom: 'remember', source: 'authored',
    body: 'DNA replication is described as',
    options: ['Conservative', 'Semiconservative', 'Dispersive only', 'Random'],
    correct: 'B', explanation: 'Each daughter duplex keeps one parental strand and one newly synthesised strand.',
  },
  {
    topicId: 'ch-genetics', subtopic: 'Genetic code', difficulty: 'easy', bloom: 'remember', source: 'authored',
    body: 'The genetic code is read in',
    options: ['Single bases', 'Doublets', 'Triplets', 'Quadruplets'],
    correct: 'C', explanation: 'Codons are three-nucleotide sequences, giving 64 combinations.',
  },
  {
    topicId: 'ch-genetics', subtopic: 'Mendelian ratios', difficulty: 'medium', bloom: 'apply', source: 'previous_year', kind: 'numerical',
    body: 'In humans, the number of autosomes in a somatic cell is ____.',
    correctNumeric: 44, explanation: 'A human somatic cell has 44 autosomes and 2 sex chromosomes.',
  },
  {
    topicId: 'ch-genetics', subtopic: 'Mendelian ratios', difficulty: 'medium', bloom: 'understand', source: 'authored',
    body: 'A test cross is used to determine',
    options: ['The genotype of a dominant phenotype', 'The rate of transpiration', 'Blood group inheritance only', 'Chromosome size'],
    correct: 'A', explanation: 'Crossing with a homozygous recessive exposes whether the dominant-looking parent is heterozygous.',
  },
  {
    topicId: 'ch-genetics', subtopic: 'Genetic code', difficulty: 'hard', bloom: 'analyse', source: 'coaching',
    body: 'A frameshift mutation is caused by',
    options: ['Substitution of one base', 'Insertion or deletion of bases not in multiples of three', 'Inversion of a whole chromosome', 'Methylation of a promoter'],
    correct: 'B', explanation: 'Adding or removing a base shifts every downstream codon, changing the whole reading frame.',
  },
  {
    topicId: 'ch-plant', subtopic: 'Photosynthesis', difficulty: 'easy', bloom: 'remember', source: 'authored',
    body: 'Photosynthetic oxygen is released from',
    options: ['Carbon dioxide', 'Water', 'Glucose', 'Chlorophyll'],
    correct: 'B', explanation: 'Photolysis of water in photosystem II releases O₂ as a by-product.',
  },
  {
    topicId: 'ch-plant', subtopic: 'Photosynthesis', difficulty: 'medium', bloom: 'remember', source: 'authored',
    body: 'The Calvin cycle takes place in the',
    options: ['Thylakoid lumen', 'Stroma', 'Grana membrane', 'Cytoplasm'],
    correct: 'B', explanation: 'Carbon fixation enzymes sit in the chloroplast stroma, outside the thylakoids.',
  },
  {
    topicId: 'ch-plant', subtopic: 'Transpiration', difficulty: 'medium', bloom: 'understand', source: 'previous_year',
    body: 'Transpiration pull is mainly responsible for',
    options: ['Phloem loading', 'Ascent of sap', 'Seed germination', 'Phototropism'],
    correct: 'B', explanation: 'Cohesion–tension in the xylem, driven by transpiration at the leaves, lifts water upward.',
  },
  {
    topicId: 'ch-plant', subtopic: 'Photosynthesis', difficulty: 'easy', bloom: 'apply', source: 'authored', kind: 'numerical',
    body: 'The number of carbon atoms in one molecule of glucose is ____.',
    correctNumeric: 6, explanation: 'Glucose is C₆H₁₂O₆, so it carries six carbon atoms.',
  },
  {
    topicId: 'ch-plant', subtopic: 'Mineral nutrition', difficulty: 'hard', bloom: 'analyse', source: 'coaching', kind: 'multi',
    body: 'Which elements are classified as macronutrients for plants?',
    options: ['Nitrogen', 'Phosphorus', 'Potassium', 'Zinc'],
    correct: ['A', 'B', 'C'], explanation: 'Nitrogen, phosphorus and potassium are required in large amounts; zinc is a micronutrient.',
  },
  {
    topicId: 'ch-human', subtopic: 'Excretion', difficulty: 'easy', bloom: 'remember', source: 'authored',
    body: 'The functional unit of the kidney is the',
    options: ['Neuron', 'Nephron', 'Alveolus', 'Villus'],
    correct: 'B', explanation: 'Each nephron filters blood and forms urine; a human kidney holds about a million of them.',
  },
  {
    topicId: 'ch-human', subtopic: 'Endocrinology', difficulty: 'easy', bloom: 'remember', source: 'authored',
    body: 'Insulin is secreted by',
    options: ['Alpha cells of the islets', 'Beta cells of the islets', 'The adrenal cortex', 'Thyroid follicles'],
    correct: 'B', explanation: 'Pancreatic beta cells release insulin; alpha cells release glucagon.',
  },
  {
    topicId: 'ch-human', subtopic: 'Circulation', difficulty: 'medium', bloom: 'remember', source: 'previous_year',
    body: 'The pacemaker of the human heart is the',
    options: ['AV node', 'SA node', 'Bundle of His', 'Purkinje fibre'],
    correct: 'B', explanation: 'The sinoatrial node depolarises first and sets the normal rhythm.',
  },
  {
    topicId: 'ch-human', subtopic: 'Immunity', difficulty: 'medium', bloom: 'understand', source: 'authored',
    body: 'Which blood cells are primarily involved in immunity?',
    options: ['Erythrocytes', 'Leukocytes', 'Platelets', 'Reticulocytes'],
    correct: 'B', explanation: 'White blood cells recognise and neutralise pathogens; red cells carry oxygen.',
  },
  {
    topicId: 'ch-human', subtopic: 'Circulation', difficulty: 'medium', bloom: 'apply', source: 'authored', kind: 'numerical',
    body: 'The normal human core body temperature in degrees Celsius is approximately ____.',
    correctNumeric: 37, tolerance: 0.5, unit: '°C', explanation: 'Homeostasis holds core temperature near 37 °C, with small diurnal variation.',
  },
  {
    topicId: 'ch-ecology', subtopic: 'Energy flow', difficulty: 'medium', bloom: 'apply', source: 'previous_year',
    body: 'If producers fix 10 000 kJ of energy, the energy available at the third trophic level is about',
    options: ['1 000 kJ', '100 kJ', '10 kJ', '1 kJ'],
    correct: 'B', explanation: 'With the ten-per-cent rule, 10 000 → 1 000 → 100 kJ across three levels.',
  },
  {
    topicId: 'ch-ecology', subtopic: 'Biodiversity', difficulty: 'medium', bloom: 'remember', source: 'authored',
    body: 'Which pair describes a mutualistic relationship?',
    options: ['Lichen: alga and fungus', 'Cuscuta on a host plant', 'Tick on a dog', 'Tapeworm in the intestine'],
    correct: 'A', explanation: 'The alga photosynthesises and the fungus supplies shelter and minerals; both benefit.',
  },
  {
    topicId: 'ch-ecology', subtopic: 'Populations', difficulty: 'hard', bloom: 'analyse', source: 'coaching',
    body: 'A population shows an S-shaped growth curve. The upper flattening is explained by',
    options: ['Unlimited resources', 'Environmental carrying capacity', 'Zero natality', 'Absence of predation'],
    correct: 'B', explanation: 'Logistic growth levels off as density-dependent limits approach the carrying capacity K.',
  },
]

/** @type {BankQuestion[]} */
export const questionBank = [
  ...physics,
  ...chemistry,
  ...mathematics,
  ...biology,
].map((row, index) => compose({ ...row, kind: row.kind ?? 'single' }, index))

/**
 * Subtopics offered by the editor for a topic, plus any subtopic already used by
 * a question in that topic (a typed-in subtopic becomes a real facet).
 * @param {string} topicId
 * @param {BankQuestion[]} [bank]
 */
export function subtopicsFor(topicId, bank = questionBank) {
  const topic = TOPIC_BY_ID.get(topicId)
  const base = topic?.subtopics ?? []
  const used = bank.filter((question) => question.topicId === topicId).map((question) => question.subtopic)
  return [...new Set([...base, ...used])]
}

/** @param {string} topicId */
export function topicById(topicId) {
  return TOPIC_BY_ID.get(topicId) ?? null
}

/** @param {string} subjectId */
export function topicsForSubject(subjectId) {
  return bankTopics.filter((topic) => topic.subjectId === subjectId)
}

export const questionKindLabels = {
  single: 'Single correct',
  multi: 'Multi correct',
  numerical: 'Numerical',
  subjective: 'Subjective',
  image: 'Image based',
}

export const difficultyLabels = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }

export const bloomLabels = {
  remember: 'Remember',
  understand: 'Understand',
  apply: 'Apply',
  analyse: 'Analyse',
  evaluate: 'Evaluate',
  create: 'Create',
}

export const sourceLabels = {
  authored: 'Authored in house',
  imported: 'Imported',
  previous_year: 'Previous year',
  coaching: 'Coaching material',
}

/** Kept for symmetry with the other fixture modules. @type {Difficulty[]} */
export const difficultyOrder = DIFFICULTY_ORDER
