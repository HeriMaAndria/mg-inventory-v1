export function formatNumber(num) {
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function numberToWords(num) {
  if (num === 0) return 'Zéro Ariary'
  
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf']
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf']
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix']
  
  function convertHundreds(n) {
    let result = ''
    const hundreds = Math.floor(n / 100)
    if (hundreds > 0) result += hundreds === 1 ? 'cent ' : units[hundreds] + ' cent '
    n %= 100
    if (n >= 20) {
      const tensDigit = Math.floor(n / 10)
      const unitsDigit = n % 10
      result += tens[tensDigit]
      if (unitsDigit > 0) result += '-' + units[unitsDigit]
    } else if (n >= 10) {
      result += teens[n - 10]
    } else if (n > 0) {
      result += units[n]
    }
    return result.trim()
  }
  
  let words = ''
  if (num >= 1000000) {
    const millions = Math.floor(num / 1000000)
    words += millions === 1 ? 'un million ' : convertHundreds(millions) + ' millions '
    num %= 1000000
  }
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000)
    words += thousands === 1 ? 'mille ' : convertHundreds(thousands) + ' mille '
    num %= 1000
  }
  if (num > 0) words += convertHundreds(num)
  
  return words.trim().charAt(0).toUpperCase() + words.trim().slice(1) + ' Ariary'
}
