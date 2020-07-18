// ==UserScript==
// @name        Anonymous Plurks LED
// @namespace   https://plurk.moka-rin.moe/readplurk/
// @match       https://www.plurk.com/*
// @grant       none
// @version     1.1
// @author      Jeremy Lam "JLChnToZ"
// @description Anonymous Plurk LED
// @require     https://plurk.moka-rin.moe/readplurk/led/js/1.led.js?202007182130
// @require     https://plurk.moka-rin.moe/readplurk/led/js/led.js?202007182130
// ==/UserScript==

const nav = document.querySelector('.top-bar-main>ul');
if(nav) {
  const child = nav.appendChild(document.createElement('li'));
  child.className = 'item tab left';
  child.innerHTML = '<anonymous-led src="/Stats/getAnonymousPlurks?lang=zh&limit=15" color="#AE00B0" lang="zh-tw"></anonymous-led>';
}