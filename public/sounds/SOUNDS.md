# Kotoka Ambient Sound Library

Place all audio files in `public/sounds/`. Accepted formats: **MP3** (preferred) or OGG.
Recommended bitrate: 128 kbps. Loop-points should be seamless (no click at end).

| ID  | Filename              | Name             | Duration | Description                                                                 |
|-----|-----------------------|------------------|----------|-----------------------------------------------------------------------------|
| S01 | S01_office_hum.mp3    | Office Hum       | 3–5 min  | Low-level HVAC/air-conditioning hum of a quiet open-plan office. No voices. |
| S02 | S02_keyboard.mp3      | Keyboard Clicks  | 2–3 min  | Mechanical keyboard typing with occasional mouse clicks. Dense but rhythmic. |
| S03 | S03_cafe_chatter.mp3  | Café Chatter     | 3–5 min  | Espresso machine, murmured conversation, light background music. Warm.      |
| S04 | S04_city_traffic.mp3  | City Traffic     | 3–5 min  | Urban street: cars passing, distant horns, no extreme peaks. Moderate level.|
| S05 | S05_bts_station.mp3   | BTS Station      | 2–3 min  | Bangkok Skytrain platform: announcement chimes, crowd murmur, train arrival.|
| S06 | S06_rain_window.mp3   | Rain on Window   | 5–10 min | Steady rain hitting glass. No thunder. Ideal for looping; seamless fade.    |
| S07 | S07_park_birds.mp3    | Park Birds       | 3–5 min  | Open park: birdsong, light breeze in leaves, distant children playing.      |
| S08 | S08_ocean_waves.mp3   | Ocean Waves      | 5–10 min | Slow wave rhythm on a sandy beach. No music. Deep and calm.                 |
| S09 | S09_market.mp3        | Market Bustle    | 3–5 min  | Thai fresh market: vendors calling, cart wheels, sizzling, upbeat energy.   |
| S10 | S10_airport.mp3       | Airport Terminal | 3–5 min  | Gate area: PA announcements (indistinct), rolling luggage, ambient hum.     |
| S11 | S11_meeting_room.mp3  | Meeting Room     | 2–3 min  | Small conference room: projector fan, pen taps, muffled distant voices.     |
| S12 | S12_night_crickets.mp3| Night Crickets   | 5–10 min | Tropical night: cricket chorus, occasional frog, gentle wind. Very calming. |

## Notes for audio producers

- All files must be **stereo MP3, 44.1 kHz, 128 kbps** or higher.
- Preferred duration range is listed above. Longer is better — the player loops, but a longer source sounds more natural.
- Normalise peaks to **−1 dBFS**. RMS loudness target: **−18 to −14 LUFS** (ambient, not foreground).
- Loop point: the last 2 seconds should cross-fade into silence so the JS audio element can loop without an audible click.
- No copyright music or identifiable speech. Royalty-free field recordings or synthesised soundscapes only.
- File naming must match the `Filename` column exactly (lowercase, underscores).
