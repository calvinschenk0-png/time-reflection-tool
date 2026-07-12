# Time Reflection — Design System

Direction: **Bold Signal / Grey Cards** (Option C2)

---

## Colours

| Token | Hex | Use |
|---|---|---|
| Page | `#ffffff` | Page background |
| Card | `#f4f4f5` | All card backgrounds |
| Pill | `#e9e9eb` | Day pills, inactive chips |
| Border | `#e4e4e7` | Dividers, input borders |
| Text | `#111111` | Primary text |
| Muted | `#999999` | Labels, secondary text |
| Accent | `#2563eb` | Ring fill, today pill, primary buttons |
| Success | `#16a34a` | Logged days, complete blocks |
| Warning | `#d97706` | Unlogged days, gap bands, draft blocks |
| Danger | `#dc2626` | Errors |

## Typography

- **Display / headings / numbers:** Space Grotesk — used for the big hour number, card headings, nav logo
- **UI / body:** Inter — used for labels, descriptions, form fields, everything else

## Spacing & Radius

- Card padding: `24px`
- Card border-radius: `20px`
- Pill border-radius: `12px`
- Button border-radius: `10px`
- Gap between cards: `12px`
- Max content width: `560px` centred

## Signature elements

- **Hero number:** logged hours at ~72px Space Grotesk bold, ring is secondary
- **Week strip:** compact day pills (Fr–Th), green checkmark = logged, blue = today, dash = unlogged past
- **Stacked bar:** thin 8px bar showing time split across engagements by colour
- **Category colours:** user-chosen per category, consistent across all charts

## Components (in `/components/ui/`)

- `Card` — grey card wrapper
- `SectionHeading` — 13px Space Grotesk 600
- `PrimaryButton` — black bg, white text, radius-btn
- `SecondaryButton` — card bg, black text, border
- `Input` — standard text input
- `Badge` — small coloured pill (e.g. count badge)
