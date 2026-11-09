import { Tabs, Tab, TabList, TabPanel } from '@/shared/ui'
import { ChatPanel, ParticipantsPanel, PollsPanel, QuestionsPanel, ResourcesPanel } from './EngagementPanels.jsx'

/**
 * Shared engagement rail. Works in both themes because it uses theme-aware
 * design tokens. Faculty gets moderation actions; Students get participation
 * actions. Every button writes a recorded mock event — there are no decorative
 * controls.
 *
 * The panel bodies live in EngagementPanels.jsx so the faculty Teaching tools
 * panel can mount the same components without duplicating behaviour.
 * @param {Object} props
 * @param {import('@/contracts/liveStudio.js').StudioSnapshot} props.snapshot
 * @param {any} props.view
 * @param {(type:string,payload?:Object,options?:Object)=>void} props.send
 * @param {'faculty'|'student'} props.role
 * @param {string} props.activeTab
 * @param {(tab:string)=>void} props.onTabChange
 * @param {any} props.metadata
 * @param {import('@/contracts/liveStudio.js').StudioQuestion[]} [props.questions]
 *   Moderated question list for Students. Faculty always sees the full queue.
 */
export function EngagementPanel({ snapshot, view, send, role, activeTab, onTabChange, metadata, questions }) {
  const faculty = role === 'faculty'
  const questionList = faculty ? snapshot.questions : (questions ?? view.visibleQuestions ?? [])
  const lines = faculty ? snapshot.chat : view.visibleChat

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="flex min-h-0 flex-col">
      {/* R14: the legacy LiveRail already has a "Chat" tab on the Student page.
          Give this rail its own unambiguous name in both roles. */}
      <TabList aria-label={faculty ? 'Studio engagement' : 'Shared classroom engagement'} className="shrink-0">
        <Tab value="chat" count={lines.length}>{faculty ? 'Studio chat' : 'Shared chat'}</Tab>
        <Tab value="questions" count={questionList.length}>Q&amp;A</Tab>
        <Tab value="participants" count={snapshot.participants.length}>Participants</Tab>
        <Tab value="polls" count={snapshot.polls.length}>Polls</Tab>
        <Tab value="resources" count={snapshot.resources.length}>Resources</Tab>
      </TabList>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <TabPanel value="chat"><ChatPanel snapshot={snapshot} view={view} send={send} role={role} /></TabPanel>
        <TabPanel value="questions"><QuestionsPanel snapshot={snapshot} view={view} send={send} role={role} questions={questions} /></TabPanel>
        <TabPanel value="participants"><ParticipantsPanel snapshot={snapshot} view={view} send={send} role={role} /></TabPanel>
        <TabPanel value="polls"><PollsPanel snapshot={snapshot} send={send} role={role} metadata={metadata} /></TabPanel>
        <TabPanel value="resources"><ResourcesPanel snapshot={snapshot} view={view} send={send} role={role} /></TabPanel>
      </div>
    </Tabs>
  )
}
