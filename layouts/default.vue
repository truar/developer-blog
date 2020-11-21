<template>
  <div id="page" class="hfeed site">
    <client-only>
      <cookie-alert></cookie-alert>
    </client-only>
    <app-header></app-header>
    <div id="content-wrapper" class="content-wrapper">
      <div id="content" class="site-content">
        <div id="primary" class="content-area">
          <main id="main" class="site-main" role="main">
            <nuxt/>
          </main>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.site-main > .nuxt-content-container:nth-child(n+2), .site .infinite-wrap > .nuxt-content-container:nth-child(n+2) {
  margin-top: 1.75em;
  padding-top: 1.75em;
  border-top: solid 1px #ddd;
}

.site-main > .nuxt-content-container:nth-child(n+2), .site .infinite-wrap > .nuxt-content-container:nth-child(n+2), .entry-author-wrapper, .post-navigation, .comment, .page-links a:hover, .main-navigation li {
  border-color: rgba(221, 221, 221, .25);
}

.site-main > .nuxt-content-container:nth-child(n+2), .site .infinite-wrap > .nuxt-content-container:nth-child(n+2), .entry-author-wrapper, .post-navigation, .comment, .page-links a:hover, .main-navigation li {
  border-color: #ddd;
}

.content-wrapper {
  box-sizing: content-box;
  max-width: 740px;
  margin: 0 auto;
  padding: 3.5em 1.75em 0;
}

@media screen and (min-width: 62em) {
  .content-wrapper {
    box-sizing: border-box;
    max-width: 1080px;
    margin: 2.625em auto 0;
    padding: 0 1.75em;
  }
}

.site-content {
  margin: 0 auto;
}

@media screen and(min-width: 62em) {
  .content-area {
    max-width: 740px;
    margin: 0 auto;
  }
}

body {
  margin: 0;
}
</style>
