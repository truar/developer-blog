import Vue from 'vue'
import VueGtag from 'vue-gtag'

export default ({ app }) => {
  const getGDPR = localStorage.getItem('GDPR:accepted')

  Vue.use(VueGtag, {
    config: { id: 'G-LBK3EJVE9H' },
    bootstrap: getGDPR === 'true',
    appName: 'truaro-blog',
    enabled: getGDPR === 'true',
    pageTrackerScreenviewEnabled: true
  }, app.router)
}
