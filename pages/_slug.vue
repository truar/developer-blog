<template>
  <main id="main" class="site-main" role="main">
    <article>
      <h1>{{ article.title }}</h1>
      <img class="aligncenter" :src="article.image" :alt="article.alt"/>
      <p>{{ article.description }}</p>
      <p><fa :icon="['fas', 'calendar']"></fa> Article last updated: {{ formatDate(article.updatedAt) }}</p>
      <p><fa :icon="['fas', 'clock']"></fa> {{ article.readingTime }}</p>
      <nuxt-content :document="article"/>

      <author :author="article.author"></author>
      <prev-next :prev="prev" :next="next" />
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

.site-main .nuxt-content-container:nth-child(n+2)  {
  border-color: rgba(221, 221, 221, .25);
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

.icon.icon-link {
  background-image: url('~assets/svg/icon-hashtag.svg');
  display: inline-block;
  width: 20px;
  height: 20px;
  background-size: 20px 20px;
}

</style>
