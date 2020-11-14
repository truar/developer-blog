<template>
  <section class="author">
    <div class="author-main">
      <div class="author-picture">
        <img :src="author.image" :alt="'Picture of ' + author.name"/>
      </div>
      <div class="author-information">
        <h2 class="author-title">
          Published by {{ author.name }}
        </h2>
        <p class="author-bio">{{ author.bio }} <NuxtLink :to="`/author/${author.name}`">Read more</NuxtLink></p>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  props: {
    author: {
      type: Object,
      required: true
    }
  }
}
</script>

<style>

.author {
  margin-top: 40px;
  margin-bottom: 20px;
}

.author-main {
  display: flex;
  flex-direction: row;
  gap: 15px;
  align-items: flex-start;
  justify-content: space-evenly;
}

.author-picture img {
  width: 80px;
}

.author-information {
  display: flex;
  flex-direction: column;
  width: 80%;
}

.author-title {
  clear: none;
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.4;
  color: #333332;
}

@media screen and (min-width: 48.9375em) {
  .author-title {
    font-size: 24px;
    line-height: 1.55;
    margin-top: -.21875em;
  }
}

.author-bio {
  margin-top: 0;
  font-size: 15px;
  font-style: italic;
}

</style>
