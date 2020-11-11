<template>
  <div>
    <app-excerpt-article v-for="article of articles" :article="article" :key="article.title"></app-excerpt-article>
  </div>
</template>

<script>
export default {
  async asyncData({ $content, params }) {
    const articles = await $content('articles', params.slug)
      .only(['title', 'description', 'img', 'slug', 'author', 'createdAt', 'readingTime'])
      .sortBy('createdAt', 'asc')
      .fetch()

    return {
      articles
    }
  }
}
</script>

