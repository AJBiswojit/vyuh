import { Tab, TabList, Tabs } from '@/shared/ui'

/**
 * BATCH 3 (WS3) — exactly two People tabs. There is deliberately no third tab:
 * no Password Requests queue, no consent panel, no Admin-created Admin seats.
 * Counts come from the merged canonical roster and are honest, not decorative.
 *
 * @param {Object} props
 * @param {'student'|'faculty'} props.value
 * @param {(next: 'student'|'faculty') => void} props.onValueChange
 * @param {number} [props.studentCount]
 * @param {number} [props.facultyCount]
 */
export function PeopleTabs({ value, onValueChange, studentCount, facultyCount }) {
  return (
    <Tabs value={value} onValueChange={(next) => onValueChange(/** @type {'student'|'faculty'} */ (next))}>
      <TabList aria-label="People groups">
        <Tab value="student" count={studentCount}>Students</Tab>
        <Tab value="faculty" count={facultyCount}>Faculty</Tab>
      </TabList>
    </Tabs>
  )
}
