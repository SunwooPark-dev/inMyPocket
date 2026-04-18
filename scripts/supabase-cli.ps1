param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Args
)

$ErrorActionPreference = "Stop"

pnpm dlx supabase@latest @Args
