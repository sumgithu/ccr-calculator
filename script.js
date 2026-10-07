(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const els = {
    age: $('age'),
    sex: $('sex'),
    height: $('height'),
    weight: $('weight'),
    scr: $('scr'),
    resultCard: $('resultCard'),
    warningCard: $('warningCard'),
    inputError: $('inputError'),
    dynamicWarnings: $('dynamicWarnings'),
    ccrValue: $('ccrValue'),
    ccrClass: $('ccrClass'),
    summaryAge: $('summaryAge'),
    summarySex: $('summarySex'),
    summaryHeight: $('summaryHeight'),
    summaryAbw: $('summaryAbw'),
    summaryIbw: $('summaryIbw'),
    summaryAdjbw: $('summaryAdjbw'),
    summaryUsedWeight: $('summaryUsedWeight'),
    summaryScr: $('summaryScr'),
    summaryUsedScr: $('summaryUsedScr'),
    actionStatus: $('actionStatus')
  };

  let lastResult = null;

  function number(id) {
    return Number($(id).value);
  }

  function selected(name) {
    return document.querySelector(`input[name="${name}"]:checked`).value;
  }

  function round1(value) { return Math.round(value * 10) / 10; }
  function round2(value) { return Math.round(value * 100) / 100; }

  function format1(value) { return Number(value).toFixed(1); }
  function format2(value) { return Number(value).toFixed(2); }

  function validate() {
    const age = number('age');
    const height = number('height');
    const weight = number('weight');
    const scr = number('scr');

    if (!Number.isFinite(age) || age < 18 || age > 120) return '年齢は18～120歳の範囲で入力してください。';
    if (!Number.isFinite(height) || height < 100 || height > 250) return '身長は100～250 cmの範囲で入力してください。';
    if (!Number.isFinite(weight) || weight <= 0 || weight > 400) return '体重を正しく入力してください。';
    if (!Number.isFinite(scr) || scr <= 0 || scr > 30) return '血清Crを正しく入力してください。';
    return '';
  }

  function calculateIBW(heightCm, sex) {
    const heightIn = heightCm / 2.54;
    const inchesOver60 = heightIn - 60;
    const base = sex === 'male' ? 50 : 45.5;
    return base + 2.3 * inchesOver60;
  }

  function classifyCcr(ccr) {
    if (ccr >= 90) return '≥90 mL/min（参考区分）';
    if (ccr >= 60) return '60–89 mL/min（参考区分）';
    if (ccr >= 30) return '30–59 mL/min（参考区分）';
    if (ccr >= 15) return '15–29 mL/min（参考区分）';
    return '<15 mL/min（参考区分）';
  }

  function buildWarnings({ age, bmi }) {
    const warnings = [];
    if (bmi >= 35) {
      warnings.push(['高度肥満', '実測体重をそのままC-G式に使用するとCcrを過大評価する可能性があります。薬剤・資料に応じた体重選択を確認してください。']);
    } else if (bmi >= 30) {
      warnings.push(['肥満', '実測体重をそのままC-G式に使用するとCcrを過大評価することがあります。IBW/AdjBWを含め、薬剤ごとの推奨方法を確認してください。']);
    }
    if (bmi < 18.5) {
      warnings.push(['低体重', '体格や筋肉量がCcr推定値に影響する可能性があります。体重選択を個別に確認してください。']);
    }
    if (age >= 75) {
      warnings.push(['高齢', 'Scrが正常範囲でも腎機能が低下していることがあります。体格・筋肉量を含めて解釈してください。']);
    }
    warnings.push(['低筋肉量・浮腫など', '筋肉量が著しく少ない患者、浮腫等で体重が体組成を反映しにくい患者では、推定値の解釈に注意してください。']);
    warnings.push(['AKIなど', '血清Crが急速に変化している場合は定常状態を前提とする推算式の精度が低下します。']);
    return warnings;
  }

  function renderWarnings(data) {
    const warnings = buildWarnings(data);
    els.dynamicWarnings.innerHTML = warnings.map(([title, body]) =>
      `<div class="warning-item"><strong>${title}</strong>${body}</div>`
    ).join('');
    els.warningCard.hidden = false;
  }

  function encodeState() {
    const params = new URLSearchParams();
    params.set('age', els.age.value);
    params.set('sex', els.sex.value);
    params.set('height', els.height.value);
    params.set('weight', els.weight.value);
    params.set('scr', els.scr.value);
    params.set('wm', selected('weightMode'));
    params.set('sa', selected('scrAdjust'));
    history.replaceState(null, '', `${location.pathname}?${params.toString()}`);
  }

  function decodeState() {
    const p = new URLSearchParams(location.search);
    const keys = ['age', 'height', 'weight', 'scr'];
    if (!keys.some(k => p.has(k))) return;
    els.age.value = p.get('age') || '';
    els.sex.value = p.get('sex') === 'female' ? 'female' : 'male';
    els.height.value = p.get('height') || '';
    els.weight.value = p.get('weight') || '';
    els.scr.value = p.get('scr') || '';
    const wm = p.get('wm');
    const sa = p.get('sa');
    if (['abw','ibw','adjbw'].includes(wm)) document.querySelector(`input[name="weightMode"][value="${wm}"]`).checked = true;
    if (['none','plus02'].includes(sa)) document.querySelector(`input[name="scrAdjust"][value="${sa}"]`).checked = true;
  }

  function clearError() {
    els.inputError.hidden = true;
    els.inputError.textContent = '';
  }

  function calculate() {
    clearError();
    const error = validate();
    if (error) {
      els.inputError.textContent = error;
      els.inputError.hidden = false;
      els.resultCard.hidden = true;
      els.warningCard.hidden = true;
      return;
    }

    const age = number('age');
    const sex = els.sex.value;
    const height = number('height');
    const abw = number('weight');
    const scrInput = number('scr');
    const weightMode = selected('weightMode');
    const scrAdjust = selected('scrAdjust');

    const ibw = calculateIBW(height, sex);
    const adjbw = ibw + 0.4 * (abw - ibw);
    let usedWeight = abw;
    let usedWeightLabel = '実測体重（ABW）';
    if (weightMode === 'ibw') { usedWeight = ibw; usedWeightLabel = '理想体重（IBW）'; }
    if (weightMode === 'adjbw') { usedWeight = adjbw; usedWeightLabel = '補正体重（AdjBW）'; }

    const usedScr = scrAdjust === 'plus02' ? scrInput + 0.2 : scrInput;
    let ccr = ((140 - age) * usedWeight) / (72 * usedScr);
    if (sex === 'female') ccr *= 0.85;

    const bmi = abw / Math.pow(height / 100, 2);
    const rounded = round1(ccr);

    lastResult = {
      age, sex, height, abw, ibw, adjbw, usedWeight, usedWeightLabel,
      scrInput, usedScr, scrAdjust, ccr: rounded, bmi
    };

    els.ccrValue.textContent = format1(rounded);
    els.ccrClass.textContent = classifyCcr(rounded);
    els.summaryAge.textContent = `${age} 歳`;
    els.summarySex.textContent = sex === 'male' ? '男性' : '女性';
    els.summaryHeight.textContent = `${format1(height)} cm`;
    els.summaryAbw.textContent = `${format1(abw)} kg`;
    els.summaryIbw.textContent = `${format1(ibw)} kg`;
    els.summaryAdjbw.textContent = `${format1(adjbw)} kg`;
    els.summaryUsedWeight.textContent = `${format1(usedWeight)} kg（${usedWeightLabel.replace(/^.*?（/, '').replace('）','')}）`;
    els.summaryScr.textContent = `${format2(scrInput)} mg/dL`;
    els.summaryUsedScr.textContent = `${format2(usedScr)} mg/dL${scrAdjust === 'plus02' ? '（+0.2）' : ''}`;
    els.actionStatus.textContent = '';
    els.resultCard.hidden = false;
    renderWarnings({ age, bmi });
    encodeState();
  }

  function resultText() {
    if (!lastResult) return '';
    const r = lastResult;
    return [
      `推定Ccr：${format1(r.ccr)} mL/min`,
      `年齢：${r.age}歳`,
      `性別：${r.sex === 'male' ? '男性' : '女性'}`,
      `身長：${format1(r.height)} cm`,
      `実測体重：${format1(r.abw)} kg`,
      `IBW：${format1(r.ibw)} kg`,
      `AdjBW：${format1(r.adjbw)} kg`,
      `使用体重：${format1(r.usedWeight)} kg（${r.usedWeightLabel.replace(/^.*?（/, '').replace('）','')}）`,
      `Scr：${format2(r.scrInput)} mg/dL`,
      `Scr補正：${r.scrAdjust === 'plus02' ? '+0.2 mg/dL' : 'なし'}`,
      'Cockcroft–Gault式'
    ].join('\n');
  }

  async function copyResult() {
    if (!lastResult) return;
    const text = resultText();
    try {
      await navigator.clipboard.writeText(text);
      els.actionStatus.textContent = '結果をコピーしました。';
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      els.actionStatus.textContent = ok ? '結果をコピーしました。' : 'コピーできませんでした。';
    }
  }

  function shareState() {
    if (!lastResult) return;
    encodeState();
    const url = location.href;
    if (navigator.share) {
      navigator.share({ title: document.title, url }).then(() => {
        els.actionStatus.textContent = '共有しました。';
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        els.actionStatus.textContent = '共有用URLをコピーしました。';
      }).catch(() => {
        els.actionStatus.textContent = url;
      });
    } else {
      els.actionStatus.textContent = url;
    }
  }

  function reset() {
    ['age','height','weight','scr'].forEach(id => { $(id).value = ''; });
    els.sex.value = 'male';
    document.querySelector('input[name="weightMode"][value="abw"]').checked = true;
    document.querySelector('input[name="scrAdjust"][value="none"]').checked = true;
    els.resultCard.hidden = true;
    els.warningCard.hidden = true;
    els.actionStatus.textContent = '';
    lastResult = null;
    clearError();
    history.replaceState(null, '', location.pathname);
    els.age.focus();
  }

  $('calculateBtn').addEventListener('click', calculate);
  $('copyBtn').addEventListener('click', copyResult);
  $('shareBtn').addEventListener('click', shareState);
  $('resetBtn').addEventListener('click', reset);
  document.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') calculate();
    });
  });

  decodeState();
  if (new URLSearchParams(location.search).has('age')) calculate();
})();
