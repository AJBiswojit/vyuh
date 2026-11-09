import { Tabs, Tab, TabList, TabPanel } from '@/shared/ui'
import { ParticipantList } from '@/features/faculty/components/HostPanels.jsx'
import { ChatPanel, ParticipantsPanel, PollsPanel, QuestionsPanel, ResourcesPanel } from './EngagementPanels.jsx'
import { SceneManager } from './SceneManager.jsx'
import { SlidesPanel } from './SlidesPanel.jsx'

/**
 * Level 2 — Teaching tools. Everything a teacher reaches for mid-class, one
 * click away, without crowding the everyday stage. Each tab is labelled in
 * plain language; every action writes a recorded mock event or uses the
 * existing attendance-linked roster, so nothing here is decorative.
 * @param {Object} props
 * @param {import('@/contracts/liveStudio.js').StudioSnapshot} props.snapshot
 * @param {any} props.view
 * @param {(type:string,payload?:Object,options?:Object)=>void} props.send
 * @param {any} props.metadata
 * @param {string} props.activeTab
 * @param {(tab:string)=>void} props.onTabChange
 * @param {Array} props.participants   Attendance-linked class roster.
 * @param {boolean} props.muteBusy
 * @param {(studentId:string, muted:boolean)=>void} props.onToggleMute
 */
export function TeachingToolsPanel({ snapshot, view, send, metadata, activeTab, onTabChange, participants, muteBusy, onToggleMute }) {
  const slideCount = snapshot.slides.length

  return (
    <section aria-label="Teaching tools" className="overflow-hidden rounded-sm border border-line bg-surface">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-4 pb-2 pt-3">
        <p className="rule-label">Teaching tools</p>
        <p className="text-2xs text-muted">Open one when you need it — the stage keeps running either way.</p>
      </header>
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabList aria-label="Teaching tools" className="shrink-0 px-2">
          <Tab value="slides" count={slideCount}>Slides</Tab>
          <Tab value="stage">Stage view</Tab>
          <Tab value="questions" count={snapshot.questions.length}>Q&amp;A</Tab>
          <Tab value="chat" count={snapshot.chat.length}>Chat</Tab>
          <Tab value="polls" count={snapshot.polls.length}>Polls</Tab>
          <Tab value="students" count={participants.length}>Students</Tab>
          <Tab value="resources" count={snapshot.resources.length}>Resources</Tab>
        </TabList>
        <div className="p-3">
          <TabPanel value="slides"><SlidesPanel slides={snapshot.slides} slideIndex={snapshot.toolbox.slideIndex} send={send} /></TabPanel>
          <TabPanel value="stage">
            <div className="flex flex-col gap-2">
              <p className="text-2xs leading-relaxed text-muted">Choose what fills the stage students see. Your current choice is highlighted.</p>
              <SceneManager scenes={view.scenes} activeScene={snapshot.activeScene} send={send} />
            </div>
          </TabPanel>
          <TabPanel value="questions"><QuestionsPanel snapshot={snapshot} view={view} send={send} role="faculty" /></TabPanel>
          <TabPanel value="chat"><ChatPanel snapshot={snapshot} view={view} send={send} role="faculty" /></TabPanel>
          <TabPanel value="polls"><PollsPanel snapshot={snapshot} send={send} role="faculty" metadata={metadata} /></TabPanel>
          <TabPanel value="students">
            <div className="flex flex-col gap-3">
              <ParticipantList participants={participants} onToggleMute={onToggleMute} busy={muteBusy} />
              <div className="rounded-sm border border-line bg-surface-sunken p-3">
                <p className="rule-label">Simulated class (demo)</p>
                <p className="mt-1 text-2xs leading-relaxed text-muted">Steer the demo classroom the student view mirrors. These rows are labelled simulations — they are not real students and no attendance is recorded from them.</p>
                <div className="mt-2">
                  <ParticipantsPanel snapshot={snapshot} view={view} send={send} role="faculty" />
                </div>
              </div>
            </div>
          </TabPanel>
          <TabPanel value="resources"><ResourcesPanel snapshot={snapshot} view={view} send={send} role="faculty" /></TabPanel>
        </div>
      </Tabs>
    </section>
  )
}
