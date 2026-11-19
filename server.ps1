# Yozma - local server for the multi-campaign platform: static site + data API + back office
# Run: powershell -ExecutionPolicy Bypass -File server.ps1 [-Port 8766]
# NOTE: keep this file ASCII-only (Windows PowerShell 5.1 reads it as ANSI). User-facing text lives in the JS files.
param([int]$Port = 8766)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Web.Extensions

$root = $PSScriptRoot
$dataDir = Join-Path $root 'data'
$uploadDir = Join-Path $root 'uploads'
$dbPath = Join-Path $dataDir 'db.json'
$adminPath = Join-Path $dataDir 'admin.json'
foreach ($d in @($dataDir, $uploadDir)) { if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d | Out-Null } }

$js = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$js.MaxJsonLength = [int]::MaxValue
$js.RecursionLimit = 256
$utf8 = New-Object System.Text.UTF8Encoding $false
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()

function NowMs { [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() }
function RandHex([int]$n) { $b = New-Object byte[] $n; $rng.GetBytes($b); -join ($b | ForEach-Object { $_.ToString('x2') }) }
function WriteFileSafe($path, $text) {
  $tmp = "$path.tmp"
  [IO.File]::WriteAllText($tmp, $text, $utf8)
  if (Test-Path $path) { [IO.File]::Replace($tmp, $path, [NullString]::Value) } else { [IO.File]::Move($tmp, $path) }
}

# ---------- database ----------
# db.json = { platform: {...}, campaigns: [ {id, status, ...campaign config} ], donations: [ {campaignId, ...} ] }
# campaign status: live = published | pending = waiting for platform approval | hidden = not shown on the site
$db = $null
if (Test-Path $dbPath) { $db = $js.DeserializeObject([IO.File]::ReadAllText($dbPath, $utf8)) }
function Valid-Db($n) { ($n -is [System.Collections.IDictionary]) -and ($n['platform'] -is [System.Collections.IDictionary]) -and ($null -ne $n['campaigns']) -and ($null -ne $n['donations']) }
function SaveDb { WriteFileSafe $dbPath ($js.Serialize($db)) }
function Has($d, $k) { if ($null -eq $d -or $d -isnot [System.Collections.IDictionary]) { return $false }; return $null -ne $d[$k] }
function Num($v) { if ($null -eq $v -or "$v" -eq '') { 0 } else { [double]$v } }
function Get-Camp([string]$id) { foreach ($c in $db['campaigns']) { if ($c['id'] -eq $id) { return $c } }; return $null }
function Camp-Index([string]$id) { $a = @($db['campaigns']); for ($i = 0; $i -lt $a.Count; $i++) { if ($a[$i]['id'] -eq $id) { return $i } }; return -1 }

function Get-Status($c) {
  $now = NowMs
  if ((Has $c 'startsAt') -and $now -lt (Num $c['startsAt'])) { return 'upcoming' }
  if ((Has $c 'endsAt') -and $now -ge (Num $c['endsAt'])) { return 'ended' }
  return 'live'
}
function Get-Raised($c) {
  $sum = Num $c['baseRaised']
  foreach ($d in $db['donations']) { if ($d['campaignId'] -eq $c['id'] -and $d['status'] -eq 'paid') { $sum += Num $d['credited'] } }
  return $sum
}
function Count-Paid($c) { $n = 0; foreach ($d in $db['donations']) { if ($d['campaignId'] -eq $c['id'] -and $d['status'] -eq 'paid') { $n++ } }; $n }
function Get-Credit($c, [double]$base) {
  $mult = Num $c['multiplier']
  if ((Get-Status $c) -ne 'live' -or $mult -le 1) { return $base }
  $room = [Math]::Max(0, (Num $c['goal']) - (Get-Raised $c) - $base)
  return $base + [Math]::Min($base * ($mult - 1), $room)
}

# ---------- admin auth ----------
# sessions are keyed by SHA-256 of the cookie token, so sessions.json never holds a usable token.
$sessionsPath = Join-Path $dataDir 'sessions.json'
$sessions = @{}
$script:fails = 0; $script:lockUntil = 0
function TokKey([string]$t) {
  $h = [System.Security.Cryptography.SHA256]::Create()
  try { -join ($h.ComputeHash([Text.Encoding]::UTF8.GetBytes($t)) | ForEach-Object { $_.ToString('x2') }) } finally { $h.Dispose() }
}
function Save-Sessions {
  $keep = @{}; $now = NowMs
  foreach ($k in @($sessions.Keys)) {
    $s = $sessions[$k]
    if ($s['exp'] -lt $now) { $sessions.Remove($k) } elseif ($s['remember']) { $keep[$k] = $s }
  }
  WriteFileSafe $sessionsPath ($js.Serialize($keep))
}
if (Test-Path $sessionsPath) {
  try {
    $saved = $js.DeserializeObject([IO.File]::ReadAllText($sessionsPath, $utf8))
    foreach ($k in $saved.Keys) {
      $v = $saved[$k]
      if ((Num $v['exp']) -gt (NowMs)) { $sessions[$k] = @{ exp = [int64](Num $v['exp']); uid = [string]$v['uid']; remember = $true } }
    }
  } catch { Write-Host 'sessions.json unreadable - ignored' }
}
function Hash-Pw([string]$pw, [byte[]]$salt) {
  $k = New-Object System.Security.Cryptography.Rfc2898DeriveBytes($pw, $salt, 120000, [System.Security.Cryptography.HashAlgorithmName]::SHA256)
  [Convert]::ToBase64String($k.GetBytes(32))
}
# users: data/admin.json = { users: [ { id, username, name, role, campaigns: [ids], salt, hash } ] }
#   admin   = platform manager: everything, all campaigns, platform settings, users
#   manager = campaign manager: full access to the campaigns listed in "campaigns"
#   viewer  = authorized viewer: read-only access to the campaigns listed in "campaigns"
$ROLES = @('admin', 'manager', 'viewer')
function Load-Users {
  if (-not (Test-Path $adminPath)) { return ,(New-Object System.Collections.ArrayList) }
  $rec = $js.DeserializeObject([IO.File]::ReadAllText($adminPath, $utf8))
  $list = New-Object System.Collections.ArrayList
  foreach ($u in @($rec['users'])) { if ($u) { [void]$list.Add($u) } }
  return ,$list
}
function Save-Users($list) { WriteFileSafe $adminPath ($js.Serialize(@{ users = $list.ToArray() })) }
function New-PwFields([string]$pw) {
  $salt = New-Object byte[] 16; $rng.GetBytes($salt)
  return @{ salt = [Convert]::ToBase64String($salt); hash = (Hash-Pw $pw $salt) }
}
function Test-UserPw($u, [string]$pw) {
  if (-not $u) { return $false }
  $h = Hash-Pw $pw ([Convert]::FromBase64String($u['salt']))
  $a = [Text.Encoding]::ASCII.GetBytes($h); $b = [Text.Encoding]::ASCII.GetBytes($u['hash'])
  if ($a.Length -ne $b.Length) { return $false }
  $diff = 0; for ($i = 0; $i -lt $a.Length; $i++) { $diff = $diff -bor ($a[$i] -bxor $b[$i]) }
  return $diff -eq 0
}
function Find-User($list, [string]$key, [string]$by = 'username') {
  foreach ($u in $list) { if ("$($u[$by])" -ieq $key) { return $u } }
  return $null
}
function User-Camps($u) { $o = New-Object System.Collections.ArrayList; foreach ($x in @($u['campaigns'])) { if ($x) { [void]$o.Add([string]$x) } }; return ,$o }
function Public-User($u) { @{ id = $u['id']; username = $u['username']; name = $u['name']; role = $u['role']; campaigns = (User-Camps $u).ToArray() } }
function Count-Admins($list) { $n = 0; foreach ($u in $list) { if ($u['role'] -eq 'admin') { $n++ } }; $n }
function Can-See($me, [string]$cid) { if ($me['role'] -eq 'admin') { return $true }; return (User-Camps $me) -contains $cid }
function Can-Edit($me, [string]$cid) { if ($me['role'] -eq 'admin') { return $true }; return $me['role'] -eq 'manager' -and ((User-Camps $me) -contains $cid) }
function New-Session($res, $u, [bool]$remember = $false) {
  $tok = RandHex 32
  $life = $(if ($remember) { 30 * 24 * 3600000 } else { 12 * 3600000 })
  $sessions[(TokKey $tok)] = @{ exp = (NowMs) + $life; uid = $u['id']; remember = $remember }
  $cookie = "ysid=$tok; HttpOnly; SameSite=Strict; Path=/"
  if ($remember) { $cookie += '; Max-Age=2592000'; Save-Sessions }
  $res.Headers.Add('Set-Cookie', $cookie)
}
function End-UserSessions([string]$uid, [string]$keep = '') {
  $keepKey = $(if ($keep) { TokKey $keep } else { '' })
  foreach ($k in @($sessions.Keys)) { if ($sessions[$k]['uid'] -eq $uid -and $k -ne $keepKey) { $sessions.Remove($k) } }
  Save-Sessions
}
function Get-SessionUser($req) {
  $c = $req.Cookies['ysid']
  if (-not $c) { return $null }
  $key = TokKey $c.Value
  $s = $sessions[$key]
  if (-not $s -or $s['exp'] -lt (NowMs)) { if ($s) { $sessions.Remove($key); if ($s['remember']) { Save-Sessions } }; return $null }
  return Find-User (Load-Users) $s['uid'] 'id'
}
$validUsername = '^[A-Za-z0-9._-]{3,32}$'
$validId = '^[a-z0-9][a-z0-9-]{1,40}$'

# ---------- http helpers ----------
function Send($res, [int]$code, $obj) {
  $bytes = $utf8.GetBytes($js.Serialize($obj))
  $res.StatusCode = $code
  $res.ContentType = 'application/json; charset=utf-8'
  $res.Headers.Add('Cache-Control', 'no-store')
  $res.OutputStream.Write($bytes, 0, $bytes.Length)
}
function Fail($res, [int]$code, [string]$msg) { Send $res $code @{ ok = $false; error = $msg } }
function Read-Body($req) {
  if ($req.ContentLength64 -gt 15MB) { throw 'too-large' }
  $sr = New-Object IO.StreamReader($req.InputStream, $utf8)
  $txt = $sr.ReadToEnd(); $sr.Close()
  if (-not $txt) { return @{} }
  $o = $js.DeserializeObject($txt)
  if ($o -isnot [System.Collections.IDictionary]) { throw 'bad-json' }
  return $o
}
function Str($d, $k, [int]$max = 500) { if (Has $d $k) { $s = "$($d[$k])".Trim(); if ($s.Length -gt $max) { $s.Substring(0, $max) } else { $s } } else { '' } }
function Bi([string]$s) { @{ he = $s; en = $s } }
function Arr { return ,(New-Object System.Collections.ArrayList) }

$mime = @{ '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'; '.js' = 'application/javascript; charset=utf-8'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.webp' = 'image/webp'; '.gif' = 'image/gif'; '.svg' = 'image/svg+xml'; '.ico' = 'image/x-icon'; '.mp4' = 'video/mp4'; '.woff2' = 'font/woff2' }
$rootFull = [IO.Path]::GetFullPath($root).TrimEnd('\') + '\'

function Serve-Static($req, $res) {
  $p = [Uri]::UnescapeDataString($req.Url.AbsolutePath.TrimStart('/'))
  if ($p -eq '') { $p = 'index.html' }
  if ($p -eq 'admin' -or $p -eq 'admin/') { $p = 'admin.html' }
  $ext = [IO.Path]::GetExtension($p).ToLower()
  if ($p -match '^(data|\.)' -or $p -match '[\\/]\.' -or -not $mime.ContainsKey($ext)) { $res.StatusCode = 404; return }
  $file = [IO.Path]::GetFullPath((Join-Path $root $p))
  if (-not $file.StartsWith($rootFull) -or -not (Test-Path $file -PathType Leaf)) { $res.StatusCode = 404; return }
  $res.ContentType = $mime[$ext]
  if ($ext -in '.html', '.js', '.css') { $res.Headers.Add('Cache-Control', 'no-cache') }
  if ($req.HttpMethod -eq 'HEAD') { return }
  $bytes = [IO.File]::ReadAllBytes($file)
  $res.OutputStream.Write($bytes, 0, $bytes.Length)
}

# ---------- public API ----------
function Public-Campaign($c) {
  $pc = @{}
  foreach ($k in $c.Keys) { if ($k -ne 'applicant') { $pc[$k] = $c[$k] } }
  # NOTE: never use Where-Object on data that gets serialized - it wraps items and breaks JavaScriptSerializer
  $tl = Arr
  foreach ($t in @($c['teams'])) { if ($t -and $t['status'] -ne 'pending' -and $t['status'] -ne 'hidden') { [void]$tl.Add($t) } }
  $pc['teams'] = $tl.ToArray()
  return $pc
}
function Public-Data {
  $camps = Arr; $ids = @{}
  foreach ($c in $db['campaigns']) { if ($c['status'] -eq 'live') { [void]$camps.Add((Public-Campaign $c)); $ids[$c['id']] = $true } }
  $list = Arr
  foreach ($d in $db['donations']) {
    if ($d['status'] -ne 'paid' -or -not $ids.ContainsKey($d['campaignId'])) { continue }
    $anon = [bool]$d['anon']
    [void]$list.Add(@{
      id = $d['id']; campaignId = $d['campaignId']; name = $(if ($anon) { '' } else { $d['name'] }); anon = $anon
      amount = $d['amount']; cur = $d['cur']; months = $d['months']; baseIls = $d['baseIls']; credited = $d['credited']
      teamId = $d['teamId']; dedicationId = $d['dedicationId']; dedication = $d['dedication']
      message = $(if ($d['hideMessage']) { '' } else { $d['message'] }); date = $d['date']
    })
  }
  return @{ ok = $true; platform = $db['platform']; campaigns = $camps.ToArray(); donations = $list.ToArray(); now = (NowMs) }
}

# Israeli ID (teudat zehut) check digit. Returns the 9-digit id, or '' if invalid.
function Clean-IsraeliId($v) {
  $s = ([string]$v) -replace '[\s-]', ''
  if ($s -notmatch '^\d{5,9}$') { return '' }
  $id = $s.PadLeft(9, '0')
  if ($id -match '^0+$') { return '' }
  $sum = 0
  for ($i = 0; $i -lt 9; $i++) { $d = [int]([string]$id[$i]) * ($i % 2 + 1); if ($d -gt 9) { $d -= 9 }; $sum += $d }
  if ($sum % 10 -eq 0) { return $id } else { return '' }
}
function Phone-Ok([string]$phone) {
  $digits = $phone -replace '\D', ''
  return ($phone -match '^\+?[\d\s\-().]+$') -and $digits.Length -ge 9 -and $digits.Length -le 15
}

function Api-Donate($req, $res) {
  $b = Read-Body $req
  $c = Get-Camp (Str $b 'campaignId' 60)
  if (-not $c -or $c['status'] -ne 'live') { return Fail $res 404 'campaign' }
  $cur = $(if ($b['cur'] -eq 'USD') { 'USD' } else { 'ILS' })
  $rate = $(if ($cur -eq 'USD') { Num $c['usdRate'] } else { 1 })
  $amount = [Math]::Floor((Num $b['amount']))
  $months = [int](Num $b['months'])
  if ($months -notin 1, 12, 24, 36) { $months = 1 }
  $name = Str $b 'name' 80; $email = Str $b 'email' 120
  $baseIls = $amount * $months * $rate
  if ($baseIls -lt 10 -or $amount -gt 10000000) { return Fail $res 400 'amount' }
  if (-not $name) { return Fail $res 400 'name' }
  if ($email -notmatch '^\S+@\S+\.\S+$') { return Fail $res 400 'email' }
  # phone is required: 9-15 digits, may include spaces, dashes, brackets and a leading +
  $phone = Str $b 'phone' 30
  if (-not (Phone-Ok $phone)) { return Fail $res 400 'phone' }
  # ID number is collected only while the org has section 46 approval; never shown on the public site
  $idNumber = ''
  if ($c['section46'] -eq $true -and (Str $b 'idNumber' 12)) {
    $idNumber = Clean-IsraeliId (Str $b 'idNumber' 12)
    if (-not $idNumber) { return Fail $res 400 'idnum' }
  }
  $dedId = Str $b 'dedicationId' 40
  if ($dedId) {
    $ded = $null; foreach ($x in @($c['dedications'])) { if ($x['id'] -eq $dedId) { $ded = $x; break } }
    if (-not $ded) { return Fail $res 400 'dedication' }
    $used = Num $ded['taken']
    foreach ($d in $db['donations']) { if ($d['campaignId'] -eq $c['id'] -and $d['status'] -eq 'paid' -and $d['dedicationId'] -eq $dedId) { $used++ } }
    if ($used -ge (Num $ded['total'])) { return Fail $res 409 'dedication-taken' }
    if ($baseIls -lt (Num $ded['amount']) - $rate * $months) { return Fail $res 400 'dedication-amount' }
  }
  $teamId = Str $b 'teamId' 40
  if ($teamId) { $ok = $false; foreach ($tm in @($c['teams'])) { if ($tm['id'] -eq $teamId -and $tm['status'] -ne 'pending' -and $tm['status'] -ne 'hidden') { $ok = $true } }; if (-not $ok) { $teamId = '' } }

  $credited = [Math]::Round((Get-Credit $c $baseIls), 2)
  $now = NowMs
  $don = @{
    id = 'd' + $now + (RandHex 3); campaignId = $c['id']; date = $now; createdAt = $now; source = 'online'; method = 'card'; status = 'paid'
    name = $name; email = $email; phone = $phone; idNumber = $idNumber
    amount = $amount; cur = $cur; months = $months; baseIls = $baseIls; credited = $credited
    teamId = $teamId; dedicationId = $dedId; dedication = (Str $b 'dedication' 120)
    plaqueStatus = $(if ($dedId) { 'new' } else { '' }); plaqueText = ''
    message = (Str $b 'message' 140); anon = [bool]$b['anon']; hideMessage = $false
    wantsReceipt = [bool]$b['receipt']; receiptSent = $false; notes = ''; demo = $false
  }
  $db['donations'] = @($db['donations']) + $don
  SaveDb
  Send $res 200 @{ ok = $true; id = $don['id'] }
}

function Api-NewTeam($req, $res) {
  $b = Read-Body $req
  $c = Get-Camp (Str $b 'campaignId' 60)
  if (-not $c -or $c['status'] -ne 'live') { return Fail $res 404 'campaign' }
  $leader = Str $b 'leader' 60; $name = Str $b 'name' 80; $goal = [Math]::Floor((Num $b['goal']))
  if (-not $leader -or -not $name -or $goal -lt 1000) { return Fail $res 400 'fields' }
  $approve = (Has $c 'settings') -and [bool]$c['settings']['approveTeams']
  $tm = @{ id = 'u' + (NowMs) + (RandHex 2); name = (Bi $name); leader = (Bi $leader); goal = $goal; raised = 0; donors = 0
           status = $(if ($approve) { 'pending' } else { 'approved' }); email = (Str $b 'email' 120); createdAt = (NowMs) }
  $c['teams'] = @($c['teams']) + $tm
  SaveDb
  Send $res 200 @{ ok = $true; team = $tm }
}

# a nonprofit asks to open a campaign -> a full campaign with status "pending", for the platform admin to approve
function Api-Apply($req, $res) {
  $b = Read-Body $req
  $pending = 0; foreach ($c in $db['campaigns']) { if ($c['status'] -eq 'pending') { $pending++ } }
  if ($pending -ge 50) { return Fail $res 429 'too-many' }
  $org = Str $b 'orgName' 80; $orgNum = Str $b 'orgNumber' 9; $title = Str $b 'title' 70; $short = Str $b 'short' 140
  $story = Str $b 'story' 5000; $goal = [Math]::Floor((Num $b['goal'])); $mult = [int](Num $b['multiplier'])
  $cname = Str $b 'contactName' 60; $cphone = Str $b 'contactPhone' 30; $cemail = Str $b 'contactEmail' 120
  if (-not $org -or $orgNum -notmatch '^\d{9}$' -or -not $title -or -not $short -or $story.Length -lt 30 -or $goal -lt 1000) { return Fail $res 400 'fields' }
  if (-not $cname -or -not (Phone-Ok $cphone) -or $cemail -notmatch '^\S+@\S+\.\S+$') { return Fail $res 400 'contact' }
  if ($mult -notin 1, 2, 3) { $mult = 2 }
  $start = Num $b['startsAt']; $end = Num $b['endsAt']
  if ($start -le 0) { $start = (NowMs) + 86400000 }
  if ($end -le $start) { $end = $start + 36 * 3600000 }
  $cat = Str $b 'category' 30
  $colors = Arr; foreach ($x in @($b['colors'])) { if ("$x" -match '^#[0-9a-fA-F]{6}$') { [void]$colors.Add("$x") } }
  if ($colors.Count -lt 2) { $colors = Arr; [void]$colors.Add('#1e3a8a'); [void]$colors.Add('#3b82f6') }
  $paras = Arr; foreach ($p in ($story -split '\r?\n\s*\r?\n')) { if ($p.Trim()) { [void]$paras.Add($p.Trim()) } }
  $c = @{
    id = 'c' + (RandHex 4); status = 'pending'; category = $cat; logo = ''; createdAt = (NowMs)
    cover = @{ emoji = (Str $b 'emoji' 8); colors = $colors.ToArray() }
    name = (Bi $title); shortName = (Bi $org); tagline = (Bi $short); short = (Bi $short); location = (Bi '')
    orgName = (Bi $org); orgNumber = $orgNum; section46 = ($b['section46'] -eq $true)
    theme = 'classic'; progressStyle = 'bar'; hideGoal = $false; fonts = 'classic'; a11y = @{}
    goal = $goal; baseRaised = 0; baseDonors = 0; multiplier = $mult; startsAt = $start; endsAt = $end; usdRate = (Num $db['platform']['usdRate'])
    videoUrl = ''; contact = @{ phone = $cphone; email = $cemail; address = (Bi ''); bank = (Bi '') }
    applicant = @{ name = $cname; phone = $cphone; email = $cemail }
    story = @{ he = $paras.ToArray(); en = @() }
    milestones = @(); stretch = @(); impact = @(); dedications = @(); matchers = @(); teams = @(); gallery = @(); faq = @()
    raffle = @{ enabled = $false; ticketPrice = 360; drawDate = (Bi ''); prizes = @(); winners = @() }; settings = @{ approveTeams = $true }
  }
  $db['campaigns'] = @($db['campaigns']) + $c
  SaveDb
  Send $res 200 @{ ok = $true }
}

# ---------- admin API ----------
function Camp-Summary($c, $me) {
  $s = @{ id = $c['id']; status = $c['status']; name = $c['name']; shortName = $c['shortName']; orgName = $c['orgName']; category = $c['category']
          cover = $c['cover']; logo = $c['logo']; goal = $c['goal']; startsAt = $c['startsAt']; endsAt = $c['endsAt']; createdAt = $c['createdAt']
          raised = (Get-Raised $c); donations = (Count-Paid $c); phase = (Get-Status $c) }
  if ($me['role'] -eq 'admin') { $s['applicant'] = $c['applicant'] }
  return $s
}
function Api-Admin($req, $res, [string]$path, [string]$method) {
  if ($path -eq 'status') {
    $me = Get-SessionUser $req
    return Send $res 200 @{ ok = $true; setup = -not (Test-Path $adminPath); loggedIn = ($null -ne $me); user = $(if ($me) { Public-User $me } else { $null }) }
  }
  if ($path -eq 'setup' -and $method -eq 'POST') {
    if (Test-Path $adminPath) { return Fail $res 403 'already-setup' }
    $b = Read-Body $req
    $pw = Str $b 'password' 200
    $un = Str $b 'username' 32; if ($un -eq '') { $un = 'admin' }
    if ($un -notmatch $validUsername) { return Fail $res 400 'username' }
    if ($pw.Length -lt 8) { return Fail $res 400 'weak' }
    if ($null -eq $db) {
      if (-not (Valid-Db $b['db'])) { return Fail $res 400 'db' }
      $script:db = $b['db']; SaveDb
    }
    $u = New-PwFields $pw
    $u['id'] = 'u' + (RandHex 4); $u['username'] = $un; $u['name'] = (Str $b 'name' 60); $u['role'] = 'admin'; $u['campaigns'] = @(); $u['updatedAt'] = NowMs
    $list = New-Object System.Collections.ArrayList; [void]$list.Add($u); Save-Users $list
    New-Session $res $u
    return Send $res 200 @{ ok = $true }
  }
  if ($path -eq 'login' -and $method -eq 'POST') {
    if ((NowMs) -lt $script:lockUntil) { return Fail $res 429 'locked' }
    $b = Read-Body $req
    $u = Find-User (Load-Users) (Str $b 'username' 32)
    if ($u -and (Test-UserPw $u (Str $b 'password' 200))) { $script:fails = 0; New-Session $res $u ($b['remember'] -eq $true); return Send $res 200 @{ ok = $true } }
    $script:fails++
    if ($script:fails -ge 5) { $script:lockUntil = (NowMs) + 60000; $script:fails = 0 }
    return Fail $res 401 'wrong'
  }
  $me = Get-SessionUser $req
  if (-not $me) { return Fail $res 401 'auth' }
  $isAdmin = $me['role'] -eq 'admin'
  $cid = "$($req.QueryString['c'])"

  switch -regex ($path) {
    '^logout$' {
      $sessions.Remove((TokKey $req.Cookies['ysid'].Value)); Save-Sessions
      $res.Headers.Add('Set-Cookie', 'ysid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')
      return Send $res 200 @{ ok = $true }
    }
    '^password$' {
      $b = Read-Body $req
      if (-not (Test-UserPw $me (Str $b 'current' 200))) { return Fail $res 401 'wrong' }
      $new = Str $b 'password' 200
      if ($new.Length -lt 8) { return Fail $res 400 'weak' }
      $list = Load-Users; $u = Find-User $list $me['id'] 'id'
      $f = New-PwFields $new; $u['salt'] = $f['salt']; $u['hash'] = $f['hash']; $u['updatedAt'] = NowMs
      Save-Users $list; End-UserSessions $me['id'] $req.Cookies['ysid'].Value
      return Send $res 200 @{ ok = $true }
    }
    # ----- campaigns list (each user sees only their campaigns; the platform admin sees all) -----
    '^campaigns$' {
      if ($method -eq 'GET') {
        $out = Arr
        foreach ($c in $db['campaigns']) { if (Can-See $me $c['id']) { [void]$out.Add((Camp-Summary $c $me)) } }
        return Send $res 200 @{ ok = $true; campaigns = $out.ToArray() }
      }
      if (-not $isAdmin) { return Fail $res 403 'forbidden' }
      $b = Read-Body $req; $c = $b['campaign']
      if (-not ($c -is [System.Collections.IDictionary])) { return Fail $res 400 'campaign' }
      $id = (Str $c 'id' 40).ToLower()
      if ($id -notmatch $validId) { return Fail $res 400 'id' }
      if (Get-Camp $id) { return Fail $res 409 'exists' }
      $c['id'] = $id; $c['createdAt'] = NowMs
      if ((Str $c 'status' 20) -notin 'live', 'pending', 'hidden') { $c['status'] = 'hidden' }
      $db['campaigns'] = @($db['campaigns']) + $c; SaveDb
      return Send $res 200 @{ ok = $true; campaign = (Camp-Summary $c $me) }
    }
    '^campaigns/([\w-]+)$' {
      if (-not $isAdmin) { return Fail $res 403 'forbidden' }
      $idx = Camp-Index $Matches[1]
      if ($idx -lt 0) { return Fail $res 404 'not-found' }
      $c = @($db['campaigns'])[$idx]
      if ($method -eq 'DELETE') {
        foreach ($d in $db['donations']) { if ($d['campaignId'] -eq $c['id'] -and -not $d['demo']) { return Fail $res 400 'has-donations' } }
        $keep = Arr; foreach ($x in $db['campaigns']) { if ($x['id'] -ne $c['id']) { [void]$keep.Add($x) } }
        $keepD = Arr; foreach ($d in $db['donations']) { if ($d['campaignId'] -ne $c['id']) { [void]$keepD.Add($d) } }
        $db['campaigns'] = $keep.ToArray(); $db['donations'] = $keepD.ToArray(); SaveDb
        return Send $res 200 @{ ok = $true }
      }
      $b = Read-Body $req
      if (Has $b 'status') {
        $st = Str $b 'status' 20
        if ($st -notin 'live', 'pending', 'hidden') { return Fail $res 400 'status' }
        $c['status'] = $st
      }
      SaveDb
      return Send $res 200 @{ ok = $true; campaign = (Camp-Summary $c $me) }
    }
    '^platform$' {
      if ($method -eq 'GET') { return Send $res 200 @{ ok = $true; platform = $db['platform'] } }
      if (-not $isAdmin) { return Fail $res 403 'forbidden' }
      $b = Read-Body $req
      if (-not ($b['platform'] -is [System.Collections.IDictionary])) { return Fail $res 400 'platform' }
      $db['platform'] = $b['platform']; SaveDb
      return Send $res 200 @{ ok = $true }
    }
    # ----- one campaign: content + donations -----
    '^data$' {
      $c = Get-Camp $cid
      if (-not $c) { return Fail $res 404 'not-found' }
      if (-not (Can-See $me $cid)) { return Fail $res 403 'forbidden' }
      $list = Arr; foreach ($d in $db['donations']) { if ($d['campaignId'] -eq $cid) { [void]$list.Add($d) } }
      return Send $res 200 @{ ok = $true; config = $c; donations = $list.ToArray(); now = (NowMs); phase = (Get-Status $c); canEdit = (Can-Edit $me $cid) }
    }
    '^config$' {
      $b = Read-Body $req; $id = Str $b 'campaignId' 60
      $idx = Camp-Index $id
      if ($idx -lt 0) { return Fail $res 404 'not-found' }
      if (-not (Can-Edit $me $id)) { return Fail $res 403 'forbidden' }
      $n = $b['config']
      if (-not ($n -is [System.Collections.IDictionary])) { return Fail $res 400 'config' }
      $old = @($db['campaigns'])[$idx]
      # id, status and the original application are controlled by the platform, not by the campaign editor
      $n['id'] = $old['id']; $n['status'] = $old['status']; $n['applicant'] = $old['applicant']; $n['createdAt'] = $old['createdAt']
      $arr = @($db['campaigns']); $arr[$idx] = $n; $db['campaigns'] = $arr; SaveDb
      return Send $res 200 @{ ok = $true }
    }
    '^donations$' {
      $b = Read-Body $req; $d = $b['donation']
      if (-not ($d -is [System.Collections.IDictionary])) { return Fail $res 400 'donation' }
      $id = Str $d 'campaignId' 60
      if (-not (Get-Camp $id)) { return Fail $res 404 'not-found' }
      if (-not (Can-Edit $me $id)) { return Fail $res 403 'forbidden' }
      $now = NowMs
      $d['id'] = 'm' + $now + (RandHex 3); $d['createdAt'] = $now
      if (-not (Has $d 'date')) { $d['date'] = $now }
      if (-not (Has $d 'source')) { $d['source'] = 'manual' }
      $db['donations'] = @($db['donations']) + $d; SaveDb
      return Send $res 200 @{ ok = $true; donation = $d }
    }
    '^donations/([\w-]+)$' {
      $id = $Matches[1]
      $idx = -1; $arr = @($db['donations'])
      for ($i = 0; $i -lt $arr.Count; $i++) { if ($arr[$i]['id'] -eq $id) { $idx = $i; break } }
      if ($idx -lt 0) { return Fail $res 404 'not-found' }
      if (-not (Can-Edit $me $arr[$idx]['campaignId'])) { return Fail $res 403 'forbidden' }
      if ($method -eq 'DELETE') {
        $list = New-Object System.Collections.ArrayList; $list.AddRange($arr); $list.RemoveAt($idx)
        $db['donations'] = $list.ToArray(); SaveDb
        return Send $res 200 @{ ok = $true }
      }
      $patch = (Read-Body $req)['donation']
      foreach ($k in @($patch.Keys)) { if ($k -ne 'id' -and $k -ne 'campaignId') { $arr[$idx][$k] = $patch[$k] } }
      $arr[$idx]['updatedAt'] = NowMs
      SaveDb
      return Send $res 200 @{ ok = $true; donation = $arr[$idx] }
    }
    '^purge-demo$' {
      $b = Read-Body $req; $id = Str $b 'campaignId' 60
      $c = Get-Camp $id
      if (-not $c) { return Fail $res 404 'not-found' }
      if (-not (Can-Edit $me $id)) { return Fail $res 403 'forbidden' }
      $keep = Arr
      foreach ($d in $db['donations']) { if (-not ($d['campaignId'] -eq $id -and $d['demo'])) { [void]$keep.Add($d) } }
      $db['donations'] = $keep.ToArray()
      foreach ($t in @($c['teams'])) { if ($t -and $t['demo']) { $t['raised'] = 0; $t['donors'] = 0; $t['demo'] = $false } }
      $c['demo'] = $false
      SaveDb
      return Send $res 200 @{ ok = $true }
    }
    '^upload$' {
      if ($me['role'] -eq 'viewer') { return Fail $res 403 'forbidden' }
      $b = Read-Body $req
      $m = [regex]::Match("$($b['dataUrl'])", '^data:image/(png|jpeg|webp|gif);base64,(.+)$')
      if (-not $m.Success) { return Fail $res 400 'type' }
      $bytes = [Convert]::FromBase64String($m.Groups[2].Value)
      if ($bytes.Length -gt 8MB) { return Fail $res 413 'size' }
      $ext = $(if ($m.Groups[1].Value -eq 'jpeg') { 'jpg' } else { $m.Groups[1].Value })
      $fname = (RandHex 8) + '.' + $ext
      [IO.File]::WriteAllBytes((Join-Path $uploadDir $fname), $bytes)
      return Send $res 200 @{ ok = $true; path = "uploads/$fname" }
    }
    '^backup$' {
      if (-not $isAdmin) { return Fail $res 403 'forbidden' }
      return Send $res 200 @{ ok = $true; db = $db }
    }
    '^restore$' {
      if (-not $isAdmin) { return Fail $res 403 'forbidden' }
      $b = Read-Body $req; $n = $b['db']
      if (-not (Valid-Db $n)) { return Fail $res 400 'db' }
      WriteFileSafe "$dbPath.before-restore" ($js.Serialize($db))
      $script:db = $n; SaveDb
      return Send $res 200 @{ ok = $true }
    }
    # ----- users (platform admin only) -----
    '^users$' {
      if (-not $isAdmin) { return Fail $res 403 'forbidden' }
      $list = Load-Users
      if ($method -eq 'GET') {
        $out = Arr
        foreach ($u in $list) { [void]$out.Add((Public-User $u)) }
        return Send $res 200 @{ ok = $true; users = $out.ToArray() }
      }
      $b = Read-Body $req
      $un = Str $b 'username' 32; $pw = Str $b 'password' 200; $role = Str $b 'role' 20
      if ($un -notmatch $validUsername) { return Fail $res 400 'username' }
      if (Find-User $list $un) { return Fail $res 409 'exists' }
      if ($role -notin $ROLES) { return Fail $res 400 'role' }
      if ($pw.Length -lt 8) { return Fail $res 400 'weak' }
      $u = New-PwFields $pw
      $camps = Arr; foreach ($x in @($b['campaigns'])) { if (Get-Camp "$x") { [void]$camps.Add("$x") } }
      $u['id'] = 'u' + (RandHex 4); $u['username'] = $un; $u['name'] = (Str $b 'name' 60); $u['role'] = $role; $u['campaigns'] = $camps.ToArray(); $u['updatedAt'] = NowMs
      [void]$list.Add($u); Save-Users $list
      return Send $res 200 @{ ok = $true; user = (Public-User $u) }
    }
    '^users/([\w-]+)$' {
      if (-not $isAdmin) { return Fail $res 403 'forbidden' }
      $list = Load-Users; $u = Find-User $list $Matches[1] 'id'
      if (-not $u) { return Fail $res 404 'not-found' }
      if ($method -eq 'DELETE') {
        if ($u['id'] -eq $me['id']) { return Fail $res 400 'self' }
        if ($u['role'] -eq 'admin' -and (Count-Admins $list) -le 1) { return Fail $res 400 'last-admin' }
        $list.Remove($u); Save-Users $list; End-UserSessions $u['id']
        return Send $res 200 @{ ok = $true }
      }
      $b = Read-Body $req
      if (Has $b 'role') {
        $role = Str $b 'role' 20
        if ($role -notin $ROLES) { return Fail $res 400 'role' }
        if ($u['role'] -eq 'admin' -and $role -ne 'admin' -and (Count-Admins $list) -le 1) { return Fail $res 400 'last-admin' }
        $u['role'] = $role
      }
      if (Has $b 'campaigns') { $camps = Arr; foreach ($x in @($b['campaigns'])) { if (Get-Camp "$x") { [void]$camps.Add("$x") } }; $u['campaigns'] = $camps.ToArray() }
      if (Has $b 'name') { $u['name'] = Str $b 'name' 60 }
      if (Has $b 'password') {
        $pw = Str $b 'password' 200
        if ($pw.Length -lt 8) { return Fail $res 400 'weak' }
        $f = New-PwFields $pw; $u['salt'] = $f['salt']; $u['hash'] = $f['hash']
        End-UserSessions $u['id'] $req.Cookies['ysid'].Value
      }
      $u['updatedAt'] = NowMs; Save-Users $list
      return Send $res 200 @{ ok = $true; user = (Public-User $u) }
    }
    default { return Fail $res 404 'unknown' }
  }
}

# ---------- main loop ----------
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Yozma platform server running: http://localhost:$Port/  (admin: http://localhost:$Port/admin)"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request; $res = $ctx.Response
  try {
    $path = $req.Url.AbsolutePath
    $method = $req.HttpMethod
    if ($path -like '/api/*' -and $method -ne 'GET') {
      $origin = $req.Headers['Origin']
      if ($origin -and $origin -ne "http://localhost:$Port") { Fail $res 403 'origin'; continue }
    }
    $needsDb = ($path -in '/api/public', '/api/donate', '/api/teams', '/api/apply') -or ($path -like '/api/admin/*' -and $path -notin '/api/admin/status', '/api/admin/setup', '/api/admin/login')
    if ($needsDb -and $null -eq $db) { Fail $res 503 'not-setup' }
    elseif ($path -eq '/api/public' -and $method -eq 'GET') { Send $res 200 (Public-Data) }
    elseif ($path -eq '/api/donate' -and $method -eq 'POST') { Api-Donate $req $res }
    elseif ($path -eq '/api/teams' -and $method -eq 'POST') { Api-NewTeam $req $res }
    elseif ($path -eq '/api/apply' -and $method -eq 'POST') { Api-Apply $req $res }
    elseif ($path -like '/api/admin/*') { Api-Admin $req $res ($path.Substring(11)) $method }
    elseif ($path -like '/api/*') { Fail $res 404 'unknown' }
    else { Serve-Static $req $res }
  } catch {
    Write-Host "ERROR $($req.HttpMethod) $($req.Url.AbsolutePath): $_"
    try { Fail $res 500 'server' } catch {}
  } finally {
    try { $res.Close() } catch {}
  }
}
