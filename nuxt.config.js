export default {
  // Target (https://go.nuxtjs.dev/config-target)
  target: 'static',

  // Global page headers (https://go.nuxtjs.dev/config-head)
  head: {
    titleTemplate: '%s - Thibault Ruaro\'s blog',
    title: 'Home',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: 'Being a software engineer is a passion ! Technical articles about Software Development, GCP and Cloud technologies, Spring Framework, Software Craftsmanship. Come read and know me better.'
      },
      {
        hid: 'og:description',
        name: 'og:description',
        content: 'Being a software engineer is a passion ! Technical articles about Software Development, GCP and Cloud technologies, Spring Framework, Software Craftsmanship. Come read and know me better.'
      },
      {
        hid: 'og:type',
        property: 'og:type',
        content: 'website'
      },
      {
        hid: 'og:url',
        property: 'og:url',
        content: process.env.URL || 'http://localhost:3000'
      },
      {
        hid: 'twitter:card',
        property: 'twitter:card',
        content: 'summary'
      },
      {
        hid: 'twitter:creator',
        property: 'twitter:creator',
        content: '@ThibaultRuaro'
      }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  content: {
    markdown: {
      prism: {
        theme: 'prism-themes/themes/prism-material-dark.css'
      }
    },
    nestedProperties: ['author.name']
  },

  // Global CSS (https://go.nuxtjs.dev/config-css)
  css: [
    '@/assets/css/main.css'
  ],

  // Plugins to run before rendering page (https://go.nuxtjs.dev/config-plugins)
  plugins: [],

  // Auto import components (https://go.nuxtjs.dev/config-components)
  components: true,

  // Modules for dev and build (recommended) (https://go.nuxtjs.dev/config-modules)
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    '@nuxt/typescript-build'
  ],

  // Modules (https://go.nuxtjs.dev/config-modules)
  modules: [
    '@nuxt/content',
    ['@nuxtjs/fontawesome', {
      component: 'fa',
      icons: {
        solid: ['faUser', 'faCalendar', 'faClock', 'faChevronLeft', 'faChevronRight'],
        brands: ['faLinkedin', 'faGithub', 'faStackOverflow']
      }
    }]
  ],

  // Build Configuration (https://go.nuxtjs.dev/config-build)
  build: {}
}
