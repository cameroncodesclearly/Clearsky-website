# Drive inventory and Notion final-status checks

Read-only run of `scripts/discovery-workflow.js` on 2026-10-14 (122 agents). Each Drive client folder in
"03_Final Exports" and "01_Working Projects" was inventoried, matched against the Notion PM database,
and every `final_verified` claim was re-checked by a second agent that tried to refute it.

Only assets marked **final_verified** below may be used on the site. All of them are videos between 8 MB
and several GB, too large to move through the Drive connector, so the site uses the published copies on
Vimeo or Instagram instead. Full per-file results: `discovery-results.json`.

| Root | Client folder | Files | Videos | Final verified | Not final | Truncated |
|---|---|---|---|---|---|---|
| Final Exports | 1736 Family Crisis Center | 280 | 13 | 0 | 0 |  |
| Final Exports | *Your Behavioral Health | 38 | 25 | 3 | 0 | yes |
| Final Exports | Clear Sky | 6 | 6 | 0 | 0 |  |
| Final Exports | Good Stuff Restaurants | 216 | 125 | 0 | 0 |  |
| Final Exports | *Sona Creative Group | 123 | 122 | 0 | 0 |  |
| Final Exports | Calvary Chapel | 1 | 1 | 1 | 0 |  |
| Final Exports | Rolling Hills Preparatory School | 124 | 11 | 0 | 0 |  |
| Final Exports | YourSLPsister | 0 | 0 | 0 | 0 |  |
| Final Exports | Representative Materials Company | 0 | 0 | 0 | 0 |  |
| Final Exports | DrinkWaay | 4 | 4 | 0 | 0 |  |
| Final Exports | Downey Nissan | 140 | 139 | 100 | 0 |  |
| Final Exports | WWFI | 4 | 4 | 0 | 0 |  |
| Final Exports | Billy K | 1 | 1 | 0 | 0 |  |
| Final Exports | d'Arnaud Athletics | 85 | 85 | 0 | 0 |  |
| Final Exports | Endera | 61 | 10 | 0 | 0 |  |
| Final Exports | Dr Borsca | 149 | 0 | 0 | 0 |  |
| Final Exports | Vaya | 51 | 35 | 0 | 0 |  |
| Final Exports | Moonracer | 50 | 46 | 0 | 0 |  |
| Final Exports | Coachly | 15 | 15 | 0 | 0 |  |
| Final Exports | Montage Spa | 24 | 24 | 10 | 0 |  |
| Final Exports | Estate Properties | 0 | 0 | 0 | 0 |  |
| Final Exports | EFI | 0 | 0 | 0 | 0 |  |
| Final Exports | King Harbor Association | 0 | 0 | 0 | 0 |  |
| Final Exports | Age With Vitality | 20 | 20 | 17 | 0 |  |
| Final Exports | NAFA | 0 | 0 | 0 | 0 |  |
| Final Exports | Got Carma | 0 | 0 | 0 | 0 |  |
| Final Exports | Palos Verdes Chamber | 10 | 10 | 7 | 1 |  |
| Working Projects | Downey Nissan | 143 | 106 | 40 | 35 | yes |
| Working Projects | Representative Materials Company | 75 | 40 | 1 | 0 | yes |
| Working Projects | Clear Sky | 208 | 127 | 0 | 0 | yes |
| Working Projects | *Sona Creative Group | 143 | 139 | 3 | 8 | yes |
| Working Projects | Calvary Chapel | 67 | 56 | 0 | 0 | yes |
| Working Projects | 1736 Family Crisis Center | 111 | 60 | 0 | 0 | yes |
| Working Projects | Chase d’Arnaud | 36 | 19 | 1 | 1 |  |
| Working Projects | Good Stuff Restaurants | 199 | 112 | 18 | 52 | yes |
| Working Projects | NAFA | 27 | 16 | 1 | 0 | yes |
| Working Projects | *Your Behavioral Health | 27 | 19 | 0 | 0 | yes |
| Working Projects | Palos Verdes Chamber | 82 | 62 | 14 | 24 | yes |
| Working Projects | Age With Vitality | 209 | 0 | 0 | 0 | yes |
| Working Projects | LPI Products | 139 | 116 | 0 | 16 | yes |
| Working Projects | Got Carma | 48 | 0 | 0 | 0 |  |
| Working Projects | Drink Waay | 63 | 31 | 0 | 0 |  |
| Working Projects | SLP Sister OLD | 112 | 109 | 0 | 0 |  |
| Working Projects | WWFI | 0 | 0 | 0 | 0 |  |
| Working Projects | Endera Motors | 109 | 59 | 0 | 0 | yes |
| Working Projects | Billy K | 1 | 1 | 0 | 0 |  |
| Working Projects | 2042 Media | 8 | 1 | 0 | 0 |  |
| Working Projects | Dr Borcsa | 207 | 51 | 0 | 0 | yes |
| Working Projects | dArnaud Athletics | 63 | 50 | 0 | 0 | yes |
| Working Projects | Coachly | 59 | 54 | 0 | 0 | yes |
| Working Projects | Montage Spa | 0 | 0 | 0 | 0 |  |
| Working Projects | Grant Gamble | 23 | 2 | 0 | 0 | yes |
| Working Projects | Active Client List | 0 | 0 | 0 | 0 |  |
| Working Projects | The Henry | 73 | 25 | 0 | 0 | yes |
| Working Projects | SLB | 8 | 5 | 0 | 0 |  |
| Working Projects | Hugel | 49 | 0 | 0 | 0 |  |
| Working Projects | EFI | 48 | 0 | 0 | 0 |  |
| Working Projects | Estate Properties | 26 | 16 | 1 | 5 | yes |
| Working Projects | King Harbor Association | 49 | 0 | 0 | 0 |  |
| Working Projects | Rolling hills Preparatory School | 215 | 174 | 7 | 0 | yes |

**Total final_verified after the skeptic pass: 224.**

## Case-study material found in Notion and Drive

- **Good Stuff Restaurants**: Reviving a 45+ year South Bay restaurant brand on social. Source: Notion Companies page https://app.notion.com/p/313a696c1a5380148accf4d7b5f22398 ; Notion Wins DB collection://313a696c-1a53-80fa-b862-000b05068aa0 ; Social Report Sep 2026 https://app.notion.com/p/3ec
- **Downey Nissan**: Staff-driven humor content and bilingual TV spots for a car dealership. Source: Notion Companies page https://app.notion.com/p/318a696c1a538023b8bee5bbfc572fcc ; Social Report Sep 2026 https://app.notion.com/p/3eca696c1a5381248c62fc7ddb4e6ff6 ; Notion Wins DB ; NPS https://app.no
- **Age With Vitality**: Pilates studio social content that drives engagement. Source: Notion Companies page https://app.notion.com/p/31ea696c1a538003a788e40f7295f48b ; Wins https://app.notion.com/3a3a696c1a5381b6ad83f6325a32b725 ; NPS https://app.notion.com/3a3a696c1a5381359c51ecaa546a
- **Endera Motors**: Product launches and customer testimonials for an electric shuttle bus maker. Source: Notion Companies page https://app.notion.com/p/31ea696c1a53802a8abcf47f5f29c793 ; NPS https://app.notion.com/3bda696c1a538112bdaaeb45df17d888 ; Drive 'CSC Web' ; Drive CCP - Overview.pdf https://drive
- **SeamsUp**: Comedy commercial campaign for a virtual baseball coaching app. Source: Drive 'CSC Web' https://docs.google.com/document/d/10FdRyhuvqYeWFIIr7tHt3ddrXWFtIFaFRYV-T0ihNow ; Drive SeamsUp FINAL SCRIPTS ; Drive SeamsUp INV 0745.pdf https://drive.google.com/file/d/1JXpKv0fncPgQ
- **D'Arnaud Athletics (Chase and Travis d'Arnaud)**: Launching a baseball training facility with paid and organic content. Source: Notion 'The d'Arnaud Solution' https://app.notion.com/p/1ffa696c1a5381a0bbc9c15b189ca2f4 ; Drive CCP - Overview.pdf https://drive.google.com/file/d/1-uC-8NbGy6PS29OngGG1RPooq4S09Gw_/view ; Drive Clock
- **Rolling Hills Preparatory School**: School community social content. Source: Notion Companies (Rolling Hills) https://app.notion.com/p/31ea696c1a53801d9fd5d9fdb03eafae ; Wins DB ; NPS https://app.notion.com/321a696c1a5381b5a808c87816695c30
- **1736 Family Crisis Center**: Awareness and donor campaign for a nonprofit. Source: Drive '1736 Spring Marketing Plan, so far' https://docs.google.com/document/d/1-UBs8qGN8UXGEp-qMnVdK75zhF4gCOPerEMIkukLhU8 ; Drive SOW https://docs.google.com/document/d/1wnls76dyfsxeqnERMwC8t7JQelmVV
- **Evolus (via Sona Creative Group)**: National content creation for a med aesthetics brand. Source: Notion Wins DB entries https://app.notion.com/345a696c1a538028bcabd3cb7a94f173 , https://app.notion.com/p/322a696c1a53801d98a2f04676129eb3 ; Drive 'Clear Sky Creations Clients'
- **Representative Materials Company (RMC)**: Hero video for a conduit supplier's sales force. Source: Drive 'Clear Sky Creations Clients' ; Drive 'RMC Estimates' https://docs.google.com/document/d/1oIASSTWxo4ITWSZneksw95RG8xSmK7hbJKFCd4Zyj_s

## Used on the site

- Downey Nissan case study: copy and figures from the Notion Companies page, Wins database, and Sep 2026 social report; media are the published Instagram reels cited there.
- Good Stuff and Age With Vitality results updated from the Notion Wins database and Sep 2026 social report.
- NPS survey comments were not published as testimonials (client permission needed).

## Candidates for more case studies

Palos Verdes Chamber (21 verified finals), Montage Spa (10), Rolling Hills Preparatory School (7, plus Wins data), and SeamsUp, 1736 Family Crisis Center, RMC (copy found, no results documented). Evolus work came through Sona Creative Group and may be white-label; get permission first.
