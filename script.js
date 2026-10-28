// ---------- SETTINGS (from your NocoDB address) ----------
var NOCODB_URL = 'https://app.nocodb.com';
var BASE_ID    = 'prb0yi6j5sx9g0z';
var TABLE_ID   = 'mmaxa383947cc7m';
var API_TOKEN  = 'PASTE_YOUR_NEW_TOKEN_HERE';   // starts with nc_pat_
// ---------------------------------------------------------

var headers = [];      // column names
var rows = [];         // one array of values per student
var sortCol = -1;
var sortAsc = true;

var statusEl  = document.getElementById('status');
var countEl   = document.getElementById('count');
var thead     = document.getElementById('thead');
var tbody     = document.getElementById('tbody');
var searchBox = document.getElementById('searchBox');

function showError(msg) {
  statusEl.className = 'err';
  statusEl.textContent = msg;
}

function getJson(url) {
  return fetch(url, { headers: { 'xc-token': API_TOKEN } })
    .then(function (res) {
      return res.text().then(function (text) {
        if (!res.ok) {
          throw new Error('NocoDB replied with status ' + res.status + ': ' + text.substring(0, 150));
        }
        return JSON.parse(text);
      });
    });
}

// Newer API (v3): { records: [ {id, fields:{...}} ], next: "url" or null }
function loadV3(url, all) {
  return getJson(url).then(function (json) {
    var recs = (json.records || []).map(function (r) { return r.fields || r; });
    all = all.concat(recs);
    if (json.next) { return loadV3(json.next, all); }
    return all;
  });
}

// Older API (v2): { list: [ {...} ], pageInfo: { isLastPage: bool } }
function loadV2(offset, all) {
  var url = NOCODB_URL + '/api/v2/tables/' + TABLE_ID + '/records?limit=100&offset=' + offset;
  return getJson(url).then(function (json) {
    var recs = json.list || [];
    all = all.concat(recs);
    var last = !json.pageInfo || json.pageInfo.isLastPage || recs.length === 0;
    if (last) { return all; }
    return loadV2(offset + 100, all);
  });
}

function loadData() {
  statusEl.className = '';
  statusEl.textContent = 'Loading...';

  var v3Url = NOCODB_URL + '/api/v3/data/' + BASE_ID + '/' + TABLE_ID + '/records?pageSize=100';

  loadV3(v3Url, [])
    .catch(function (err) {
      console.warn('v3 failed, trying v2:', err);
      return loadV2(0, []);
    })
    .then(function (records) {
      if (!records.length) {
        showError('Connected, but the table has no records.');
        return;
      }
      // Column names come from the first record, skipping NocoDB system fields
      headers = Object.keys(records[0]).filter(function (k) {
        return k !== 'Id' && k !== 'id' && k !== 'CreatedAt' && k !== 'UpdatedAt';
      });
      rows = records.map(function (rec) {
        return headers.map(function (h) { return rec[h]; });
      });

      thead.innerHTML = '';
      var tr = document.createElement('tr');
      headers.forEach(function (h, i) {
        var th = document.createElement('th');
        th.textContent = h;
        th.style.cursor = 'pointer';
        th.addEventListener('click', function () {
          if (sortCol === i) { sortAsc = !sortAsc; } else { sortCol = i; sortAsc = true; }
          render();
        });
        tr.appendChild(th);
      });
      thead.appendChild(tr);

      statusEl.textContent = '';
      render();
    })
    .catch(function (err) {
      console.error(err);
      showError('Could not load data. ' + err.message);
    });
}

function render() {
  var q = searchBox.value.trim().toLowerCase();

  var list = rows.filter(function (r) {
    if (!q) { return true; }
    return r.some(function (v) {
      return String(v === null || v === undefined ? '' : v).toLowerCase().indexOf(q) !== -1;
    });
  });

  if (sortCol >= 0) {
    list.sort(function (a, b) {
      var x = a[sortCol], y = b[sortCol];
      var nx = parseFloat(x), ny = parseFloat(y);
      var r = (!isNaN(nx) && !isNaN(ny))
              ? nx - ny
              : String(x).localeCompare(String(y));
      return sortAsc ? r : -r;
    });
  }

  tbody.innerHTML = '';
  list.forEach(function (r) {
    var tr = document.createElement('tr');
    r.forEach(function (v, i) {
      var td = document.createElement('td');
      td.textContent = (v === null || v === undefined) ? '' : v;
      td.setAttribute('data-label', headers[i]);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  countEl.textContent = 'Showing ' + list.length + ' of ' + rows.length + ' students';
}

searchBox.addEventListener('input', render);
loadData();
