<template>
  <router-view />
</template>


<script>
export default {
  name: 'App',
}
</script>


<style lang="css">
  /********************************/
  /* Fonts */
  /********************************/

  @font-face {
    font-family: 'Material Icons';
    font-style: normal;
    font-weight: 400;
    src: local('Material Icons'),
    local('MaterialIcons-Regular'),
    url(../../static/fonts/MaterialIcons-Regular.woff2) format('woff2');
  }

  .material-icons {
    font-family: 'Material Icons';
    font-weight: normal;
    font-style: normal;
    font-size: 24px;  /* Preferred icon size */
    display: inline-block;
    line-height: 1;
    text-transform: none;
    letter-spacing: normal;
    word-wrap: normal;
    white-space: nowrap;
    direction: ltr;

    /* Support for all WebKit browsers. */
    -webkit-font-smoothing: antialiased;
    /* Support for Safari and Chrome. */
    text-rendering: optimizeLegibility;

    /* Support for Firefox. */
    -moz-osx-font-smoothing: grayscale;

    /* Support for IE. */
    font-feature-settings: 'liga';
  }

  /********************************/
  /* Basic HTML styles */
  /********************************/

  html, body {
    margin: 0;
    padding: 0;
    height: 100vh;
    width: 100vw;
  }

  h1, h2 {
    font-weight: normal;
  }

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    display: inline-block;
    margin: 0 10px;
  }

  a {
    color: #42b983;
  }

  /********************************/
  /* App container styles */
  /********************************/

  /* Make our touch wrapper div take up the whole screen, but also make it
     fixed so that we don't have problems with readjustment snapping */
  #gesture-wrapper {
    position: fixed;
    height: 100%;
    width: 100%;
  }

  #app {
    height: 100%;
    width: 100%;
    font-size: 16px;
    font-weight: 400;
    text-align: left;
    text-transform: none;
    font-family: Roboto,Noto Sans,Noto,sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
  }

  #swipe-start-text {
    font-size:25px;
    z-index:50;
    left: 40px;
    position: fixed;
  }

  /********************************/
  /* Nav Drawer opener styles */
  /********************************/

  #sidetab-aligner {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    left: 0px;
    position: fixed;
  }

  #sidetab {
    background: #000;
    border: 2px solid #000;
    height: 75px;
    left: 0;
    width: 25px;
    border-top-right-radius: 15px;
    border-bottom-right-radius: 15px;
    margin: 0;
    padding: 0;
    position: fixed;
    display:block;
    z-index: 9998;
    cursor: pointer;
  }

  #sidetab-arrow {
    z-index: 9999;
    cursor: pointer;
  }

  /********************************/
  /* Misc application styles */
  /********************************/

  #playground-container {
    width: 80%;
    margin: auto;
  }

  .vue-slider {
    margin-top: 20px;
    margin-bottom: 20px;
  }

  .select-message {
    display: flex;
    height: 100vh;
    align-items: center;
    justify-content: center;
    font-size: 25px;
    width: 100%;
  }

  .select-message p {
    width: 50%;
    line-height: 120%;
    text-align: center;
  }
</style>

<style src="vuetify/dist/vuetify.min.css"></style>
<style src="./PatreonButton.css"></style>
