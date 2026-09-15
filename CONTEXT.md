# CuratorStudio

A personal video knowledge studio and digital library. The single Curator ingests YouTube, X, and other videos, captures interactive timestamps, writes markdown insights, organizes them in a searchable library, and shares public studies via clean URLs.

## Language

**Curator**:
The single human who owns and operates the studio. The only authenticated user; everything else is read-only to the public.
_Avoid_: Admin, user, viewer

**Study**:
The core unit of the library: one video (YouTube, X, or other) plus its metadata, markdown commentary, and embedded Timestamps.
_Avoid_: Note, capture, bookmark, entry, post

**Timestamp**:
A `[mm:ss]` (or `[hh:mm:ss]`) marker embedded in a Study's content pointing into the video. On YouTube it is interactive — clicking seeks and plays. On X/other platforms it renders as an inert label.
_Avoid_: Moment, timecode, anchor

**Workspace**:
The split editor at `/study/[id]` where the Curator watches the video on the left and writes markdown on the right, capturing Timestamps into the cursor position.
_Avoid_: Editor, studio, page

**Capture**:
The action of reading the player's current time and inserting a Timestamp into the content at the caret.
_Avoid_: Add time, bookmark

**Publish / Unpublish**:
Flipping a Study's `is_public` flag. Publishing exposes it at `/share/[slug]`; unpublishing makes that URL 404.
_Avoid_: Share, go live, release

**Slug**:
The semantic kebab-case identifier derived from a Study's title (deduped with `-2`, `-3`) that forms the clean public URL. Privacy comes from the `is_public` gate, never from the Slug.
_Avoid_: Short id, code, path

**Platform**:
The source of a Study's video, one of `youtube`, `x`, or `other`. Determines what the player can do: YouTube can seek timestamps, X/other cannot.

## Invariants

- Privacy is enforced by the `is_public` flag; the Slug is not a secret.
- Timestamps only seek on YouTube; on other platforms they are decorative.