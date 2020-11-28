<template>
  <main id="main" class="site-main" role="main">
    <article>
      <h1 class="main-title">{{ article.title }}</h1>
      <div class="entry-meta">
                  <span class="byline">
                    <fa :icon="['fas', 'user']"></fa>
                    {{ article.author.name }}
                  </span>
        <span class="published-on">
                    <fa :icon="['fas', 'calendar']"></fa>
                    {{ formatDate(article.createdAt) }}
                  </span>
        <span class="word-count">
                    <fa :icon="['fas', 'clock']"></fa>
                    {{ article.readingTime }}
                  </span>
      </div>
      <img class="aligncenter" :src="article.image" :alt="article.alt"/>
      <p>{{ article.description }}</p>
      <nuxt-content :document="article"/>

      <author :author="article.author"></author>
      <prev-next :prev="prev" :next="next"/>
    </article>
  </main>
</template>

<script>
export default {
  methods: {
    formatDate(date) {
      const options = { year: 'numeric', month: 'long', day: 'numeric' }
      return new Date(date).toLocaleDateString('en', options)
    }
  },
  head() {
    return {
      title: this.article.title,
      meta: [
        {
          hid: 'description',
          content: this.article.description,
          name: 'description'
        },
        {
          hid: 'og:title',
          content: this.article.title,
          property: 'og:title'
        },
        {
          hid: 'og:description',
          content: this.article.description,
          property: 'og:description'
        },
        {
          hid: 'og:url',
          content: (process.env.URL || 'http://localhost:3000') + '/' + this.article.slug,
          property: 'og:url'
        },
        {
          hid: 'og:image',
          content: (process.env.URL || 'http://localhost:3000') + this.article.image,
          property: 'og:image'
        }
      ]
    }
  },
  async asyncData({ $content, params }) {
    const article = await $content('articles', params.slug).fetch()

    const [prev, next] = await $content('articles')
      .only(['title', 'slug'])
      .sortBy('createdAt', 'desc')
      .surround(params.slug)
      .fetch()

    return { article, prev, next }
  }
}
</script>

<style>
.site-main .nuxt-content-container:nth-child(n+2) {
  margin-top: 1.75em;
  padding-top: 1.75em;
  border-top: solid 1px #ddd;
}

.site-main .nuxt-content-container:nth-child(n+2) {
  border-color: rgba(221, 221, 221, .25);
}

.site-main .main-title {
  margin-bottom: 0px;
}

.entry-meta {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen-Sans", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif;
  font-size: 14px;
  font-weight: 400;
  font-style: normal;
  margin: .4375em 0 3.5em;
  color: #b3b3b1;
}

.entry-meta > span {
  top: 3px;
  display: inline-block;
  margin-right: 1.3125em;
  vertical-align: middle;
  position: relative;
}

.entry-meta a {
  -webkit-transition: color .14s ease-in-out;
  transition: color .14s ease-in-out;
  line-height: inherit;
  text-decoration: none;
  color: #b3b3b1;
}

.nuxt-content-container {
  position: relative;
}

.aligncenter {
  display: block;
  clear: both;
  margin: .875em auto;
}

img {
  max-width: 100%;
  height: auto;
  border: 0;
}

article h1 {
  font-size: 2em;
}

.nuxt-content h1 {
  font-weight: bold;
  font-size: 28px;
}

.nuxt-content h2 {
  font-weight: bold;
  font-size: 22px;
}

.nuxt-content p {
  margin-bottom: 20px;
}

.nuxt-content h1,
.nuxt-content h2,
.nuxt-content h3,
.nuxt-content h4,
.nuxt-content h5,
.nuxt-content h6 {
  display: flex;
  flex-direction: row-reverse;
  justify-content: flex-end;
}

.nuxt-content h1:hover .icon.icon-link,
.nuxt-content h2:hover .icon.icon-link,
.nuxt-content h3:hover .icon.icon-link,
.nuxt-content h4:hover .icon.icon-link,
.nuxt-content h5:hover .icon.icon-link,
.nuxt-content h6:hover .icon.icon-link {
  background-image: url('~assets/svg/icon-hashtag.svg');
  display: inline-block;
  margin-left: 5px;
}

.nuxt-content h1:hover .icon.icon-link,
.nuxt-content h2:hover .icon.icon-link {
  width: 20px;
  height: 20px;
  background-size: 20px 20px;
}

.nuxt-content h3:hover .icon.icon-link {
  width: 18px;
  height: 18px;
  background-size: 18px 18px;
}

.nuxt-content h4:hover .icon.icon-link,
.nuxt-content h5:hover .icon.icon-link,
.nuxt-content h6:hover .icon.icon-link {
  width: 16px;
  height: 16px;
  background-size: 16px 16px;
}

.nuxt-content blockquote {
  padding: 0 1em;
  color: #6A737D;
  border-left: .25em solid #DFE2E5;
  margin-left: 10px;
  margin-right: 10px;
}

@media screen and (min-width: 32.375em) {
  .nuxt-content blockquote {
    margin-left: 40px;
    margin-right: 40px;
  }
}

.nuxt-content blockquote ul, .nuxt-content blockquote ol {
  margin: 0 0 1.75em 1em;
}

@media screen and (min-width: 32.375em) {
  .nuxt-content blockquote ul, .nuxt-content blockquote ol {
    margin: 0 0 1.75em 2em;
  }
}

.nuxt-content li ul {
  margin-bottom: 0;
}

.nuxt-content p code, .nuxt-content blockquote code, .nuxt-content li code {
  padding: .2em .4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 6px;
  word-wrap: break-word;
}

.nuxt-content ul li, .nuxt-content p {
  word-break: break-word;
}

.nuxt-content pre {
  border-radius: 6px;
}

.nuxt-content img {
  display:block;
  margin:auto;
}

</style>
