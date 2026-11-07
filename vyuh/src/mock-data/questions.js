/**
 * Authored NEET-style practice bank. Sixty questions, three sections of twenty.
 * Correct answers and explanations live here for Phase 5; the exam service
 * strips them before the paper reaches the hall.
 *
 * @typedef {import('../contracts/exam.js').ExamQuestion} ExamQuestion
 * @typedef {ExamQuestion & { correctOptions: string[], correctNumeric: number | null, explanation: string }} AuthoredQuestion
 */
import { readFlag } from './latency.js'

export const NEET_PRACTICE_EXAM_ID = 'exam-neet-practice'
export const DEFAULT_QUESTION_COUNT = 60

/** @param {string} id @param {string} subjectId @param {string} sectionId @param {string} chapterId @param {string} body @param {string[]} options @param {string} correct @param {string} explanation @returns {AuthoredQuestion} */
function mc(id, subjectId, sectionId, chapterId, body, options, correct, explanation) {
  return {
    id, number: 0, subjectId, sectionId, chapterId, type: 'single', difficulty: 'medium', body,
    options: options.map((text, index) => ({ key: /** @type {'A'|'B'|'C'|'D'} */ (['A', 'B', 'C', 'D'][index]), body: text })),
    marks: 4, negativeMarks: 1, correctOptions: [correct], correctNumeric: null, explanation,
  }
}

/** @param {string} id @param {string} subjectId @param {string} sectionId @param {string} chapterId @param {string} body @param {number} correct @param {string} explanation @param {string} [unit] @returns {AuthoredQuestion} */
function numeric(id, subjectId, sectionId, chapterId, body, correct, explanation, unit) {
  return {
    id, number: 0, subjectId, sectionId, chapterId, type: 'numeric', difficulty: 'medium', body,
    options: [], marks: 4, negativeMarks: 1, correctOptions: [], correctNumeric: correct, numericTolerance: 0.01, unit, explanation,
  }
}

/** @type {AuthoredQuestion[]} */
const physics = [
  mc('q-neet-p01', 'sub-phy', 'sec-phy', 'ch-rot', String.raw`A uniform disc of mass $M$ and radius $R$ rolls without slipping down a plane inclined at $30^\circ$. The acceleration of its centre is`, [String.raw`$g/3$`, String.raw`$2g/5$`, String.raw`$g/2$`, String.raw`$3g/7$`], 'A', String.raw`For a disc, $a = g\sin\theta/(1+I/MR^2)=g(1/2)/(3/2)=g/3$.`),
  mc('q-neet-p02', 'sub-phy', 'sec-phy', 'ch-elec', String.raw`Two point charges $+q$ and $+q$ are separated by $2r$. The electric field at the midpoint is`, [String.raw`$kq/r^2$`, String.raw`$2kq/r^2$`, 'Zero', String.raw`$4kq/r^2$`], 'C', 'Equal like charges produce equal and opposite fields at the midpoint.'),
  numeric('q-neet-p03', 'sub-phy', 'sec-phy', 'ch-rot', String.raw`A wheel starts from rest with angular acceleration $2\ \mathrm{rad\,s^{-2}}$. Its angular speed after $5\ \mathrm{s}$, in $\mathrm{rad\,s^{-1}}$, is`, 10, String.raw`$\omega=\alpha t=2\times5=10$.`, 'rad/s'),
  mc('q-neet-p04', 'sub-phy', 'sec-phy', 'ch-opt', String.raw`A convex lens of focal length $20\ \mathrm{cm}$ forms a real image of an object placed at $30\ \mathrm{cm}$. The image distance is`, [String.raw`$60\ \mathrm{cm}$`, String.raw`$30\ \mathrm{cm}$`, String.raw`$12\ \mathrm{cm}$`, String.raw`$15\ \mathrm{cm}$`], 'A', String.raw`Lens formula gives $1/v=1/20+1/30=1/60$ using the real-is-positive convention for this setup.`),
  mc('q-neet-p05', 'sub-phy', 'sec-phy', 'ch-thermo', String.raw`An ideal gas expands isothermally. Which quantity remains unchanged?`, ['Internal energy', 'Pressure', 'Volume', 'Density'], 'A', 'For an ideal gas, internal energy depends only on temperature.'),
  mc('q-neet-p06', 'sub-phy', 'sec-phy', 'ch-rot', String.raw`The moment of inertia of a thin rod of mass $M$ and length $L$ about one end is`, [String.raw`$ML^2/12$`, String.raw`$ML^2/3$`, String.raw`$ML^2/2$`, String.raw`$ML^2$`], 'B', 'Parallel-axis theorem from the centre: ML²/12 + M(L/2)² = ML²/3.'),
  numeric('q-neet-p07', 'sub-phy', 'sec-phy', 'ch-elec', String.raw`A capacitor of $2\ \mu\mathrm{F}$ is charged to $100\ \mathrm{V}$. The stored charge, in $\mu\mathrm{C}$, is`, 200, String.raw`$Q=CV=2\times100=200$.`, 'µC'),
  mc('q-neet-p08', 'sub-phy', 'sec-phy', 'ch-opt', String.raw`Total internal reflection occurs when light travels from`, ['Rarer to denser medium', 'Denser to rarer medium beyond the critical angle', 'Vacuum to glass', 'Any medium at normal incidence'], 'B', 'TIR requires denser-to-rarer propagation and incidence above the critical angle.'),
  mc('q-neet-p09', 'sub-phy', 'sec-phy', 'ch-thermo', String.raw`The efficiency of a Carnot engine between $600\ \mathrm{K}$ and $300\ \mathrm{K}$ is`, ['25%', '50%', '75%', '100%'], 'B', String.raw`$\eta=1-T_c/T_h=1-300/600=0.5$.`),
  mc('q-neet-p10', 'sub-phy', 'sec-phy', 'ch-rot', String.raw`A body moves in a circle of radius $r$ with speed $v$. Its centripetal acceleration is`, [String.raw`$v/r$`, String.raw`$v^2/r$`, String.raw`$vr$`, String.raw`$v^2r$`], 'B', 'Centripetal acceleration points inward with magnitude v²/r.'),
  mc('q-neet-p11', 'sub-phy', 'sec-phy', 'ch-elec', String.raw`The equivalent resistance of two $6\ \Omega$ resistors in parallel is`, [String.raw`$12\ \Omega$`, String.raw`$6\ \Omega$`, String.raw`$3\ \Omega$`, String.raw`$1\ \Omega$`], 'C', 'Parallel equal resistors halve: 6/2 = 3 Ω.'),
  numeric('q-neet-p12', 'sub-phy', 'sec-phy', 'ch-opt', String.raw`A lens has power $+5\ \mathrm{D}$. Its focal length in centimetres is`, 20, String.raw`$f=1/P=0.2\ \mathrm{m}=20\ \mathrm{cm}$.`, 'cm'),
  mc('q-neet-p13', 'sub-phy', 'sec-phy', 'ch-thermo', String.raw`In an adiabatic process, which quantity is zero?`, ['Work done', 'Change in internal energy', 'Heat exchanged', 'Temperature change'], 'C', 'Adiabatic means no heat transfer: Q = 0.'),
  mc('q-neet-p14', 'sub-phy', 'sec-phy', 'ch-rot', String.raw`Angular momentum of a particle about a point is`, [String.raw`$\vec r\times\vec p$`, String.raw`$\vec r\cdot\vec p$`, String.raw`$m\vec v$`, String.raw`$I\omega^2$`], 'A', 'Orbital angular momentum is r cross p.'),
  mc('q-neet-p15', 'sub-phy', 'sec-phy', 'ch-elec', String.raw`Electric potential inside a charged hollow conducting sphere is`, ['Zero', 'Constant and equal to the surface potential', 'Increasing linearly', 'Increasing as 1/r'], 'B', 'The field inside a conductor is zero, so potential is constant.'),
  mc('q-neet-p16', 'sub-phy', 'sec-phy', 'ch-opt', String.raw`Myopia is corrected using a`, ['Convex lens', 'Concave lens', 'Cylindrical lens', 'Bifocal lens'], 'B', 'A diverging lens shifts the far point onto the retina.'),
  numeric('q-neet-p17', 'sub-phy', 'sec-phy', 'ch-thermo', String.raw`A gas absorbs $500\ \mathrm{J}$ of heat and does $200\ \mathrm{J}$ of work. The increase in internal energy, in joules, is`, 300, String.raw`First law: $\Delta U=Q-W=500-200=300$.`, 'J'),
  mc('q-neet-p18', 'sub-phy', 'sec-phy', 'ch-rot', String.raw`If net external torque on a system is zero, which quantity is conserved?`, ['Linear momentum only', 'Angular momentum', 'Kinetic energy only', 'Moment of inertia'], 'B', 'Zero external torque conserves angular momentum.'),
  mc('q-neet-p19', 'sub-phy', 'sec-phy', 'ch-elec', String.raw`The unit of electric field is`, [String.raw`$\mathrm{N\,C^{-1}}$`, String.raw`$\mathrm{J\,C}$`, String.raw`$\mathrm{C\,N^{-1}}$`, String.raw`$\mathrm{V\,m}$`], 'A', 'Electric field is force per unit charge, N/C, also V/m.'),
  mc('q-neet-p20', 'sub-phy', 'sec-phy', 'ch-opt', String.raw`The mirror formula is`, [String.raw`$1/f=1/v-1/u$`, String.raw`$1/f=1/v+1/u$`, String.raw`$f=v+u$`, String.raw`$f=uv$`], 'B', 'For spherical mirrors, 1/f = 1/v + 1/u with the chosen sign convention.'),
]

/** @type {AuthoredQuestion[]} */
const chemistry = [
  mc('q-neet-c01', 'sub-che', 'sec-che', 'ch-eq', String.raw`For $\mathrm{N_2+3H_2\rightleftharpoons 2NH_3}$, increasing pressure favours`, ['Forward reaction', 'Reverse reaction', 'No change', 'Decomposition of catalyst'], 'A', 'Higher pressure favours the side with fewer gas moles: 2 vs 4.'),
  numeric('q-neet-c02', 'sub-che', 'sec-che', 'ch-eq', String.raw`The pH of $10^{-3}\ \mathrm{M}$ HCl at $25^\circ\mathrm{C}$ is`, 3, String.raw`Strong acid: $\mathrm{pH}=-\log[H^+]=3$.`),
  mc('q-neet-c03', 'sub-che', 'sec-che', 'ch-bond', String.raw`The hybridisation of carbon in methane is`, [String.raw`$sp$`, String.raw`$sp^2$`, String.raw`$sp^3$`, String.raw`$dsp^2$`], 'C', 'Four equivalent sigma bonds give tetrahedral sp³ hybridisation.'),
  mc('q-neet-c04', 'sub-che', 'sec-che', 'ch-org', String.raw`Which species is a nucleophile?`, [String.raw`$\mathrm{NH_3}$`, String.raw`$\mathrm{BF_3}$`, String.raw`$\mathrm{AlCl_3}$`, String.raw`$\mathrm{H^+}$`], 'A', 'Ammonia donates an electron pair; the others accept pairs.'),
  mc('q-neet-c05', 'sub-che', 'sec-che', 'ch-bond', String.raw`The bond angle in water is approximately`, [String.raw`$180^\circ$`, String.raw`$120^\circ$`, String.raw`$104.5^\circ$`, String.raw`$90^\circ$`], 'C', 'Two lone pairs compress the tetrahedral angle to about 104.5°.'),
  numeric('q-neet-c06', 'sub-che', 'sec-che', 'ch-eq', String.raw`The oxidation state of sulphur in $\mathrm{H_2SO_4}$ is`, 6, String.raw`$2(+1)+x+4(-2)=0$, so $x=+6$.`),
  mc('q-neet-c07', 'sub-che', 'sec-che', 'ch-org', String.raw`Markovnikov addition of HBr to propene gives mainly`, ['1-bromopropane', '2-bromopropane', 'Propan-1-ol', 'Propane'], 'B', 'H adds to the carbon with more H; Br goes to the more substituted carbon.'),
  mc('q-neet-c08', 'sub-che', 'sec-che', 'ch-bond', String.raw`Which molecule has a zero dipole moment?`, [String.raw`$\mathrm{H_2O}$`, String.raw`$\mathrm{NH_3}$`, String.raw`$\mathrm{CO_2}$`, String.raw`$\mathrm{HCl}$`], 'C', 'Linear CO₂ has equal and opposite bond dipoles.'),
  mc('q-neet-c09', 'sub-che', 'sec-che', 'ch-eq', String.raw`A catalyst increases the rate of reaction by`, ['Increasing equilibrium constant', 'Lowering activation energy', 'Increasing enthalpy change', 'Changing stoichiometry'], 'B', 'Catalysts provide an alternate path with lower activation energy.'),
  numeric('q-neet-c10', 'sub-che', 'sec-che', 'ch-bond', String.raw`The number of sigma bonds in ethene, $\mathrm{C_2H_4}$, is`, 5, 'Four C–H sigma bonds plus one C–C sigma bond; the pi bond is separate.'),
  mc('q-neet-c11', 'sub-che', 'sec-che', 'ch-org', String.raw`Which reagent converts an alcohol to an alkyl chloride with SOCl₂?`, ['Thionyl chloride', 'Sodium chloride', 'Potassium permanganate', 'Ozone'], 'A', 'SOCl₂ is thionyl chloride, a common chlorinating reagent.'),
  mc('q-neet-c12', 'sub-che', 'sec-che', 'ch-eq', String.raw`For an exothermic reaction, raising temperature shifts equilibrium`, ['Forward', 'Reverse', 'No shift', 'To the catalyst'], 'B', 'Heat is a product; adding heat favours the reverse direction.'),
  mc('q-neet-c13', 'sub-che', 'sec-che', 'ch-bond', String.raw`The shape of $\mathrm{BF_3}$ is`, ['Trigonal planar', 'Pyramidal', 'Tetrahedral', 'Linear'], 'A', 'Three bond pairs and no lone pair on boron give trigonal planar geometry.'),
  numeric('q-neet-c14', 'sub-che', 'sec-che', 'ch-org', String.raw`The number of structural isomers of butane, $\mathrm{C_4H_{10}}$, is`, 2, 'n-Butane and isobutane (2-methylpropane).'),
  mc('q-neet-c15', 'sub-che', 'sec-che', 'ch-eq', String.raw`The ionic product of water at $25^\circ\mathrm{C}$ is`, [String.raw`$10^{-7}$`, String.raw`$10^{-14}$`, String.raw`$10^{14}$`, String.raw`$1$`], 'B', String.raw`$K_w=[H^+][OH^-]=10^{-14}$ at 25 °C.`),
  mc('q-neet-c16', 'sub-che', 'sec-che', 'ch-bond', String.raw`Which bond is longest?`, ['C–C', 'C=C', 'C≡C', 'C–H'], 'A', 'Single C–C bonds are longer than double or triple bonds.'),
  mc('q-neet-c17', 'sub-che', 'sec-che', 'ch-org', String.raw`Benzene primarily undergoes`, ['Electrophilic substitution', 'Nucleophilic addition', 'Free-radical addition', 'Polymerisation'], 'A', 'Aromatic stability favours substitution over addition.'),
  numeric('q-neet-c18', 'sub-che', 'sec-che', 'ch-eq', String.raw`The pOH of a solution with pH 4 at $25^\circ\mathrm{C}$ is`, 10, String.raw`$\mathrm{pH}+\mathrm{pOH}=14$.`),
  mc('q-neet-c19', 'sub-che', 'sec-che', 'ch-bond', String.raw`Hydrogen bonding is strongest in`, [String.raw`$\mathrm{H_2S}$`, String.raw`$\mathrm{HF}$`, String.raw`$\mathrm{HCl}$`, String.raw`$\mathrm{PH_3}$`], 'B', 'Fluorine is small and highly electronegative, giving strong H bonds.'),
  mc('q-neet-c20', 'sub-che', 'sec-che', 'ch-org', String.raw`The IUPAC name of $\mathrm{CH_3CH_2OH}$ is`, ['Methanol', 'Ethanol', 'Ethanal', 'Ethanoic acid'], 'B', 'A two-carbon saturated alcohol is ethanol.'),
]

/** @type {AuthoredQuestion[]} */
const biology = [
  mc('q-neet-b01', 'sub-bio', 'sec-bio', 'ch-cell', 'The powerhouse of the cell is the', ['Ribosome', 'Mitochondrion', 'Lysosome', 'Golgi apparatus'], 'B', 'Mitochondria produce most ATP through aerobic respiration.'),
  mc('q-neet-b02', 'sub-bio', 'sec-bio', 'ch-genetics', String.raw`In a monohybrid cross $Aa\times Aa$, the phenotypic ratio with complete dominance is`, ['1:1', '3:1', '9:3:3:1', '1:2:1'], 'B', 'Three dominant phenotypes to one recessive phenotype.'),
  numeric('q-neet-b03', 'sub-bio', 'sec-bio', 'ch-genetics', String.raw`A diploid cell has $2n=16$ chromosomes. The number of chromosomes in a gamete is`, 8, 'Meiosis halves the chromosome number: n = 8.'),
  mc('q-neet-b04', 'sub-bio', 'sec-bio', 'ch-plant', 'Photosynthetic oxygen is released from', ['Carbon dioxide', 'Water', 'Glucose', 'Chlorophyll'], 'B', 'Photolysis of water in photosystem II releases O₂.'),
  mc('q-neet-b05', 'sub-bio', 'sec-bio', 'ch-human', 'The functional unit of the kidney is the', ['Neuron', 'Nephron', 'Alveolus', 'Villus'], 'B', 'Nephrons filter blood and form urine.'),
  mc('q-neet-b06', 'sub-bio', 'sec-bio', 'ch-cell', 'Which organelle contains digestive enzymes?', ['Lysosome', 'Ribosome', 'Centriole', 'Nucleolus'], 'A', 'Lysosomes carry hydrolytic enzymes for intracellular digestion.'),
  numeric('q-neet-b07', 'sub-bio', 'sec-bio', 'ch-genetics', 'In humans, the number of autosomes in a somatic cell is', 44, 'Humans have 44 autosomes and 2 sex chromosomes.'),
  mc('q-neet-b08', 'sub-bio', 'sec-bio', 'ch-plant', 'Transpiration pull is mainly responsible for', ['Phloem loading', 'Ascent of sap', 'Seed germination', 'Phototropism'], 'B', 'Cohesion-tension moves water upward through xylem.'),
  mc('q-neet-b09', 'sub-bio', 'sec-bio', 'ch-human', 'Insulin is secreted by', ['Alpha cells of islets', 'Beta cells of islets', 'Adrenal cortex', 'Thyroid follicles'], 'B', 'Pancreatic beta cells secrete insulin.'),
  mc('q-neet-b10', 'sub-bio', 'sec-bio', 'ch-cell', 'The cell wall of fungi is mainly composed of', ['Cellulose', 'Chitin', 'Peptidoglycan', 'Silica'], 'B', 'Fungal walls use chitin; plants use cellulose.'),
  mc('q-neet-b11', 'sub-bio', 'sec-bio', 'ch-genetics', 'DNA replication is', ['Conservative', 'Semiconservative', 'Dispersive only', 'Random'], 'B', 'Each daughter duplex keeps one parental strand.'),
  numeric('q-neet-b12', 'sub-bio', 'sec-bio', 'ch-human', 'The normal human body temperature in degrees Celsius is approximately', 37, 'Average core body temperature is about 37 °C.'),
  mc('q-neet-b13', 'sub-bio', 'sec-bio', 'ch-plant', 'The site of the Calvin cycle is the', ['Thylakoid lumen', 'Stroma', 'Grana membrane', 'Cytoplasm'], 'B', 'Carbon fixation occurs in the chloroplast stroma.'),
  mc('q-neet-b14', 'sub-bio', 'sec-bio', 'ch-human', 'Which blood cells are primarily involved in immunity?', ['Erythrocytes', 'Leukocytes', 'Platelets', 'Reticulocytes only'], 'B', 'White blood cells mediate immune defence.'),
  mc('q-neet-b15', 'sub-bio', 'sec-bio', 'ch-cell', 'Protein synthesis occurs on', ['Ribosomes', 'Lysosomes', 'Vacuoles', 'Centrosomes'], 'A', 'Ribosomes translate mRNA into polypeptides.'),
  mc('q-neet-b16', 'sub-bio', 'sec-bio', 'ch-genetics', 'A test cross is used to determine', ['Genotype of a dominant phenotype', 'Rate of transpiration', 'Blood group only', 'Chromosome size'], 'A', 'Crossing with a homozygous recessive reveals the unknown genotype.'),
  numeric('q-neet-b17', 'sub-bio', 'sec-bio', 'ch-plant', 'The number of carbon atoms in one molecule of glucose is', 6, 'Glucose is C₆H₁₂O₆.'),
  mc('q-neet-b18', 'sub-bio', 'sec-bio', 'ch-human', 'The pacemaker of the human heart is the', ['AV node', 'SA node', 'Bundle of His', 'Purkinje fibre'], 'B', 'The sinoatrial node initiates the normal heartbeat.'),
  mc('q-neet-b19', 'sub-bio', 'sec-bio', 'ch-cell', 'Which phase of mitosis separates sister chromatids?', ['Prophase', 'Metaphase', 'Anaphase', 'Telophase'], 'C', 'Anaphase pulls sister chromatids to opposite poles.'),
  mc('q-neet-b20', 'sub-bio', 'sec-bio', 'ch-genetics', 'The genetic code is read in', ['Single bases', 'Doublets', 'Triplets', 'Quadruplets'], 'C', 'Codons are three-nucleotide sequences.'),
]

export const authoredSections = [
  { id: 'sec-phy', subjectId: 'sub-phy', name: 'Physics', order: 0 },
  { id: 'sec-che', subjectId: 'sub-che', name: 'Chemistry', order: 1 },
  { id: 'sec-bio', subjectId: 'sub-bio', name: 'Biology', order: 2 },
]

/** Configurable paper size: 3–60, balanced across the three sections. */
export function configuredQuestionCount() {
  let raw = readFlag('VITE_EXAM_QUESTION_COUNT', String(DEFAULT_QUESTION_COUNT))
  try { raw = localStorage.getItem('vyuh.mock.examQuestionCount') ?? raw } catch { /* private mode */ }
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed)) return DEFAULT_QUESTION_COUNT
  return Math.max(3, Math.min(DEFAULT_QUESTION_COUNT, parsed))
}

/** @param {number} [count] @returns {AuthoredQuestion[]} */
export function buildQuestionBank(count = configuredQuestionCount()) {
  const banks = [physics, chemistry, biology]
  const total = Math.max(3, Math.min(DEFAULT_QUESTION_COUNT, count))
  const base = Math.floor(total / banks.length)
  const remainder = total % banks.length
  /** @type {AuthoredQuestion[]} */
  const questions = []
  banks.forEach((bank, sectionIndex) => {
    const take = base + (sectionIndex < remainder ? 1 : 0)
    bank.slice(0, take).forEach((source) => {
      questions.push({ ...source, number: questions.length + 1, options: source.options.map((option) => ({ ...option })) })
    })
  })
  return questions
}

/** Full authored bank, including answer key, for Phase 5. */
export const questions = buildQuestionBank(DEFAULT_QUESTION_COUNT)
