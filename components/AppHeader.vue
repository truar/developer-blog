<template>
  <header class="site-header">
    <div class="inner">
      <div class="site-branding">
        <a class="site-logo-link">
          <img alt="Picture of Thibault Ruaro" class="site-logo-image no-grav grav-hashed" width="80" height="80"
               src="/thibault-ruaro.png">
        </a>
        <h1 class="site-title">
          <a href="/" rel="home">Thibault RUARO's website</a>
        </h1>
        <p class="site-description">I am a developer wishing to share my passion and knowledge with you</p>
      </div>
      <app-social-media></app-social-media>
    </div>
    <app-navigation></app-navigation>
  </header>
</template>

<style>
.site-header {
  position: relative;
  z-index: 9999;
  min-height: 1em;
  margin: 2.625em auto;
  padding: 0 1.75em;
  text-align: center;
  word-wrap: break-word;
}

.site-branding {
  margin-bottom: 1.75em;
}

.site-logo-link {
  display: block;
}

.site-title {
  margin: .4375em 0 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen-Sans", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif;
  font-size: 38px;
  font-weight: 700;
  line-height: 1.2;
  color: #333332;
}

.site-title a {
  text-decoration: none;
  color: inherit;
}

.site-description {
  margin: .4375em 0 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen-Sans", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif;
  font-size: 17px;
  font-weight: inherit;
  line-height: 1.4;
  word-wrap: break-word;
  color: #929292;
}

</style>
