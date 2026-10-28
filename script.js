var NOCODB_URL = 'https://app.nocodb.com/w29f6g8m';
var BASE_ID    = 'prb0yi6j5sx9g0z';
var TABLE_ID   = 'mmaxa383947cc7m';
var API_TOKEN  = 'nc_pat_qF9lh8U7YuABuBZPbSmCLXQlqF9RJROOPmVljNqX';
 
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
 
// 1. Fetch one page of records; follow the "next" link until all are loaded
function fetchAll(url, all) {
  return fetch(url, { headers: { 'xc-token': API_TOKEN } })
    .then(function (res) {
      if (!res.ok) throw new Error('NocoDB replied with status ' + res.status);
      return res.json();
    })
    .then(function (json) {
      all = all.concat(json.records || []);
      if (json.next) { return fetchAll(json.next, all); }
      return all;
    });
}
 
function loadData() {
  if (BASE_ID.indexOf('PASTE_') === 0 || TABLE_ID.indexOf('PASTE_') === 0 ||
      API_TOKEN.indexOf('PASTE_') === 0) {
    showError('Open script.js and paste your Base ID, Table ID and API token.');
    return;
  }
  var url = NOCODB_URL + '/api/v3/data/' + BASE_ID + '/' + TABLE_ID + '/records';
 
  fetchAll(url, [])
    .then(function (records) {
      if (records.length === 0) { showError('The table has no records.'); return; }
 
      // each record is { id: 1, fields: { 'Roll No': '101', ... } }
      var list = records.map(function (r) { return r.fields || r; });
 
      headers = Object.keys(list[0]).filter(function (h) {
        var l = h.toLowerCase();
        return l !== 'id' && l !== 'createdat' && l !== 'updatedat';
      });
      rows = list.map(function (o) {
        return headers.map(function (h) { return o[h]; });
      });
 
      statusEl.textContent = '';
      statusEl.className = '';
      drawHead();
      render();
    })
    .catch(function (err) {
      showError('Could not load data. ' + err.message +
        '. Check the Base ID, Table ID and token.');
      console.error(err);
    });
}
 
// 2. Draw the table heading; clicking a heading sorts that column
function drawHead() {
  var tr = document.createElement('tr');
  headers.forEach(function (h, i) {
    var th = document.createElement('th');
    th.textContent = h;
    th.addEventListener('click', function () {
      if (sortCol === i) { sortAsc = !sortAsc; }
      else { sortCol = i; sortAsc = true; }
      render();
    });
    tr.appendChild(th);
  });
  thead.innerHTML = '';
  thead.appendChild(tr);
}
 
// 3. Filter, sort and draw the rows
function render() {
  var q = searchBox.value.trim().toLowerCase();
 
  // search the columns whose heading contains "roll" or "name"
  var searchCols = [];
  headers.forEach(function (h, i) {
    var l = h.toLowerCase();
    if (l.indexOf('roll') !== -1 || l.indexOf('name') !== -1) searchCols.push(i);
  });
  if (searchCols.length === 0) {
    searchCols = headers.map(function (h, i) { return i; });
  }
 
  var list = rows.filter(function (r) {
    if (!q) return true;
    return searchCols.some(function (i) {
      return String(r[i]).toLowerCase().indexOf(q) !== -1;
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
