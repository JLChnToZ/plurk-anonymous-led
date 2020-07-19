// ==UserScript==
// @name        Anonymous Plurks LED
// @namespace   https://plurk.moka-rin.moe/readplurk/
// @match       https://www.plurk.com/*
// @updateURL   https://plurk.moka-rin.moe/readplurk/led/plurk-anonymous-led.user.js
// @grant       GM_addStyle
// @version     1.2
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
  // 語系選擇器
  let lang = document.documentElement.lang || document.body.lang || 'zh-tw';
  let srcLang;
  switch(lang) {
    case 'zh-Hant-HK':
    case 'zh-Hant': lang = 'zh-tw'; srcLang = 'zh'; break;
    case 'zh-Hans': lang = 'zh-cn'; srcLang = 'zh'; break;
    case 'ja': srcLang = 'ja'; break;
    default:   srcLang = 'en'; break;
  }
  led.setAttribute('lang', lang);
  led.setAttribute('src', `/Stats/getAnonymousPlurks?lang=${srcLang}&limit=15`);
  if(document.querySelector('#navbar_search_kw')) GM_addStyle(`
    #navbar_search_kw input {
      width: 35px;
      transition: opacity 0.3s, width 0.2s;
      transition-delay: 0, 0.2s;
    }
    #navbar_search_kw:hover input, #navbar_search_kw input:focus {
      width: 200px;
      transition-delay: 0s;
    }
  `);
}