<template>
  <nav class="jetpack-social-navigation jetpack-social-navigation-svg" role="navigation"
       aria-label="Social Links Menu">
    <div class="menu-social-navigation-container">
      <ul id="menu-social-navigation" class="menu">
        <li>
          <a href="https://www.linkedin.com/in/thibault-ruaro-45163040/" target="_blank"
             title="Thibault RUARO's Linkedin profile">
            <fa :icon="['fab', 'linkedin']"></fa>
          </a>
        </li>
        <li>
          <a href="https://github.com/truar" target="_blank" title="Thibault RUARO's Github profile">
            <fa :icon="['fab', 'github']"></fa>
          </a>
        </li>
        <li>
          <a href="https://stackoverflow.com/users/12576497/ruaro-thibault" target="_blank"
             title="Thibault RUARO's StackOverflow profile">
            <fa :icon="['fab', 'stack-overflow']"></fa>
          </a>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style>
.jetpack-social-navigation ul {
  display: block;
  margin: 0 0 1.5em;
  padding: 0;
}

.jetpack-social-navigation ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.jetpack-social-navigation ul li {
  position: relative;
  display: inline-block;
  line-height: 1;
  margin: 0 .209875em;
}

.jetpack-social-navigation li {
  display: inline-block;
  margin: 0;
  line-height: 1;
}

.jetpack-social-navigation li a {
  color: #a4a4a4;
}

.jetpack-social-navigation li a {
  display: block;
  padding: 0 3px;
  -webkit-transition: color ease .3s, opacity ease .3s;
  transition: color ease .3s, opacity ease .3s;
  font-size: 28px;
  color: #a4a4a4;
  text-decoration: none;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.jetpack-social-navigation a {
  border: 0;
  height: 1em;
  text-decoration: none;
  width: 1em;
}

</style>
