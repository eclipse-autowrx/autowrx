// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

let btnClear = null;
let container = null;
let bottom = null;
let logs = '';
const appendLog = (log) => {
  if (!log) return;
  logs += log + (log.endsWith('\r\n') ? '' : '\r\n');
  if (container) {
    container.innerText = logs;
    bottom.scrollIntoView();
  }
};
const clearLog = () => {
  logs = '';
  if (container) {
    container.innerText = logs;
    bottom.scrollIntoView();
  }
};
/*
      window.onload = () => {
        console.log("On window loaded")
        btnClear = document.getElementById('btn-clear')
        container = document.getElementById('container')
        bottom = document.getElementById('bottom')
        if(btnClear) {
          btnClear.onclick = clearLog
        }
      }
      */

const onWidgetLoaded = (options) => {
  //appendLog("On widget loaded")
  btnClear = document.getElementById('btn-clear');
  container = document.getElementById('container');
  bottom = document.getElementById('bottom');
  if (btnClear) {
    btnClear.onclick = clearLog;
  }
};
