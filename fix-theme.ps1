Set-Location "c:\Users\bossd\Downloads\leeee\liora-main"
$updated = 0

Get-ChildItem -Recurse -Include "*.tsx" | Where-Object { $_.FullName -notmatch "node_modules" } | ForEach-Object {
    $c = [System.IO.File]::ReadAllText($_.FullName)
    $o = $c

    # Background colors
    $c = $c -replace 'bg-\[#F8F5EF\]', 'bg-surface-950'
    $c = $c -replace 'bg-\[#F9F4EC\]', 'bg-surface-950'
    $c = $c -replace 'bg-\[#FDFCF8\]', 'bg-surface-900'
    $c = $c -replace 'bg-white/50', 'glass'
    $c = $c -replace 'bg-white/70', 'glass'

    # Text colors
    $c = $c -replace 'text-\[#2C3E50\]', 'text-surface-100'
    $c = $c -replace 'text-\[#5A6A7B\]', 'text-surface-400'
    $c = $c -replace 'text-\[#8C7E6A\]', 'text-surface-500'
    $c = $c -replace 'text-\[#4A3F35\]', 'text-surface-100'

    # Brand/accent bg
    $c = $c -replace 'bg-\[#E4B645\]', 'bg-brand-400'
    $c = $c -replace 'bg-\[#D4A017\]', 'bg-brand-500'
    $c = $c -replace 'bg-\[#4A3F35\]', 'bg-surface-800'

    # Brand/accent text
    $c = $c -replace 'text-\[#E4B645\]', 'text-brand-400'
    $c = $c -replace 'text-\[#D4A017\]', 'text-brand-400'
    $c = $c -replace 'text-\[#F4BE40\]', 'text-brand-400'

    # Borders
    $c = $c -replace 'border-\[#EAE2D6\]', 'border-surface-700/50'
    $c = $c -replace 'border-\[#E4B645\]', 'border-brand-400'
    $c = $c -replace 'border-\[#4A3F35\]', 'border-surface-700'

    # Focus
    $c = $c -replace 'focus:ring-\[#E4B645\]', 'focus:ring-brand-400/30'
    $c = $c -replace 'focus:border-\[#E4B645\]', 'focus:border-brand-400/50'
    $c = $c -replace 'focus:ring-\[#2C3E50\]', 'focus:ring-brand-400/30'
    $c = $c -replace 'focus:border-\[#4A3F35\]', 'focus:border-brand-400/50'

    # Hover
    $c = $c -replace 'hover:bg-\[#EAE2D6\]', 'hover:bg-surface-700/50'
    $c = $c -replace 'hover:bg-\[#3a312a\]', 'hover:bg-surface-700'
    $c = $c -replace 'hover:bg-\[#b88a14\]', 'hover:bg-brand-500'
    $c = $c -replace 'hover:bg-\[#3E5871\]', 'hover:bg-surface-700'
    $c = $c -replace 'hover:border-\[#4A3F35\]', 'hover:border-brand-400/50'
    $c = $c -replace 'hover:border-\[#2C3E50\]', 'hover:border-brand-400/50'
    $c = $c -replace 'hover:bg-\[#E4B645\]', 'hover:bg-brand-400'
    $c = $c -replace 'hover:text-\[#E4B645\]', 'hover:text-brand-400'
    $c = $c -replace 'hover:text-\[#2C3E50\]', 'hover:text-surface-100'
    $c = $c -replace 'hover:bg-gray-100', 'hover:bg-surface-800/30'

    # Checked
    $c = $c -replace 'checked:bg-\[#E4B645\]', 'checked:bg-brand-400'

    # Gradients
    $c = $c -replace 'from-\[#D4AF37\]', 'from-brand-400'
    $c = $c -replace 'via-\[#E4B645\]', 'via-brand-400'
    $c = $c -replace 'to-\[#F3D788\]', 'to-brand-500'

    # Shadow
    $c = $c -replace 'shadow-xl shadow-\[#4A3F35\]/20', 'shadow-xl shadow-brand-400/10'

    # bg-white (not followed by /)
    $c = $c -replace '(?<![/a-z])bg-white(?![/a-z0-9])', 'bg-surface-900'

    # bg-gray
    $c = $c -replace 'bg-gray-50(?![/0-9])', 'bg-surface-800/50'

    # border-gray
    $c = $c -replace 'border-gray-100', 'border-surface-700/30'
    $c = $c -replace 'border-gray-200(?![/0-9])', 'border-surface-700/50'

    # Additional old colors
    $c = $c -replace 'bg-\[#F4BE40\]', 'bg-brand-400'
    $c = $c -replace 'text-\[#F4BE40\]', 'text-brand-400'
    $c = $c -replace '#E4B645', 'var(--brand)'
    $c = $c -replace '#2C3E50', 'var(--text-primary)'
    $c = $c -replace '#5A6A7B', 'var(--text-secondary)'
    $c = $c -replace '#EAE2D6', 'var(--border)'
    $c = $c -replace '#F8F5EF', 'var(--bg)'
    $c = $c -replace '#F9F4EC', 'var(--bg)'
    $c = $c -replace '#FDFCF8', 'var(--bg-card)'
    $c = $c -replace '#4A3F35', 'var(--text-primary)'
    $c = $c -replace '#8C7E6A', 'var(--text-muted)'

    if ($c -ne $o) {
        [System.IO.File]::WriteAllText($_.FullName, $c)
        $updated++
        Write-Output "Updated: $($_.Name)"
    }
}

Write-Output "`nTotal updated: $updated"
