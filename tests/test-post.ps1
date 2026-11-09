# tests/test-post.ps1 — the four POST cases only.
$base = "http://localhost:3000"
$testsDir = $PSScriptRoot

function Post($title, $file) {
  Write-Output ""
  Write-Output "************************************************************"
  Write-Output " $title"
  & curl.exe -s -w "`nHTTP %{http_code}`n" -X POST $base/api/reviews -H "Content-Type: application/json" --data "@$testsDir\$file"
}

Post " 1) POST valid review            (expects: 201 + reviewId)" "b1-valid.json"
Post " 2) POST rating=500              (expects: 400)" "b2-rating-500.json"
Post " 3) POST blank comment           (expects: 400)" "b3-blank-comment.json"
Post " 4) POST unknown restaurant 999  (expects: 400)" "b4-no-restaurant.json"

Write-Output ""
Write-Output "************************************************************"
Write-Output " 5) GET /api/restaurants/1 again - did avg/count change?"
& curl.exe -s $base/api/restaurants/1
Write-Output ""
