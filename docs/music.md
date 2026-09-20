# A Little Landfall

An original, understated piano miniature for **The Unreasonable Archipelago**.
The composition, arrangement and synthetic piano instrument are authored in
`src/ui/music.ts` and `src/ui/music.worker.ts`. No external score, performance recording, sample library, or
third-party music service is used. This source and its rendered output are
project-created assets, with the composition and synthesizer source included.

The theme is sixteen bars in D at 68 beats per minute. Displaced eighth notes,
an occasional borrowed G-minor chord, and four alternating arrangements keep
it warm and slightly uncertain. The complete arrangement cycle lasts about
four minutes. Calm water is sparse; a storm adds an unsettled left hand; a
disconnected bell answers in a distant upper register; the finale brings the
hands together. All variations share the same harmonic clock. Mood changes
enter at the next bar with a 1.2-second fade, preserving the phrase and tails.

The instrument generates and caches short mono notes with two detuned strings,
inharmonic partials, faster upper-harmonic decay and a quiet hammer transient.
Stereo keyboard placement and a small room impulse supply space. This is a
stylized synthesized piano, not a sampled acoustic grand. Playback schedules
cached buffers, avoiding continuously running oscillator banks. Synthesis runs
in a dedicated worker and preloads upcoming phrases, keeping it off the world
rendering thread. Browsers without worker support use the same cached instrument
on the main thread.

## Integration

- Call `updateMusic({ enabled, volume, mood })` from the settings/state effect.
  Volume is 0–1; mood is `calm`, `storm`, `disconnected`, or `finale`.
- Call `unlockMusic()` directly inside a real pointer/keyboard handler. The
  module creates no AudioContext before this gesture.
- Call `duckMusic()` before a result or bell fanfare. It lowers music briefly
  without changing the saved music volume.
- Call `stopMusic()` on final app cleanup. It stops sources, removes the page
  visibility listener, closes the context and clears caches and timers.
- Hidden pages fade out, stop scheduling and suspend their audio context.
  Returning resumes at the next phrase without replaying missed bars.
- Store music volume independently from effects volume. Muting music must pass
  `enabled: false` while preserving the chosen volume for later unmuting.

## Listening review

`node scripts/compose-piano.mjs` creates a 64-second WAV in the ignored
`output/playwright` folder. It demonstrates calm, storm, disconnected and
finale in that order. Optional arguments select duration and one mood, for
example `node scripts/compose-piano.mjs 240 calm` for a repetition review.
The preview uses the exact same note generation and arrangement as the game,
with a light portable room effect. Browser playback adds stereo placement and
its room convolver. The script reports peak and RMS levels for clipping checks.

An isolated lifecycle check is in `scripts/compose-piano-browser.js`. With a
development server running, open `scripts/compose-piano-harness.html` in a
separate Playwright CLI session and run that function file. It checks gesture
startup, all four moods, ducking, mute and resume, rapid toggles, visibility
event handling, and context cleanup. It does not measure the complete game's
frame rate; that requires the integrated browser playthrough.

Authorship record: original composition and synthesis created for this project
with Codex assistance, September 2026. No outside musical work was provided as
a composition or style reference.
