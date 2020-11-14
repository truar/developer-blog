<template>
  <nav id="site-navigation" class="main-navigation" role="navigation">
    <div class="menu-main-navigation-container">
      <ul id="primary-menu" class="menu nav-menu" aria-expanded="false">
        <li>
          <a href="/">Home</a></li>
        <li>
          <a href="/author/Thibault Ruaro">About me</a>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style>
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
