// ==UserScript==
// @name        Anonymous Plurks LED
// @namespace   https://plurk.moka-rin.moe/readplurk/
// @match       https://www.plurk.com/*
// @grant       none
// @version     1.1
// @author      Jeremy Lam "JLChnToZ"
// @description Anonymous Plurk LED
// @require     https://plurk.moka-rin.moe/readplurk/led/js/1.led.js?2020071901
// @require     https://plurk.moka-rin.moe/readplurk/led/js/led.js?2020071901
// ==/UserScript==

const nav = document.querySelector('.top-bar-main>ul');
if(nav) {
  const child = nav.appendChild(document.createElement('li'));
  child.className = 'item tab left';
  const led = child.appendChild(document.createElement('anonymous-led'));
  led.setAttribute('color', '#AE00B0'); // 主要顏色
  // led.setAttribute('dim-color', ''); // 暗淡顏色
  // led.setAttribute('bgcolor', ''); // 背景顏色
  led.setAttribute('lang', document.documentElement.lang || document.body.lang || 'zh-tw');
  led.setAttribute('src', '/Stats/getAnonymousPlurks?lang=zh&limit=15');
}