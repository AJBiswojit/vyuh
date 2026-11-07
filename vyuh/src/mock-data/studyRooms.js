/** @typedef {import('../contracts/learning.js').StudyRoomDetail} StudyRoomDetail */
/** @type {StudyRoomDetail[]} */
export const studyRooms = [
  {
    id: 'room-torque', name: 'Torque Table · Problem Set 4', mode: 'interactive', topic: 'Rotational equilibrium', subjectName: 'Physics', batchName: 'Prayas JEE 2027 — Morning', peerCount: 5, capacity: 8, focusMinutes: 25, joined: false,
    participants: [
      { id: 'stu-ishita', name: 'Ishita P.', initials: 'IP', presence: 'speaking', isSelf: false },
      { id: 'stu-rohan', name: 'Rohan M.', initials: 'RM', presence: 'studying', isSelf: false },
      { id: 'stu-meera', name: 'Meera S.', initials: 'MS', presence: 'studying', isSelf: false },
      { id: 'stu-aarav', name: 'Aarav D.', initials: 'AD', presence: 'away', isSelf: false },
      { id: 'stu-kavya', name: 'Kavya R.', initials: 'KR', presence: 'studying', isSelf: false },
    ],
  },
  {
    id: 'room-mechanisms', name: 'Mechanism Sprint · 20 arrows', mode: 'interactive', topic: 'Nucleophilic substitution', subjectName: 'Chemistry', batchName: 'Prayas JEE 2027 — Morning', peerCount: 3, capacity: 6, focusMinutes: 20, joined: false,
    participants: [
      { id: 'stu-dev', name: 'Dev N.', initials: 'DN', presence: 'studying', isSelf: false },
      { id: 'stu-sana', name: 'Sana K.', initials: 'SK', presence: 'speaking', isSelf: false },
      { id: 'stu-vikram', name: 'Vikram S.', initials: 'VS', presence: 'studying', isSelf: false },
    ],
  },
  {
    id: 'room-integration', name: 'Integration Quiet Room', mode: 'interactive', topic: 'Definite integral properties', subjectName: 'Mathematics', batchName: 'Prayas JEE 2027 — Morning', peerCount: 2, capacity: 6, focusMinutes: 45, joined: false,
    participants: [
      { id: 'stu-tara', name: 'Tara B.', initials: 'TB', presence: 'studying', isSelf: false },
      { id: 'stu-om', name: 'Om P.', initials: 'OP', presence: 'away', isSelf: false },
    ],
  },
]

/** Names cycled by the mock room-presence channel. */
export const roomVisitors = [
  { id: 'stu-nisha', name: 'Nisha G.', initials: 'NG' },
  { id: 'stu-aditya', name: 'Aditya S.', initials: 'AS' },
  { id: 'stu-pooja', name: 'Pooja M.', initials: 'PM' },
]
