# tests/test-api.ps1 — proves the backend works with NO user interface at all.
$base = "http://localhost:3000"
$testsDir = $PSScriptRoot

Write-Output "************************************************************"
Write-Output " 1) GET /api/restaurants/1   (expects: full page data)"
& curl.exe -s $base/api/restaurants/1

Write-Output ""
Write-Output "************************************************************"
Write-Output " 2) GET /api/restaurants/999 (expects: 404)"
& curl.exe -s -w "`nHTTP %{http_code}`n" $base/api/restaurants/999

function Post($title, $file) {
  Write-Output ""
  Write-Output "************************************************************"
  Write-Output " $title"
  & curl.exe -s -w "`nHTTP %{http_code}`n" -X POST $base/api/reviews -H "Content-Type: application/json" --data "@$testsDir\$file"
}

Post " 3) POST valid review            (expects: 201 + reviewId)" "b1-valid.json"
Post " 4) POST rating=500              (expects: 400)" "b2-rating-500.json"
Post " 5) POST blank comment           (expects: 400)" "b3-blank-comment.json"
Post " 6) POST unknown restaurant 999  (expects: 400)" "b4-no-restaurant.json"

Write-Output ""
Write-Output "************************************************************"
Write-Output " 7) GET /api/restaurants/1 again - did avg/count change?"
& curl.exe -s $base/api/restaurants/1
Write-Output ""
