# 0002: X videos are embedded, never seeked

X (Twitter) has no public embed API that lets a parent page programmatically seek or play a video inside a tweet — unlike YouTube's postMessage-based IFrame API. The original spec promised interactive timestamps on X.

We chose embed-and-link-out: an X Study shows the tweet as an embed and offers "Open on X". Timestamps in X studies render as inert labels; the seek-and-play behaviour exists only on YouTube. Downloading X videos into R2 to make them seekable was the alternative but was rejected: it adds an ingest pipeline, storage, and rights/ToS concerns around re-hosting Twitter content. That remains an option if a Study ever needs it.