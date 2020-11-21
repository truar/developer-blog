<template>
  <div class="cookie-wrapper" v-if="isOpen">
    <div class="cookie-icon">
      🍪
    </div>
    <div class="cookie-text">
      <p>
        Can I use cookies for analytics? Read
        <nuxt-link class="text-link" to="/privacy-policy">the privacy policy</nuxt-link>
        for more information.
      </p>
    </div>
    <div class="cookie-actions">
      <div class="cookie-button" @click="accept">Yes, sure</div>
      <div class="cookie-button" @click="deny">&times;</div>
    </div>
  </div>
</template>

<script>
import { bootstrap } from 'vue-gtag'

export default {
  data() {
    return {
      isOpen: false
    }
  },
  created() {
    if (!this.getGDPR() === true) {
      this.isOpen = true
    }
  },
  methods: {
    getGDPR() {
      if (process.browser) {
        return localStorage.getItem('GDPR:accepted', true)
      }
    },
    deny() {
      if (process.browser) {
        this.isOpen = false
        localStorage.setItem('GDPR:accepted', false)
      }
    },
    accept() {
      if (process.browser) {
        bootstrap().then(gtag => {
          this.isOpen = false
          localStorage.setItem('GDPR:accepted', true)
          location.reload()
        })
      }
    }
  }
}
</script>

<style scoped>

.cookie-wrapper {
  display: flex;
  position: fixed;
  bottom: 0;
  background-color: rgba(243, 244, 246, 1);
  align-items: center;
  justify-content: center;
  z-index: 10000;
  width: 100%;
  padding: 0 .5em;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

@media screen and (min-width: 32.375em) {
  .cookie-wrapper {
    padding: 0 2em;
    align-items: baseline;
  }
}

.cookie-icon {
  padding: 0 1em;
  display: none;
}

@media screen and (min-width: 32.375em) {
  .cookie-icon {
    display: flex;
  }
}

.cookie-text {
  width: 80%;
}

@media screen and (min-width: 32.375em) {
  .cookie-text {
    width: auto;
  }
}

.cookie-actions {
  padding: 0 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-right: .5em;
}

@media screen and (min-width: 32.375em) {
  .cookie-actions {
    padding: 0 1em;
  }
}

.cookie-button {
  border: 1px solid rgba(0, 0, 0, .12);
  margin: .25em 0em;
  padding: .125em .75em;
  border-radius: 8px;
  cursor: pointer;
}

@media screen and (min-width: 32.375em) {
  .cookie-button {
    margin: 0em .5em;
  }
}

.cookie-button:hover {
  background-color: rgba(236, 236, 236, 1);
}


</style>
