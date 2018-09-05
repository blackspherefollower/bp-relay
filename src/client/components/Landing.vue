<template>
  <v-app id="app">
    <v-container>
      <header>
        <div ref="patreonButton" id="patreon-button">
          <div data-reactroot="" class="_2KV-widgets-shared--patreonWidgetWrapper"><a class="sc-bxivhb ffInCX" color="primary" type="button" href="https://www.patreon.com/bePatron?u=2860444&amp;redirect_uri=http%3A%2F%2Fbuttplug.world%2Ftest.html&amp;utm_medium=widget" role="button"><div class="sc-htpNat gdWQYu"><div class="sc-gzVnrw dJCpyC" display="flex" wrap="nowrap" direction="[object Object]"><div class="sc-dnqmqq llsQFn"><span class="sc-htoDjs fqfmvk"><svg viewBox="0 0 569 546" version="1.1" xmlns="http://www.w3.org/2000/svg"><title>Patreon logo</title><g><circle data-color="1" id="Oval" cx="362.589996" cy="204.589996" r="204.589996"></circle><rect data-color="2" id="Rectangle" x="0" y="0" width="100" height="545.799988"></rect></g></svg></span></div><div class="sc-gqjmRU fFOxVX" width="1.5"></div>Give us money</div></div></a></div>
        </div>
      </header>
      <v-container grid-list-md text-xs-center id="landing-container">
        <v-form>
          <div>
            <h1>Buttplug Relay Service</h1>
            <p>This service allows a Buttplug Client to connect to a Buttplug Server over the internet without any additional port forwarding, etc.</p>
            <div id="instructions">
              <p>To use the service:</p>
              <ol>
                <li>Pick a room name, or use the randomly generated one, and enter the room.</li>
                <li>Use the Buttplug panel on the left to connect your Buttplug Server to the Relay.</li>
                <li>Start scanning for devices and select those you want to be available in the room.</li>
                <li>Use the WebSocket URL at the top of the page in your Buttplug Client.</li>
                <li>The client can now control the devices made available in the room, regardless of where in the world the client and server are.</li>
              </ol>
            </div>
          </div>
          <v-text-field solo v-model="room"></v-text-field>
          <v-btn v-on:click="EnterRoom">Enter room</v-btn>
        </v-form>
      </v-container>
    </v-container>
  </v-app>
</template>

<script lang="ts" src="./Landing.ts">
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
    url(../../../static/fonts/MaterialIcons-Regular.woff2) format('woff2');
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
  ol {
    list-style-type: numeric;
    padding: 0;
  }
  li {
    margin: 0 20px;
  }
  a {
    color: #42b983;
  }
  /********************************/
  /* App container styles */
  /********************************/
  /* Make our touch wrapper div take up the whole screen, but also make it
     fixed so that we don't have problems with readjustment snapping */

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
  /********************************/
  /* Misc application styles */
  /********************************/
  #landing-container {
    width: 80%;
    margin: auto;
  }
  #instructions {
    text-align: justify;
    margin-bottom: 16px;
  }
</style>

<style src="../PatreonButton.css"></style>
