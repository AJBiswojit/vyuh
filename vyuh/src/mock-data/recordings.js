/**
 * Recording library. Each 48-second original sample edit stands in for a full
 * class; chapters, transcript lines and the end quiz are timed to that media.
 * @typedef {import('../contracts/learning.js').RecordingDetail} RecordingDetail
 * @typedef {import('../contracts/learning.js').PlaybackState} PlaybackState
 * @typedef {Omit<RecordingDetail,'playback'|'quizResult'>} RecordingFixture
 */
const now = Date.now()
/** @param {number} hours */
function ago(hours) { return new Date(now - hours * 3_600_000).toISOString() }

/** @param {string} id @param {string} title @param {number} start @param {number} end */
function chapter(id, title, start, end) { return { id, title, startSeconds: start, endSeconds: end } }
/** @param {string} id @param {number} start @param {string} text */
function line(id, start, text) { return { id, startSeconds: start, endSeconds: start + 4, text } }
/** @param {string} id @param {string} prompt @param {string[]} texts @param {string} correctKey @param {string} explanation */
function question(id, prompt, texts, correctKey, explanation) {
  return { id, prompt, options: texts.map((text, index) => ({ key: String.fromCharCode(65 + index), text })), correctKey, explanation }
}

/** @type {RecordingFixture[]} */
export const recordings = [
  {
    id: 'rec-rot-b', title: 'Rotational Dynamics · Torque & Equilibrium', chapterName: 'Rotational Motion', subjectId: 'sub-phy', subjectName: 'Physics', facultyName: 'Dr. Snehasish Mohapatra', batchName: 'Prayas JEE 2027 — Morning',
    description: 'A short sample edit: choose the axis, write both equilibrium conditions, then check a limiting case.',
    mediaUrl: '/media/rotational-dynamics-sample.mp4', captionsUrl: '/media/rotational-dynamics-sample.vtt', posterUrl: '/media/rotational-dynamics-sample-poster.svg',
    durationSeconds: 48, durationMinutes: 1, progressPercent: 62, lastWatchedAt: ago(2), publishedAt: ago(22),
    chapters: [chapter('rot-ch-1', 'Read the system', 0, 12), chapter('rot-ch-2', 'Build the equation', 12, 24), chapter('rot-ch-3', 'Check the limiting case', 24, 36), chapter('rot-ch-4', 'Practice prompt', 36, 48)],
    transcript: [
      line('rot-t-1', 0, 'Start by choosing the axis. The hinge is convenient because the unknown hinge force passes through it.'),
      line('rot-t-2', 4, 'Torque equals force times the perpendicular distance from the axis to the line of action.'),
      line('rot-t-3', 8, 'Mark the weight at the centre of mass and draw the perpendicular moment arm before substituting.'),
      line('rot-t-4', 12, 'Equilibrium asks for two conditions: net force is zero and net torque is zero.'),
      line('rot-t-5', 16, 'Write the torque equation about the hinge so the hinge reaction drops out.'),
      line('rot-t-6', 20, 'Keep signs consistent: anticlockwise positive, clockwise negative, for every term.'),
      line('rot-t-7', 24, 'Now check a limiting case. If the ladder becomes vertical, the weight moment arm shrinks to zero.'),
      line('rot-t-8', 28, 'A smaller moment arm means a smaller torque, even when the force itself is unchanged.'),
      line('rot-t-9', 32, 'If your formula predicts more torque in that limit, recheck the geometry before the algebra.'),
      line('rot-t-10', 36, 'Practice prompt: a uniform beam is hinged at one end and held by a vertical string at the other.'),
      line('rot-t-11', 40, 'Find the string tension using torque about the hinge, then verify with the force equation.'),
      line('rot-t-12', 44, 'Pause here, solve it in your notebook, and take the three-question check when the video ends.'),
    ],
    quiz: { id: 'quiz-rot', title: 'Lecture to Practice · Torque', questions: [
      question('rot-q1', 'Why choose the hinge as the pivot?', ['It removes the hinge force from the torque equation', 'It makes gravity disappear', 'It always maximises torque'], 'A', 'The hinge force acts through the pivot, so its moment arm is zero.'),
      question('rot-q2', 'What happens to torque when the perpendicular moment arm shrinks?', ['It increases', 'It decreases', 'It stays exactly the same'], 'B', 'Torque is force times perpendicular distance; with force fixed, less distance means less torque.'),
      question('rot-q3', 'Which pair of conditions defines equilibrium?', ['Net force zero and net torque zero', 'Speed zero and acceleration zero only', 'Maximum force and minimum torque'], 'A', 'A rigid body in equilibrium has no net force and no net torque about any axis.'),
    ] },
  },
  {
    id: 'rec-org-m', title: 'Organic Reaction Mechanisms · Arrow Pushing', chapterName: 'General Organic Chemistry', subjectId: 'sub-che', subjectName: 'Chemistry', facultyName: 'Rituparna Das', batchName: 'Prayas JEE 2027 — Morning',
    description: 'Follow the electrons: nucleophile, electrophile, leaving group, and the slow step that sets the rate.',
    mediaUrl: '/media/organic-mechanisms-sample.mp4', captionsUrl: '/media/organic-mechanisms-sample.vtt', posterUrl: '/media/organic-mechanisms-sample-poster.svg',
    durationSeconds: 48, durationMinutes: 1, progressPercent: 100, lastWatchedAt: ago(26), publishedAt: ago(46),
    chapters: [chapter('org-ch-1', 'Find the electron source', 0, 12), chapter('org-ch-2', 'Push the arrows', 12, 24), chapter('org-ch-3', 'Identify the slow step', 24, 36), chapter('org-ch-4', 'Practice prompt', 36, 48)],
    transcript: [
      line('org-t-1', 0, 'Begin with the electron-rich site. A lone pair or a pi bond can act as the nucleophile.'),
      line('org-t-2', 4, 'The electrophile is electron-poor: a positive centre, a polarised carbon, or an empty orbital.'),
      line('org-t-3', 8, 'Curved arrows always start at electrons and point toward the atom or bond that receives them.'),
      line('org-t-4', 12, 'Draw the attack and the leaving-group departure together when the mechanism is concerted.'),
      line('org-t-5', 16, 'Never push an arrow from a positive charge; the tail must sit on a lone pair or a bond.'),
      line('org-t-6', 20, 'Check valence after every step. Carbon cannot keep five bonds in a stable intermediate.'),
      line('org-t-7', 24, 'The slow step controls the rate. In SN1, ionisation to the carbocation is usually slow.'),
      line('org-t-8', 28, 'Molecularity describes the slow elementary step; order comes from the experimental rate law.'),
      line('org-t-9', 32, 'A fractional order can signal a pre-equilibrium or a chain process, not a fractional molecule.'),
      line('org-t-10', 36, 'Practice prompt: tert-butyl bromide reacts with water. Identify the nucleophile and the slow step.'),
      line('org-t-11', 40, 'Water attacks after ionisation; the rate depends on the substrate in the simplest SN1 picture.'),
      line('org-t-12', 44, 'Sketch the three steps, then take the short check after the video ends.'),
    ],
    quiz: { id: 'quiz-org', title: 'Lecture to Practice · Mechanisms', questions: [
      question('org-q1', 'Where does a curved arrow start?', ['At a positive charge', 'At a lone pair or bond', 'At the leaving group nucleus'], 'B', 'Arrows show electron movement, so the tail begins at an electron source.'),
      question('org-q2', 'Which step is usually slow in SN1?', ['Nucleophilic attack', 'Deprotonation', 'Ionisation to the carbocation'], 'C', 'Breaking the carbon–leaving-group bond to form the carbocation is the rate-determining step.'),
      question('org-q3', 'Experimental order comes from…', ['The balanced equation alone', 'The experimental rate law', 'The number of products'], 'B', 'Order is measured experimentally; molecularity is counted from an elementary step.'),
    ] },
  },
  {
    id: 'rec-int-c', title: 'Definite Integration · Properties & Substitution', chapterName: 'Integral Calculus', subjectId: 'sub-mat', subjectName: 'Mathematics', facultyName: 'Prof. Gayatri Nanda', batchName: 'Prayas JEE 2027 — Morning',
    description: 'Use the reflection property, change limits with the substitution, and recognise an odd integrand.',
    mediaUrl: '/media/integration-sample.mp4', captionsUrl: '/media/integration-sample.vtt', posterUrl: '/media/integration-sample-poster.svg',
    durationSeconds: 48, durationMinutes: 1, progressPercent: 0, lastWatchedAt: ago(70), publishedAt: ago(70),
    chapters: [chapter('int-ch-1', 'Reflect the interval', 0, 12), chapter('int-ch-2', 'Change the limits', 12, 24), chapter('int-ch-3', 'Use symmetry', 24, 36), chapter('int-ch-4', 'Practice prompt', 36, 48)],
    transcript: [
      line('int-t-1', 0, 'The reflection property replaces x by a plus b minus x without changing the value of the integral.'),
      line('int-t-2', 4, 'Add the original and reflected forms; a symmetric denominator often collapses to a constant.'),
      line('int-t-3', 8, 'This is why the king property is powerful for sine and cosine over a full symmetric interval.'),
      line('int-t-4', 12, 'When you substitute, change the limits immediately. Old limits with a new variable are a common error.'),
      line('int-t-5', 16, 'If t equals a plus b minus x, then dt equals minus dx and the limits swap.'),
      line('int-t-6', 20, 'The two minus signs cancel when you reorder the limits, leaving the integral unchanged.'),
      line('int-t-7', 24, 'Symmetry gives a shortcut: the integral of an odd function over minus a to a is zero.'),
      line('int-t-8', 28, 'Check oddness about the centre of the interval, not only about the origin.'),
      line('int-t-9', 32, 'Split the integrand into symmetric and antisymmetric parts before doing heavy algebra.'),
      line('int-t-10', 36, 'Practice prompt: integrate x over minus two to two, then integrate x squared over the same interval.'),
      line('int-t-11', 40, 'The first is zero by odd symmetry; the second is twice the integral from zero to two.'),
      line('int-t-12', 44, 'Write both answers with a one-line reason, then take the end check.'),
    ],
    quiz: { id: 'quiz-int', title: 'Lecture to Practice · Integration', questions: [
      question('int-q1', 'Under t = a + b − x, what happens to the limits?', ['They stay the same', 'They swap and the sign changes', 'They both become zero'], 'B', 'dt = −dx and the endpoints reverse; reordering removes the minus sign.'),
      question('int-q2', 'The integral of an odd function over [−a, a] is…', ['2a', 'Zero', 'Twice the integral from 0 to a'], 'B', 'The two halves cancel by symmetry.'),
      question('int-q3', 'The reflection property replaces x with…', ['a − b + x', 'a + b − x', 'x − a − b'], 'B', 'Reflecting across the midpoint maps x to a + b − x.'),
    ] },
  },
]

/** @type {Record<string, Pick<PlaybackState,'positionSeconds'|'watchedThroughSeconds'|'speed'|'ended'|'bookmarks'|'notes'>>} */
export const recordingPlaybackSeeds = {
  'rec-rot-b': { positionSeconds: 29.8, watchedThroughSeconds: 29.8, speed: 1, ended: false, bookmarks: [{ id: 'bm-axis', timeSeconds: 8, label: 'Moment arm diagram', createdAt: ago(2) }], notes: [{ id: 'note-hinge', timeSeconds: 12, text: 'Choose the hinge first — the unknown reaction drops out of the torque equation.', createdAt: ago(2) }] },
  'rec-org-m': { positionSeconds: 48, watchedThroughSeconds: 48, speed: 1, ended: true, bookmarks: [], notes: [] },
  'rec-int-c': { positionSeconds: 0, watchedThroughSeconds: 0, speed: 1, ended: false, bookmarks: [], notes: [] },
}

/** Legacy dashboard summary; the dashboard service now reads persisted playback. */
export const continueRecording = { id: 'rec-rot-b', title: recordings[0].title, chapterName: recordings[0].chapterName, subjectName: 'Physics', facultyName: 'Dr. Snehasish Mohapatra', durationMinutes: 1, progressPercent: 62, lastWatchedAt: ago(2) }
