document.addEventListener('DOMContentLoaded', function() {
  // 初期データ
  let data = JSON.parse(localStorage.getItem('healthLogData')) || {
    mainSymptoms: ['頭痛', '吐き気', 'めまい', 'しびれ', '光に敏感になる（光過敏）', '音に敏感になる（音過敏）', '視覚異常（例：チカチカする、ぼやける等）', '動悸', '発汗', '脱力感', '息苦しい', 'その他'],
    painPlaces: ['こめかみ', '前頭部', '後頭部', '頭頂部', '片側（右）', '片側（左）', '両側', '目の奥', '首の付け根', 'その他'],
    painTypes: ['針で刺すような', 'ズキッとする', 'チクチクする', 'ピリピリする', '重い', '鈍い', '拍動性', '電気が走るような', '圧迫感', 'その他'],
    activities: ['歩いていた', '座っていた', '横になっていた', '食事中', '入浴中', '仕事中', '家事中', '運動中', '就寝中', '起床直後', '外出中', 'その他'],
    logs: []
  };

  // 現在の入力状態
  let currentEntry = {
    mainSymptoms: [],
    painPlaces: [],
    painType: [],
    activities: [],
    activityOther: '',
    painTypeOther: '',
    timestamp: null
  };

  // DOM要素
  const form = document.getElementById('symptom-form');
  const mainSymptomsEl = document.getElementById('main-symptoms');
  const painPlacesEl = document.getElementById('pain-places');
  const painTypesEl = document.getElementById('pain-types');
  const activitiesEl = document.getElementById('activities');
  const headacheOptionsEl = document.getElementById('headache-options');
  const historyEl = document.getElementById('history');
  const activityOtherEl = document.getElementById('activity-other');
  const painTypeOtherEl = document.getElementById('pain-type-other');

  // 初期レンダリング
  render();

  // イベントリスナー
  form.addEventListener('submit', handleSubmit);
  document.getElementById('add-main-symptom-btn').addEventListener('click', addMainSymptom);
  document.getElementById('add-pain-place-btn').addEventListener('click', addPainPlace);
  document.getElementById('add-pain-type-btn').addEventListener('click', addPainType);
  document.getElementById('add-activity-btn').addEventListener('click', addActivity);
  document.getElementById('csv-export-btn').addEventListener('click', exportToCsv);
  document.getElementById('text-export-btn').addEventListener('click', exportToText);
  document.getElementById('sort-order').addEventListener('change', renderHistory);
  activityOtherEl.addEventListener('input', (e) => currentEntry.activityOther = e.target.value);
  painTypeOtherEl.addEventListener('input', (e) => currentEntry.painTypeOther = e.target.value);
  
  // 削除ボタンのイベントを委譲
  historyEl.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
      e.preventDefault();
      e.stopPropagation();
      const index = parseInt(deleteBtn.dataset.index, 10);
      deleteLog(index);
    }
  });
  
  // CSVでエクスポート
  function exportToCsv() {
    if (data.logs.length === 0) {
      alert('エクスポートする履歴がありません');
      return;
    }

    // ヘッダー行
    const headers = [
      '日時',
      '主症状',
      '頭の痛む場所',
      '痛みの種類',
      '行動',
      'メモ'
    ];
    
    // データ行
    const rows = data.logs.map(log => {
      const date = new Date(log.timestamp).toLocaleString();
      return [
        `"${date}"`,
        `"${log.mainSymptoms.join(', ')}"`,
        `"${log.painPlaces.join(', ')}"`,
        `"${log.painType[0] || ''}${log.painTypeOther ? ` (${log.painTypeOther})` : ''}"`,
        `"${log.activities.join(', ')}"`,
`"${log.activityOther || ''}"`  // メモを出力

      ].join(',');
    });

    // CSVデータを結合
    const csv = [
      headers.join(','),
      ...rows
    ].join('\n');

    // ダウンロード
    downloadFile(csv, '体調ログ.csv', 'text/csv;charset=utf-8;');
  }


  // テキストでエクスポート
  function exportToText() {
    if (data.logs.length === 0) {
      alert('エクスポートする履歴がありません');
      return;
    }

    // テキストデータを生成
    let textData = '';
    
    data.logs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleString();
      textData += `【記録日時】${date}\n`;
      textData += `【主症状】${log.mainSymptoms.join(', ')}\n`;
      if (log.painPlaces.length > 0) {
        textData += `【痛む場所】${log.painPlaces.join(', ')}\n`;
      }
      if (log.painType.length > 0) {
        textData += `【痛みの種類】${log.painType[0]}${log.painTypeOther ? ` (${log.painTypeOther})` : ''}\n`;
      }
      textData += `【行動】${log.activities.join(', ')}\n`;
      if (log.activityOther) {
        textData += `【メモ】${log.activityOther}\n`;  // メモを別項目で出力
      }
      textData += '\n' + '='.repeat(30) + '\n\n';
    });

    // ダウンロード
    downloadFile(textData, '体調ログ.txt', 'text/plain;charset=utf-8;');
  }

  // ファイルをダウンロードする共通関数
  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob(["\uFEFF" + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // レンダリング関数
  function render() {
    // 主症状のレンダリング
    renderBtnGroup(
      data.mainSymptoms,
      mainSymptomsEl,
      currentEntry.mainSymptoms,
      true,
      () => {
        // 頭痛が選択されているかチェックして詳細オプションを表示/非表示
        const hasHeadache = currentEntry.mainSymptoms.includes('頭痛');
        headacheOptionsEl.style.display = hasHeadache ? 'block' : 'none';
      }
    );

    // 痛む場所のレンダリング
    renderBtnGroup(
      data.painPlaces,
      painPlacesEl,
      currentEntry.painPlaces
    );

    // 痛みの種類のレンダリング
    renderBtnGroup(
      data.painTypes,
      painTypesEl,
      currentEntry.painType,
      false,
      () => {
        // 「その他」が選択されたらテキスト入力を表示
        const otherSelected = currentEntry.painType[0] === 'その他';
        painTypeOtherEl.style.display = otherSelected ? 'block' : 'none';
        if (otherSelected) painTypeOtherEl.focus();
      }
    );

    // 行動のレンダリング
    renderBtnGroup(
      data.activities,
      activitiesEl,
      currentEntry.activities
    );

    // 履歴のレンダリング
    renderHistory();
  }


  // ボタングループをレンダリングする関数
  function renderBtnGroup(list, $parent, selectedArr, multi = true, onSelect = null) {
    $parent.innerHTML = "";
    list.forEach((txt, i) => {
      const btn = document.createElement('button');
      btn.type = "button";
      btn.className = "btn-option" + (selectedArr.includes(txt) ? " selected" : "");
      btn.textContent = txt;
      btn.onclick = () => {
        if (multi) {
          const idx = selectedArr.indexOf(txt);
          if (idx === -1) selectedArr.push(txt);
          else selectedArr.splice(idx,1);
        } else {
          selectedArr.length = 0; 
          selectedArr.push(txt);
        }
        render();
        if(onSelect) onSelect();
      };
      $parent.appendChild(btn);
    });
  }

  // 履歴をレンダリングする関数
  function renderHistory() {
    if (data.logs.length === 0) {
      historyEl.innerHTML = '<p>記録がありません</p>';
      return;
    }

    // 並び順を取得
    const sortOrder = document.getElementById('sort-order').value;
    
    // ログのコピーを作成してソート
    const sortedLogs = [...data.logs];
    if (sortOrder === 'newest') {
      sortedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else {
      sortedLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    let html = '';
    sortedLogs.forEach((log) => {
      const date = new Date(log.timestamp).toLocaleString();
      const originalIndex = data.logs.indexOf(log);
      
      html += `
        <div class="history-item">
          <div class="history-header">
            <span class="history-date">${date}</span>
            <button class="btn-delete" data-index="${originalIndex}">削除</button>
          </div>
          <div class="history-content">
            <p><strong>主症状：</strong>${log.mainSymptoms.join(', ')}</p>
            ${log.painPlaces.length > 0 ? `<p><strong>痛む場所：</strong>${log.painPlaces.join(', ')}</p>` : ''}
            ${log.painType.length > 0 ? `<p><strong>痛みの種類：</strong>${log.painType[0]}${log.painTypeOther ? ` (${log.painTypeOther})` : ''}</p>` : ''}
            <p><strong>行動：</strong>${log.activities.join(', ')}</p>
            ${log.activityOther ? `<p><strong>メモ：</strong>${log.activityOther}</p>` : ''}
          </div>
        </div>
      `;
    });

    historyEl.innerHTML = html;
  }

  // フォーム送信ハンドラー
  function handleSubmit(e) {
    e.preventDefault();
    
    if (currentEntry.mainSymptoms.length === 0) {
      alert('少なくとも1つ以上の主症状を選択してください');
      return;
    }

    // エントリーにタイムスタンプを追加
    currentEntry.timestamp = new Date().toISOString();
    
    // ログに追加
    data.logs.push({...currentEntry});
    
    // ローカルストレージに保存
    saveData();
    
    // フォームをリセット
    resetForm();
    
    // 再レンダリング
    render();
    
    alert('記録が保存されました');
  }

  // データをローカルストレージに保存
  function saveData() {
    localStorage.setItem('healthLogData', JSON.stringify(data));
  }

  // フォームをリセット
  function resetForm() {
    currentEntry = {
      mainSymptoms: [],
      painPlaces: [],
      painType: [],
      activities: [],
      activityOther: '',
      painTypeOther: '',
      timestamp: null
    };
    activityOtherEl.value = '';
    painTypeOtherEl.value = '';
  }



  // ログを削除
  function deleteLog(index) {
    if (confirm('この記録を削除しますか？')) {
      data.logs.splice(index, 1);
      saveData();
      render();
    }
  }

  // 新しい主症状を追加
  function addMainSymptom() {
    const input = document.getElementById('add-main-symptom');
    const value = input.value.trim();
    if (value && !data.mainSymptoms.includes(value)) {
      data.mainSymptoms.push(value);
      saveData();
      input.value = '';
      render();
    }
  }

  // 新しい痛む場所を追加
  function addPainPlace() {
    const input = document.getElementById('add-pain-place');
    const value = input.value.trim();
    if (value && !data.painPlaces.includes(value)) {
      data.painPlaces.push(value);
      saveData();
      input.value = '';
      render();
    }
  }

  // 新しい痛みの種類を追加
  function addPainType() {
    const input = document.getElementById('add-pain-type');
    const value = input.value.trim();
    if (value && !data.painTypes.includes(value)) {
      data.painTypes.push(value);
      saveData();
      input.value = '';
      render();
    }
  }

  // 新しい行動を追加
  function addActivity() {
    const input = document.getElementById('add-activity');
    const value = input.value.trim();
    if (value && !data.activities.includes(value)) {
      data.activities.push(value);
      saveData();
      input.value = '';
      render();
    }
  }
});
