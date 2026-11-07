/**
 * Subjects, chapters and batches.
 * @typedef {import('../contracts/academic.js').Subject} Subject
 * @typedef {import('../contracts/academic.js').Chapter} Chapter
 */

/** @type {Subject[]} */
export const subjects = [
  { id: 'sub-phy', name: 'Physics', shortName: 'PHY', track: 'JEE', chapterCount: 29, questionCount: 8460 },
  { id: 'sub-che', name: 'Chemistry', shortName: 'CHE', track: 'JEE', chapterCount: 30, questionCount: 7925 },
  { id: 'sub-mat', name: 'Mathematics', shortName: 'MAT', track: 'JEE', chapterCount: 27, questionCount: 9130 },
  { id: 'sub-bio', name: 'Biology', shortName: 'BIO', track: 'NEET', chapterCount: 38, questionCount: 11480 },
]

/** @type {Chapter[]} */
export const chapters = [
  { id: 'ch-rot', subjectId: 'sub-phy', name: 'Rotational Motion', weightage: 6.4, mastery: 42 },
  { id: 'ch-elec', subjectId: 'sub-phy', name: 'Electrostatics', weightage: 7.1, mastery: 58 },
  { id: 'ch-opt', subjectId: 'sub-phy', name: 'Ray Optics', weightage: 5.2, mastery: 71 },
  { id: 'ch-thermo', subjectId: 'sub-phy', name: 'Thermodynamics', weightage: 5.8, mastery: 36 },
  { id: 'ch-bond', subjectId: 'sub-che', name: 'Chemical Bonding', weightage: 6.0, mastery: 64 },
  { id: 'ch-org', subjectId: 'sub-che', name: 'Organic Reaction Mechanisms', weightage: 8.5, mastery: 31 },
  { id: 'ch-eq', subjectId: 'sub-che', name: 'Equilibrium', weightage: 5.0, mastery: 55 },
  { id: 'ch-calc', subjectId: 'sub-mat', name: 'Definite Integrals', weightage: 6.7, mastery: 47 },
  { id: 'ch-prob', subjectId: 'sub-mat', name: 'Probability', weightage: 5.4, mastery: 62 },
  { id: 'ch-vec', subjectId: 'sub-mat', name: 'Vectors & 3D geometry', weightage: 7.0, mastery: 39 },
  { id: 'ch-cell', subjectId: 'sub-bio', name: 'Cell Structure and Function', weightage: 8.2, mastery: 66 },
  { id: 'ch-genetics', subjectId: 'sub-bio', name: 'Genetics and Evolution', weightage: 9.4, mastery: 52 },
  { id: 'ch-plant', subjectId: 'sub-bio', name: 'Plant Physiology', weightage: 7.6, mastery: 61 },
  { id: 'ch-human', subjectId: 'sub-bio', name: 'Human Physiology', weightage: 10.1, mastery: 57 },
]

export { batches } from './batches.js'
