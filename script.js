// ---------- SETTINGS (from your NocoDB address) ----------
var NOCODB_URL = 'https://app.nocodb.com';
var BASE_ID    = 'prb0yi6j5sx9g0z';
var TABLE_ID   = 'mmaxa383947cc7m';
var API_TOKEN  = 'nc_pat_qF9lh8U7YuABuBZPbSmCLXQlqF9RJROOPmVljNqX';   // starts with nc_pat_
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
