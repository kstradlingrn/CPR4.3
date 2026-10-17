CPR Camera Test — Build 31, October 15, 2026 (Pacific)

Experimental manikin-testing tool from Hands to Hearts.

Host these files together with index.html at the root over HTTPS; open in Safari.
Start camera test. Optional: choose Record camera + readings to save original
camera video and a synchronized JSON readings log. Save/share BOTH files before
closing. This recorder does not capture microphone audio or upload video.
Screen Recording can separately capture the app screen and spoken test cues
when the iPhone microphone is enabled.

Keep the phone stationary. Use a manikin and the practical placement being
evaluated. A blank reading means the signal is unavailable; it does not prove
compressions stopped. A new message distinguishes no trackable movement from
gathering cycles.

Changes:
- Textured regions retain usable image quality at zero-speed reversals.
- Brief poor-quality intervals no longer erase accumulated cycle history.
  Longer interruptions still reset it; missing-camera gaps are rejected.
- Whole-view movement rejection requires coherent displacement at both edges
  and most central regions; edge activity alone is insufficient.
- Version 2 logs include build number and region diagnostics when available.
- Stale camera frames clear the rate, focus marker and pace display.

The 110/min beat is not used as tracker input. Camera capture requests 1280x720
at 30fps; actual device settings are logged. Recordings stop after three minutes
and remain in page memory until saved. MP4 preferred; WebM fallback. Saved
camera video is unmirrored; the preview is mirrored. Backgrounding stops
recording; save before leaving because iOS may terminate the page.

This is heuristic tracking with existing generic pose/hand models, not a newly
trained CPR model. Rate, fatigue, depth and recoil accuracy are unvalidated.
Smaller movement does not measure compression depth. See VALIDATION.md.
This is a separate test tool; no main LifeSaver app deployment was performed.

Build 32: Requires the front (selfie) camera. Does not fall back to the rear camera.

Build 33: Selfie camera by default. Switch camera selects selfie/rear before starting or restarts the live camera. Stop recording before switching; save the recording before recording again.

Build 34: Adds two overlapping central tracking regions to cover movement crossing the old left/right boundary. Camera-motion rejection now scales with region count. Preview stays in place as status text changes. Requires iPhone/manikin comparison; accuracy not established.

Build 35: Connects the existing sustained-slowdown coach to recorder readings. Shows and optionally speaks switch-out advice after 8 seconds of valid below-target readings, with a 45-second reminder cooldown. Lost tracking clears slowdown evidence; unknown tracking does not mean stopped CPR. Voice coach checkbox defaults on.
