export async function suggestCompany(name) {
  const url = `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(name)}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  if (!data.length) return null
  const match = data[0]
  return {
    name: match.name,
    domain: match.domain,
    logoUrl: clearbitLogoUrl(match.domain),
  }
}

// Primary: Clearbit Logo API — clean brand logo PNG, usually transparent background
export function clearbitLogoUrl(domain) {
  return `/logo-proxy/${domain}?size=128`
}

export function fallbackLogoUrl(domain) {
  return `/gstatic-proxy/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=256`
}

// Ordered list of logo sources — first one that loads wins
export function logoUrlCandidates(domain) {
  return [
    `/logo-proxy/${domain}?size=128`,
    `/gstatic-proxy/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=256`,
    `/ddg-proxy/ip3/${domain}.ico`,
    `/favicon-proxy/s2/favicons?domain=${domain}&sz=256`,
  ]
}
