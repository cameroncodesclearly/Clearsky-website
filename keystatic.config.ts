import { config, collection, singleton, fields } from '@keystatic/core';

// Local mode edits files on disk during `npm run dev`. The deployed site
// commits through GitHub once the Keystatic GitHub App is set up (README).
const storage = import.meta.env.PROD
  ? ({ kind: 'github', repo: 'cameroncodesclearly/clearsky-website' } as const)
  : ({ kind: 'local' } as const);

const SERVICES = [
  { label: 'Social Media Management', value: 'social-media' },
  { label: 'Video Production', value: 'video-production' },
  { label: 'Content Strategy', value: 'content-strategy' },
  { label: 'Post-Production', value: 'post-production' },
  { label: 'Photography', value: 'photography' },
  { label: 'Paid Social', value: 'paid-social' },
  { label: 'Branding', value: 'branding' },
  { label: 'Web', value: 'web' },
] as const;

// Each case study and service page can take its own page colour, the way
// project pages pick up a project colour.
const THEMES = [
  { label: 'Paper (off-white)', value: 'paper' },
  { label: 'Dark blue', value: 'blue' },
  { label: 'Light blue', value: 'sky' },
  { label: 'Light yellow', value: 'butter' },
  { label: 'Near-black', value: 'ink' },
] as const;

// A video hosted on Vimeo or YouTube, with a still for cards and slow connections.
const video = (label: string, directory: string) =>
  fields.object(
    {
      url: fields.url({ label: 'Video link', description: 'Vimeo or YouTube link. Private Vimeo links keep their hash, e.g. vimeo.com/123/abc.' }),
      poster: fields.image({
        label: 'Poster still',
        directory,
        publicPath: directory.replace('src/', '../../'),
      }),
      title: fields.text({ label: 'Title' }),
      vertical: fields.checkbox({ label: 'Vertical (9:16)', defaultValue: false }),
    },
    { label },
  );

export default config({
  storage,
  ui: {
    brand: { name: 'Clear Sky Creations' },
    navigation: {
      Work: ['caseStudies'],
      Services: ['services'],
      Journal: ['posts'],
      Site: ['settings', 'home', 'about'],
    },
  },
  collections: {
    caseStudies: collection({
      label: 'Case Studies',
      slugField: 'title',
      path: 'src/content/case-studies/*',
      entryLayout: 'content',
      format: { contentField: 'body' },
      columns: ['client', 'year'],
      schema: {
        title: fields.slug({ name: { label: 'Project title', description: 'e.g. Something for Everyone' } }),
        client: fields.text({ label: 'Client', validation: { isRequired: true } }),
        category: fields.text({ label: 'Category', description: 'Short label shown under the client on cards, e.g. Social Media Management.' }),
        clientType: fields.select({
          label: 'Client stage',
          options: [
            { label: 'Solo Entrepreneur', value: 'Solo Entrepreneur' },
            { label: 'Startup', value: 'Startup' },
            { label: 'Business', value: 'Business' },
            { label: 'Enterprise', value: 'Enterprise' },
          ],
          defaultValue: 'Business',
        }),
        industry: fields.text({ label: 'Industry' }),
        location: fields.text({ label: 'Location' }),
        year: fields.integer({ label: 'Year', validation: { isRequired: true } }),
        completed: fields.text({ label: 'Status or date', description: 'e.g. Ongoing, or August 2025.' }),
        services: fields.multiselect({ label: 'Services', options: SERVICES }),
        summary: fields.text({
          label: 'One-line summary',
          description: 'Shown on cards and in search results.',
          multiline: true,
          validation: { isRequired: true, length: { max: 220 } },
        }),
        intro: fields.text({ label: 'Big intro statement', description: 'One or two sentences set large at the top of the story.', multiline: true }),
        theme: fields.select({ label: 'Page colour', options: THEMES, defaultValue: 'paper' }),
        cover: fields.image({
          label: 'Cover image',
          description: 'Poster frame for cards and the hero.',
          directory: 'src/assets/case-studies',
          publicPath: '../../assets/case-studies/',
          validation: { isRequired: true },
        }),
        coverVertical: fields.checkbox({ label: 'Show as a vertical card in the homepage feed', defaultValue: false }),
        coverVideo: fields.file({
          label: 'Cover loop (MP4)',
          description: 'Optional short muted loop under 8 MB. Leave empty to use the hero video or the cover image.',
          directory: 'public/videos/case-studies',
          publicPath: '/videos/case-studies/',
        }),
        videoUrl: fields.url({
          label: 'Hero video link',
          description: 'Vimeo or YouTube link for the main piece. Plays muted in cards and with sound on the case study.',
        }),
        videos: fields.array(video('Video', 'src/assets/video-posters'), {
          label: 'More videos',
          itemLabel: (p) => p.fields.title.value || p.fields.url.value || 'Video',
        }),
        gallery: fields.array(
          fields.object({
            image: fields.image({
              label: 'Image',
              directory: 'src/assets/case-studies',
              publicPath: '../../assets/case-studies/',
              validation: { isRequired: true },
            }),
            alt: fields.text({ label: 'Alt text', validation: { isRequired: true } }),
          }),
          { label: 'Gallery', itemLabel: (p) => p.fields.alt.value || 'Image' },
        ),
        results: fields.array(
          fields.object({
            value: fields.text({ label: 'Value', description: 'e.g. 100+' }),
            label: fields.text({ label: 'Label', description: 'e.g. employees today' }),
          }),
          { label: 'Results', itemLabel: (p) => `${p.fields.value.value} ${p.fields.label.value}` },
        ),
        testimonial: fields.object(
          {
            quote: fields.text({ label: 'Quote', multiline: true }),
            person: fields.text({ label: 'Name' }),
            role: fields.text({ label: 'Role / company' }),
          },
          { label: 'Testimonial' },
        ),
        featured: fields.checkbox({ label: 'Feature on homepage', defaultValue: false }),
        order: fields.integer({ label: 'Sort order', description: 'Lower numbers show first.', defaultValue: 100 }),
        draft: fields.checkbox({ label: 'Draft (hidden from site)', defaultValue: false }),
        body: fields.markdoc({
          label: 'Story',
          options: {
            image: { directory: 'src/assets/case-studies', publicPath: '../../assets/case-studies/' },
          },
        }),
      },
    }),
    services: collection({
      label: 'Services',
      slugField: 'title',
      path: 'src/content/services/*',
      entryLayout: 'content',
      format: { contentField: 'body' },
      columns: ['order'],
      schema: {
        title: fields.slug({ name: { label: 'Service name' } }),
        tagline: fields.text({ label: 'Hero caption', description: 'Small caps line under the title.' }),
        intro: fields.text({ label: 'Intro sentence', multiline: true }),
        statement: fields.text({ label: 'Big statement', description: 'Set in display caps mid-page.', multiline: true }),
        capabilities: fields.array(fields.text({ label: 'Capability' }), { label: 'Capabilities', itemLabel: (p) => p.value }),
        theme: fields.select({ label: 'Page colour', options: THEMES, defaultValue: 'paper' }),
        heroVideo: fields.url({ label: 'Hero video link', description: 'Vimeo or YouTube. Plays muted behind the title.' }),
        heroImage: fields.image({
          label: 'Hero still',
          directory: 'src/assets/services',
          publicPath: '../../assets/services/',
        }),
        media: fields.array(video('Video', 'src/assets/video-posters'), {
          label: 'Video strip',
          itemLabel: (p) => p.fields.title.value || 'Video',
        }),
        featuredWork: fields.relationship({ label: 'Featured case study', collection: 'caseStudies' }),
        order: fields.integer({ label: 'Sort order', defaultValue: 100 }),
        body: fields.markdoc({ label: 'Extra details (optional)' }),
      },
    }),
    posts: collection({
      label: 'Journal',
      slugField: 'title',
      path: 'src/content/posts/*',
      entryLayout: 'content',
      format: { contentField: 'body' },
      columns: ['publishedDate'],
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        excerpt: fields.text({ label: 'Excerpt', multiline: true, validation: { isRequired: true, length: { max: 240 } } }),
        publishedDate: fields.date({ label: 'Published', validation: { isRequired: true } }),
        author: fields.text({ label: 'Author', defaultValue: 'Clear Sky Creations' }),
        cover: fields.image({
          label: 'Cover image',
          directory: 'src/assets/posts',
          publicPath: '../../assets/posts/',
        }),
        tags: fields.array(fields.text({ label: 'Tag' }), { label: 'Tags', itemLabel: (p) => p.value }),
        draft: fields.checkbox({ label: 'Draft (hidden from site)', defaultValue: false }),
        body: fields.markdoc({
          label: 'Article',
          options: { image: { directory: 'src/assets/posts', publicPath: '../../assets/posts/' } },
        }),
      },
    }),
  },
  singletons: {
    settings: singleton({
      label: 'Site settings',
      path: 'src/content/settings/site',
      format: { data: 'json' },
      schema: {
        email: fields.text({ label: 'Contact email' }),
        phone: fields.text({ label: 'Phone' }),
        location: fields.text({ label: 'Location' }),
        bookingUrl: fields.url({ label: 'Booking link', description: 'Calendly or similar.' }),
        intakeFormId: fields.text({ label: 'Fillout form ID', description: 'The intake form on the Contact page.' }),
        socials: fields.array(
          fields.object({ label: fields.text({ label: 'Network' }), url: fields.url({ label: 'URL' }) }),
          { label: 'Social links', itemLabel: (p) => p.fields.label.value },
        ),
      },
    }),
    home: singleton({
      label: 'Homepage',
      path: 'src/content/settings/home',
      format: { data: 'json' },
      schema: {
        reelUrl: fields.url({ label: 'Reel video link', description: 'First slide of the hero. Vimeo or YouTube.' }),
        reelTitle: fields.text({ label: 'Reel title' }),
        proofValue: fields.text({ label: 'Proof number', description: 'Big number in the callout under the hero.' }),
        proofLabel: fields.text({ label: 'Proof label' }),
        proofCaption: fields.text({ label: 'Proof caption' }),
        breezeHeading: fields.text({ label: 'Breeze heading', defaultValue: 'We make content creation a breeze' }),
        breezeHint: fields.text({ label: 'Breeze cursor label', defaultValue: 'Catch a breeze!' }),
        breezeNotes: fields.array(fields.text({ label: 'Note' }), {
          label: 'Breeze notes',
          description: 'Short lines that float along the wind when someone clicks the drawing.',
          itemLabel: (p) => p.value,
        }),
        manifesto: fields.array(fields.text({ label: 'Line' }), { label: 'Manifesto lines', itemLabel: (p) => p.value }),
        clients: fields.array(
          fields.object({
            name: fields.text({ label: 'Client name' }),
            logo: fields.image({ label: 'Logo', directory: 'src/assets/clients', publicPath: '../../assets/clients/' }),
          }),
          { label: 'Client logos', itemLabel: (p) => p.fields.name.value },
        ),
      },
    }),
    about: singleton({
      label: 'About page',
      path: 'src/content/settings/about',
      format: { data: 'json' },
      schema: {
        heading: fields.text({ label: 'Opening statement' }),
        reelUrl: fields.url({ label: 'Reel video link' }),
        intro: fields.text({ label: 'Intro', multiline: true }),
        story: fields.array(fields.text({ label: 'Paragraph', multiline: true }), { label: 'Our story', itemLabel: (p) => p.value.slice(0, 60) }),
        mission: fields.text({ label: 'Mission', multiline: true }),
        bigLine: fields.text({ label: 'Big line', description: 'Huge caps line with service tags scattered over it.' }),
        values: fields.array(
          fields.object({ title: fields.text({ label: 'Title' }), body: fields.text({ label: 'Text', multiline: true }) }),
          { label: 'Values', itemLabel: (p) => p.fields.title.value },
        ),
        photos: fields.array(
          fields.object({
            image: fields.image({ label: 'Photo', directory: 'src/assets/about', publicPath: '../../assets/about/' }),
            alt: fields.text({ label: 'Alt text' }),
          }),
          { label: 'Behind the scenes photos', itemLabel: (p) => p.fields.alt.value },
        ),
        team: fields.array(
          fields.object({
            name: fields.text({ label: 'Name' }),
            role: fields.text({ label: 'Role' }),
            photo: fields.image({ label: 'Photo', directory: 'src/assets/team', publicPath: '../../assets/team/' }),
          }),
          { label: 'Team', itemLabel: (p) => p.fields.name.value },
        ),
        baseLine: fields.text({ label: 'Where we work', description: 'Set in script near the bottom of the page.' }),
      },
    }),
  },
});
