<template>
  <article class="nuxt-content-container">
    <header>
      <NuxtLink class="entry-title" :to="{ name: 'slug', params: { slug: article.slug } }">
        <h1>{{ article.title }}</h1>
        <img class="aligncenter" :src="article.image"/>
      </NuxtLink>
    </header>
    <section class="excerpt">
      <p>{{ article.description }}</p>
    </section>
    <footer class="entry-footer">
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
    </footer>
  </article>
</template>

<script>
export default {
  name: 'AppExcerptArticle',
  methods: {
    formatDate(date) {
      const options = { year: 'numeric', month: 'long', day: 'numeric' }
      return new Date(date).toLocaleDateString('en', options)
    }
  },
  props: {
    article: {
      type: Object,
      required: true
    }
  }
}
</script>

<style>
img {
  max-width: 100%;
  height: auto;
  border: 0;
}

.aligncenter {
  display: block;
  clear: both;
  margin: .875em auto;
}

.entry-meta, .entry-footer {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen-Sans", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif;
  font-size: 14px;
  font-weight: 400;
  font-style: normal;
  margin: .4375em 0 3.5em;
  color: #b3b3b1;
}

.entry-content + .entry-footer, .entry-summary + .entry-footer {
  margin-top: 1.75em;
}

body:not(.single) .entry-content + .entry-footer, body:not(.single) .entry-summary + .entry-footer {
  margin-top: .875em;
}

.entry-footer > ul, .entry-footer > span, .entry-footer > div {
  margin: 1.75em 0 0;
}

article h1 {
  font-size: 2em;
}

.entry-title:hover h1, .entry-title:focus h1, .entry-title:active h1 {
  opacity: .8;
}
</style>
