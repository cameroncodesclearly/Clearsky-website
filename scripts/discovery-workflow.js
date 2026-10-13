export const meta = {
  name: 'csc-website-discovery',
  description: 'Read-only discovery for the Clear Sky website: brand system, existing copy/case studies, Drive asset inventory, Notion final-status verification',
  phases: [
    { title: 'Discover', detail: 'brand, copy, and client folder listing in parallel' },
    { title: 'Inventory', detail: 'one agent per client folder lists media files' },
    { title: 'Verify', detail: 'cross-check each folder against the Notion PM database' },
    { title: 'Skeptic', detail: 'second agent tries to refute every final_verified asset' },
  ],
}

const READ_ONLY = 'STRICTLY READ-ONLY: never create, edit, move, share, comment on, or delete anything in Notion or Google Drive. Load deferred MCP tools with ToolSearch (e.g. "select:mcp__Google_Drive__search_files,mcp__Google_Drive__get_file_metadata" or "select:mcp__Notion__notion-search,mcp__Notion__notion-fetch,mcp__Notion__notion-query-data-sources"). The public web (clearskycreations.com, cm.studio) is NOT reachable from this environment; do not try WebFetch.'

const NOTION_MAP = 'To understand the CSC Notion workspace, first try the Skill tool with skill "anthropic-skills:csc-notion"; if unavailable, notion-fetch the page id 3f4a696c-1a53-81af-b512-f3abaae93eeb ("AI Instructions: CSC Notion"), which maps database IDs, the Master Task Board, Campaigns and Clients.'

const BRAND_SCHEMA = {
  type: 'object',
  properties: {
    company_name: { type: 'string' },
    tagline: { type: 'string' },
    positioning: { type: 'string' },
    services: { type: 'array', items: { type: 'string' } },
    colors: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, hex: { type: 'string' }, usage: { type: 'string' } }, required: ['name', 'hex'] } },
    fonts: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, usage: { type: 'string' }, source: { type: 'string' } }, required: ['name'] } },
    logo_assets: { type: 'array', items: { type: 'object', properties: { description: { type: 'string' }, location: { type: 'string' }, drive_file_id: { type: 'string' } }, required: ['description', 'location'] } },
    voice_rules: { type: 'array', items: { type: 'string' } },
    about: { type: 'object', properties: { founder: { type: 'string' }, story: { type: 'string' }, team: { type: 'array', items: { type: 'string' } } } },
    contact: { type: 'object', properties: { email: { type: 'string' }, phone: { type: 'string' }, location: { type: 'string' }, socials: { type: 'array', items: { type: 'string' } }, website: { type: 'string' } } },
    sources: { type: 'array', items: { type: 'string' } },
    gaps: { type: 'array', items: { type: 'string' } },
  },
  required: ['company_name', 'colors', 'fonts', 'logo_assets', 'voice_rules', 'sources', 'gaps'],
}

const COPY_SCHEMA = {
  type: 'object',
  properties: {
    case_studies: { type: 'array', items: { type: 'object', properties: {
      client: { type: 'string' }, title: { type: 'string' }, industry: { type: 'string' }, summary: { type: 'string' },
      challenge: { type: 'string' }, approach: { type: 'string' }, results: { type: 'string' },
      services: { type: 'array', items: { type: 'string' } }, media_refs: { type: 'array', items: { type: 'string' } }, source: { type: 'string' },
    }, required: ['client', 'summary', 'source'] } },
    about_copy: { type: 'string' },
    homepage_copy_snippets: { type: 'array', items: { type: 'string' } },
    testimonials: { type: 'array', items: { type: 'object', properties: { quote: { type: 'string' }, person: { type: 'string' }, company: { type: 'string' }, source: { type: 'string' } }, required: ['quote', 'source'] } },
    blog_material: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, summary: { type: 'string' }, source: { type: 'string' } }, required: ['title', 'source'] } },
    sources: { type: 'array', items: { type: 'string' } },
    gaps: { type: 'array', items: { type: 'string' } },
  },
  required: ['case_studies', 'sources', 'gaps'],
}

const FOLDERS_SCHEMA = {
  type: 'object',
  properties: {
    folders: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, root: { type: 'string', enum: ['final_exports', 'working_projects'] } }, required: ['id', 'name', 'root'] } },
    pages_followed: { type: 'integer' },
  },
  required: ['folders'],
}

const INVENTORY_SCHEMA = {
  type: 'object',
  properties: {
    client: { type: 'string' },
    folder_id: { type: 'string' },
    files: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' }, name: { type: 'string' }, path: { type: 'string' }, mimeType: { type: 'string' },
      sizeBytes: { type: 'string' }, modifiedTime: { type: 'string' },
      kind: { type: 'string', enum: ['video', 'image', 'logo', 'document', 'project_file', 'other'] },
      looks_final: { type: 'boolean' }, why: { type: 'string' },
    }, required: ['id', 'name', 'path', 'mimeType', 'kind', 'looks_final'] } },
    truncated: { type: 'boolean' },
    notes: { type: 'string' },
  },
  required: ['client', 'folder_id', 'files', 'truncated'],
}

const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    client: { type: 'string' },
    notion_client_url: { type: 'string' },
    assets: { type: 'array', items: { type: 'object', properties: {
      file_id: { type: 'string' }, name: { type: 'string' },
      verdict: { type: 'string', enum: ['final_verified', 'not_final', 'unverified'] },
      evidence: { type: 'string' }, notion_url: { type: 'string' },
    }, required: ['file_id', 'name', 'verdict', 'evidence'] } },
    notes: { type: 'string' },
  },
  required: ['client', 'assets'],
}

const SKEPTIC_SCHEMA = {
  type: 'object',
  properties: {
    results: { type: 'array', items: { type: 'object', properties: {
      file_id: { type: 'string' }, refuted: { type: 'boolean' }, reason: { type: 'string' },
    }, required: ['file_id', 'refuted', 'reason'] } },
  },
  required: ['results'],
}

phase('Discover')

const brandP = agent(`Assemble the Clear Sky Creations (CSC) brand system for a new company website. ${READ_ONLY}
Use the Skill tool to load "anthropic-skills:csc-northstar" (visual identity: colors, fonts, logos, document standard), "anthropic-skills:csc-voice" (tone) and "anthropic-skills:csc-playbook" (business context, services, team, clients). Follow any live Notion pages those skills point to. Search Google Drive for logo files (title contains 'logo' or 'Clear Sky') and record their Drive file IDs.
Return exact hex codes and font names as stated by the sources. Record every source you used. List gaps (anything a website needs that you could not find).`, { label: 'brand-system', phase: 'Discover', schema: BRAND_SCHEMA })

const copyP = agent(`Find every piece of existing Clear Sky Creations website copy and case-study material that lives in Notion or Google Drive, since clearskycreations.com itself is unreachable. ${READ_ONLY}
${NOTION_MAP}
Search Notion and Drive for: website copy, "case study", "portfolio", "About", "testimonial", client results/metrics, campaign recaps, Clients database one-pagers, and any blog/article drafts. Search with several different phrasings and also browse the Clients/Campaigns databases for per-client summaries.
For each case study capture client, title, industry, summary, challenge, approach, results (only stated facts, no invented metrics), services, media references, and the source URL. Quote testimonials exactly with their source. Report gaps.`, { label: 'copy-and-case-studies', phase: 'Discover', schema: COPY_SCHEMA })

const listing = await agent(`List every immediate child FOLDER of two Google Drive folders. ${READ_ONLY}
Roots: 1ZMwn44hckVNcZAIUHiWzvxLpaziA01um ("03_Final Exports", root="final_exports") and 1-SXtDy8CiTIs8-ZizwVxtBKKEcQkUSrZ ("01_Working Projects", root="working_projects").
Use mcp__Google_Drive__search_files with query "parentId = '<root>' and mimeType = 'application/vnd.google-apps.folder'", pageSize 100, excludeContentSnippets true, and FOLLOW nextPageToken until a page returns no files. Return all folders with id, exact name, and root. Report pages_followed.`, { label: 'list-client-folders', phase: 'Discover', schema: FOLDERS_SCHEMA })

const folders = (listing && listing.folders) || []
log(`${folders.length} client folders found across Final Exports and Working Projects`)

const results = await pipeline(
  folders,
  (f) => agent(`Inventory media in the Google Drive folder "${f.name}" (id ${f.id}, from ${f.root === 'final_exports' ? '03_Final Exports' : '01_Working Projects'}). ${READ_ONLY}
Recurse through ALL subfolders using search_files with "parentId = '<folderId>'" (pageSize 100, excludeContentSnippets true), following nextPageToken on every page. Record each file's id, name, path (subfolder chain), mimeType, size (call get_file_metadata when size is missing and the file is a video/image), modifiedTime, and kind (video/image/logo/document/project_file/other).
looks_final: true only when naming or folder structure signals a delivered export (e.g. "Final", "Export", "Deliverable", "v-final", in a Final/Exports subfolder, MP4/MOV renders) and false for drafts, raw footage, proxies, WIP, project files. Explain why. If the folder holds more than 300 files, prioritise videos and images and set truncated=true with a note of what was skipped.`,
    { label: `inventory:${f.name}`, phase: 'Inventory', schema: INVENTORY_SCHEMA }),
  (inv, f) => {
    if (!inv) return null
    const candidates = inv.files.filter(x => x.kind === 'video' || x.kind === 'image' || x.kind === 'logo')
    if (!candidates.length) return { inventory: inv, verify: { client: f.name, assets: [], notes: 'no media files' }, folder: f }
    return agent(`Verify which media assets for client folder "${f.name}" are FINAL (approved/delivered), by cross-checking the CSC project-management database in Notion. ${READ_ONLY}
${NOTION_MAP}
Find the matching client, its campaigns, and the Master Task Board tasks/deliverables that correspond to these files (match on client, deliverable names, dates, and any Drive links in the tasks). A file is "final_verified" ONLY when a Notion task/campaign/deliverable for it shows a completed/approved/delivered/published status AND you can tie that record to this specific file or its deliverable; cite the Notion URL and status in evidence. Use "not_final" when Notion shows it in progress, back with notes, or rejected. Otherwise "unverified". Do not guess.
Candidate files (JSON): ${JSON.stringify(candidates.slice(0, 120).map(x => ({ id: x.id, name: x.name, path: x.path, modifiedTime: x.modifiedTime, looks_final: x.looks_final })))}${candidates.length > 120 ? `\n(${candidates.length - 120} further candidates omitted; mention that in notes)` : ''}`,
      { label: `verify:${f.name}`, phase: 'Verify', schema: VERIFY_SCHEMA }).then(v => ({ inventory: inv, verify: v, folder: f }))
  },
  (r, f) => {
    if (!r || !r.verify) return r
    const claimed = r.verify.assets.filter(a => a.verdict === 'final_verified')
    if (!claimed.length) return r
    return agent(`Adversarially check "final_verified" claims for client folder "${f.name}". ${READ_ONLY}
${NOTION_MAP}
For each claim, re-open the cited Notion record and try to REFUTE it: is the status really complete/approved/delivered? Does the record actually correspond to this file (not just the same client)? Was there a later revision that superseded this file? If you cannot confirm, set refuted=true.
Claims (JSON): ${JSON.stringify(claimed.map(a => ({ file_id: a.file_id, name: a.name, evidence: a.evidence, notion_url: a.notion_url })))}`,
      { label: `skeptic:${f.name}`, phase: 'Skeptic', schema: SKEPTIC_SCHEMA }).then(s => {
        const refuted = new Map(((s && s.results) || []).filter(x => x.refuted).map(x => [x.file_id, x.reason]))
        r.verify.assets = r.verify.assets.map(a => a.verdict === 'final_verified' && refuted.has(a.file_id)
          ? { ...a, verdict: 'unverified', evidence: a.evidence + ' | SKEPTIC REFUTED: ' + refuted.get(a.file_id) } : a)
        return r
      })
  },
)

const brand = await brandP
const copy = await copyP
const done = results.filter(Boolean)
log(`Inventoried ${done.length}/${folders.length} folders`)
return { brand, copy, folders, clients: done }
