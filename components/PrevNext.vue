<template>
  <div class="prev-next-link">
    <NuxtLink
      v-if="prev"
      :to="{ name: 'slug', params: { slug: prev.slug } }"
      class="text-primary font-bold hover:underline"
    >
      <fa :icon="['fas', 'chevron-left']"></fa> {{ prev.title }}
    </NuxtLink>
    <span v-else>&nbsp;</span>
    <NuxtLink
      v-if="next"
      :to="{ name: 'slug', params: { slug: next.slug } }"
      class="font-bold hover:underline"
    >
      {{ next.title }} <fa :icon="['fas', 'chevron-right']"></fa>
    </NuxtLink>
    <span v-else>&nbsp;</span>
  </div>
</template>

<script>
export default {
  props: {
    prev: {
      type: Object,
      default: () => null
    },
    next: {
      type: Object,
      default: () => null
    }
  }
}
</script>

<style>
.prev-next-link {
  display: flex;
  justify-content: space-between;
  margin-top: 2.675em;
  margin-bottom: 2em;
  padding: .4375em 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen-Sans", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif;
  border-bottom: solid 1px #ddd;
  border-top: solid 1px #ddd;
  border-color: rgba(221, 221, 221, .25);
}

.prev-next-link a {
  display: inline-block;
  padding: .21875em 0;
  -webkit-transition: color .14s ease-in-out;
  transition: color .14s ease-in-out;
  font-weight: 400;
  vertical-align: middle;
  color: #b6b6b4;
}

</style>
