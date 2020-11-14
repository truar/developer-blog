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
    </div>
    <nav id="site-navigation" class="main-navigation" role="navigation">
      <div class="menu-main-navigation-container">
        <ul id="primary-menu" class="menu nav-menu" aria-expanded="false">
          <li
            class="menu-item menu-item-type-custom menu-item-object-custom current-menu-item menu-item-home menu-item-57">
            <a href="/">Home</a></li>
          <li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-295"><a
            href="/author/Thibault Ruaro">About me</a></li>
        </ul>
      </div>
    </nav>
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

.main-navigation {
  display: block;
  clear: both;
  width: 100%;
  margin: 20px auto 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen-Sans", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif;
  font-size: 17px;
  font-weight: 700;
  text-align: left;
}

@media screen and (min-width: 32.375em) {
  .main-navigation {
    text-align: center;
  }
}

.main-navigation ul {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

@media screen and (min-width: 32.375em) {
  .main-navigation ul {
    display: block;
  }
}

.main-navigation ul:first-child > li:first-child {
  border-top: 0;
}

.main-navigation li {
  border-top: 1px solid #ccc;
  position: relative;
  display: inline-block;
  margin-top: .4375em;
  padding-top: .4375em;
  line-height: 1.3;
  width: 100%;
}

@media screen and (min-width: 32.375em) {
  .main-navigation li {
    padding: 0;
    width: auto;
    border: 0;
    margin: .209875em .4375em;
  }
}

</style>
