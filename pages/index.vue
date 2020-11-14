<template>
  <div>
    <app-excerpt-article v-for="article of articles" :article="article" :key="article.title"></app-excerpt-article>
  </div>
</template>

<script>
export default {
  async asyncData({ $content, params }) {
    const articles = await $content('articles', params.slug)
      .only(['title', 'description', 'image', 'slug', 'author', 'createdAt', 'readingTime'])
      .sortBy('createdAt', 'desc')
      .fetch()

    return {
      articles
    }
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
</style>
