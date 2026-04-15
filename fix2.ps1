Set-Location "c:\Users\bossd\Downloads\leeee\liora-main"
$u = 0
Get-ChildItem -Recurse -Include "*.tsx" | Where-Object { $_.FullName -notmatch "node_modules" } | ForEach-Object {
    $c = [System.IO.File]::ReadAllText($_.FullName); $o = $c
    # Match bg-white NOT followed by / or letter (standalone)
    $c = $c -replace '(?<![\w-])bg-white(?![\w/])', 'bg-surface-900'
    # Fix border-white (for dark theme, borders should be subtle)  
    $c = $c -replace 'border-4 border-white', 'border-4 border-surface-700'
    # Additional gray fixes
    $c = $c -replace 'bg-gray-100/70', 'bg-surface-800/30'
    $c = $c -replace 'bg-gray-200/60', 'bg-surface-700/40'
    $c = $c -replace 'bg-gray-300/60', 'bg-surface-600/40'
    # Remaining standalone bg-gray patterns
    $c = $c -replace '(?<![\w-])bg-gray-50(?![\w/])', 'bg-surface-800/50'
    $c = $c -replace 'bg-gray-50/50', 'bg-surface-800/30'
    # Fix text colors for restaurant portal
    $c = $c -replace 'text-gray-700', 'text-surface-300'
    $c = $c -replace 'text-gray-900', 'text-surface-100'
    if ($c -ne $o) { [System.IO.File]::WriteAllText($_.FullName, $c); $u++; Write-Output "Fixed: $($_.Name)" }
}
Write-Output "Fixed $u files"
