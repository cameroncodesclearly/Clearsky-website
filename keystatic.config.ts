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
  { label: 'Photography', value: 'photography' },
  { label: 'Paid Social', value: 'paid-social' },
  { label: 'Branding', value: 'branding' },
  { label: 'Web', value: 'web' },
] as const;

export default config({
  storage,
  ui: {
    brand: { name: 'Clear Sky Creations' },
    navigation: {
      Work: ['caseStudies'],
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
        title: fields.slug({ name: { label: 'Title' } }),
        client: fields.text({ label: 'Client', validation: { isRequired: true } }),
        industry: fields.text({ label: 'Industry' }),
        year: fields.integer({ label: 'Year', validation: { isRequired: true } }),
        services: fields.multiselect({ label: 'Services', options: SERVICES }),
        summary: fields.text({
          label: 'One-line summary',
          description: 'Shown on cards and in search results.',
          multiline: true,
          validation: { isRequired: true, length: { max: 220 } },
        }),
        cover: fields.image({
          label: 'Cover image',
          description: 'Poster frame for cards and the video.',
          directory: 'src/assets/case-studies',
          publicPath: '../../assets/case-studies/',
          validation: { isRequired: true },
        }),
        coverVideo: fields.file({
          label: 'Cover loop (MP4)',
          description: 'Short muted loop, ideally under 8 MB. Leave empty to show the cover image.',
          directory: 'public/videos/case-studies',
          publicPath: '/videos/case-studies/',
        }),
        videoUrl: fields.url({
          label: 'Full video URL',
          description: 'YouTube, Vimeo, or a direct MP4 link for the full-length piece.',
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
            value: fields.text({ label: 'Value', description: 'e.g. 2.4M' }),
            label: fields.text({ label: 'Label', description: 'e.g. organic views' }),
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
        heroHeading: fields.text({ label: 'Hero heading' }),
        heroSubheading: fields.text({ label: 'Hero subheading', multiline: true }),
        reelVideo: fields.file({
          label: 'Hero reel loop (MP4)',
          directory: 'public/videos',
          publicPath: '/videos/',
        }),
        breezeHeading: fields.text({ label: 'Breeze section heading', defaultValue: 'We make content creation a breeze' }),
        breezeBody: fields.text({ label: 'Breeze section text', multiline: true }),
        breezeSteps: fields.array(
          fields.object({ title: fields.text({ label: 'Title' }), body: fields.text({ label: 'Text', multiline: true }) }),
          { label: 'Breeze steps', itemLabel: (p) => p.fields.title.value },
        ),
        clients: fields.array(fields.text({ label: 'Client name' }), { label: 'Client names', itemLabel: (p) => p.value }),
      },
    }),
    about: singleton({
      label: 'About page',
      path: 'src/content/settings/about',
      format: { data: 'json' },
      schema: {
        heading: fields.text({ label: 'Heading' }),
        intro: fields.text({ label: 'Intro', multiline: true }),
        story: fields.text({ label: 'Story', multiline: true }),
        values: fields.array(
          fields.object({ title: fields.text({ label: 'Title' }), body: fields.text({ label: 'Text', multiline: true }) }),
          { label: 'Values', itemLabel: (p) => p.fields.title.value },
        ),
        team: fields.array(
          fields.object({
            name: fields.text({ label: 'Name' }),
            role: fields.text({ label: 'Role' }),
            photo: fields.image({ label: 'Photo', directory: 'src/assets/team', publicPath: '../../assets/team/' }),
          }),
          { label: 'Team', itemLabel: (p) => p.fields.name.value },
        ),
      },
    }),
  },
});
