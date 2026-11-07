# Phase 6 — Live classes, automatic attendance, recordings, doubts, study rooms

Status: **complete.** The student side of the second core module. Live media is a
looping local sample, but attendance arithmetic, real-time event ordering,
playback persistence and doubt threads are real within the mock. Every presence
percentage, verdict, transcript highlight and quiz score is produced by the
learning service or a pure helper — components never invent them.

## Routes and entry points

| Route | Surface |
|---|---|
| `/student/live` | Schedule grouped by day, Interactive/Broadcast chips, batch names |
| `/student/live/:sessionId` | Live room: attendance strip, 16:9 stage, chat + question queue rail |
| `/student/attendance` | Monthly summary, plain-words policy, per-session register |
| `/student/recordings` | Grid/ledger library with progress strips, search and subject filter |
| `/student/recordings/:recordingId` | Player: speed, bookmarks, notes, chapters, transcript, end quiz |
| `/student/recordings/:recordingId?t=12` | Deep link that seeks to a timestamp (used by doubts) |
| `/student/doubts` | Inbox with open/answered filters and timestamp links |
| `/student/doubts/:doubtId` | Thread view with a jump-back-to-recording link |
| `/student/study-rooms` | Interactive-only room list with live peer counts |
| `/student/study-rooms/:roomId` | Room with mock participants and a focus timer |

The five Phase 3 stub pages now re-export the Phase 6 pages, so existing bookmarks
and the sidebar keep working. The dashboard **Continue watching** card opens the
player directly; **Attendance** and **Today's schedule** cards read the same
service payloads.

## Live class

- Schedule is grouped by IST day with `Today` / `Tomorrow` / weekday labels and a
  mode filter. Each row shows the mode chip, batch name, faculty and start time.
- The room stage is a 16:9 looping sample video from `/public/media`, with a
  Glacier **LIVE** label and a slowly breathing dot (stopped under reduced motion).
- **Interactive** rooms expose mic, camera, raise-hand and leave as local UI-state
  controls. **Broadcast** rooms hide mic and camera, show a faculty-broadcast
  banner, and read as a studio; questions go through the queue.
- The right rail has two tabs: **Chat** (messages arrive through the mock event
  emitter) and **Question queue** (student upvotes toggle without double-counting;
  faculty approval arrives as a scheduled channel event).

## Automatic attendance

- The strip above the stage shows a smoothly filling presence ring and a
  `Present, 84%` score with a shape+label verdict chip.
- Presence = visible time coverage after grace × attention score. The first
  10 minutes are grace and do not count against the student; hidden tabs earn no
  time credit while the denominator keeps moving.
- An attention check fires at a **random 8–15 minute** interval. A sliding toast
  drains a ring over **15 seconds**; **Still here** dismisses it, logs the response
  and restores 2 points. Missing it costs 4 points and shows the drop as a small
  `−4` tick. A refresh settles any abandoned check so the register never keeps a
  dangling active check.
- The attendance page derives Present / Partial / Absent from a 75% threshold,
  shows a monthly summary and a defaulter warning below threshold, and explains the
  rule in plain words. Leaving and rejoining resumes the same persisted register.

## Recordings

- Library toggles between grid and ledger, with search, subject filter and a
  progress strip per recording.
- The player has native keyboard targets throughout: play/pause, a seek range
  slider, a speed select, mute, captions, bookmark and fullscreen buttons. The
  video itself also accepts Space/K, ←/→ (5s), M and F.
- Resume position, speed, bookmarks and beside-video notes persist across refresh.
  Pause flushes the exact position immediately.
- The chapter rail marks chapters completed only when natural playback crosses
  their end — seeking ahead does not complete them.
- The searchable transcript highlights the line containing the playhead (within
  one segment), derived from the same `currentTime` the player renders.
- **Doubt at…** attaches a question to the current timestamp and opens a thread.
- The three-question **Lecture to Practice** end card appears only after the media
  reaches its end (the `ended` event or a previously persisted completion).

## Doubts and study rooms

- Doubt inbox filters by open/answered; each thread links back to the exact
  recording timestamp. Creating a doubt from the player carries the timestamp into
  the thread; replies persist.
- Study rooms are interactive-only. The room view shows a mock participant list
  whose presence ticks flow through the same realtime boundary as live chat, plus
  a local focus timer. Joining adds a self participant; leaving removes it.

## Mock data and realtime

| File | Holds |
|---|---|
| `liveSessions.js` | Schedule, chat script, seed chat and question queue |
| `attendance.js` | Policy, historical register, active-room seeds |
| `recordings.js` | Chapters, timed transcript segments, three-question quizzes, playback seeds |
| `doubts.js` | Seed threads with timestamp links |
| `studyRooms.js` | Rooms, participants, room visitors |
| `realtime.js` | Event emitter + injectable class/room channels (clock, RNG, timers) |

`realtime.js` is the only place live events are scheduled. Timers, clock and RNG
are injectable so unit tests prove the 8–15 minute random interval and the
15-second response window without waiting. The HTTP adapter exposes the same
contract over Server-Sent Events; the mock adapter uses the local emitter.

Sample media is original and generated by `scripts/generate_sample_media.py`
(dev-only; Pillow + imageio-ffmpeg). Colours are read from `tokens.css` and
captions from `recordings.js` so nothing drifts. Each 48-second silent edit stands
in for a full class; posters and WebVTT captions ship alongside the MP4s.

## Demo flags

Set in `localStorage` to exercise the realtime channel deterministically:

| Flag | Default | Effect |
|---|---|---|
| `vyuh.mock.attentionMinSeconds` / `…MaxSeconds` | 480 / 900 | Attention-check interval bounds |
| `vyuh.mock.presenceTickSeconds` | 5 | Presence tick cadence |
| `vyuh.mock.chatIntervalSeconds` | 12 | Incoming chat cadence |
| `vyuh.mock.approvalDelaySeconds` | 8 | Simulated faculty approval delay |
| `vyuh.mock.roomIntervalSeconds` | 14 | Study-room presence tick cadence |

## Verification

- Unit: **72** across 11 files (22 new: attendance/transcript/quiz math, realtime
  policy with fake timers, service persistence and schema validation).
- E2e: **44** across 5 specs (4 new learning flows), each axe-clean.
- Architecture guard: **246 files / 245 colour-free**, no boundary or token violations.
- `tsc --noEmit` held at the 97-line baseline; oxlint 0 errors (0 warnings on Phase 6 code).
- Screenshots: `.arena/checks/phase6-*.png`.
