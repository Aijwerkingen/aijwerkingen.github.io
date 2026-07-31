/**
 * Curated crisis helpline data by country (ISO 3166-1 alpha-2).
 *
 * Sources: findahelpline.com, IASP, Wikimedia mental-health resources.
 * This is a best-effort snapshot - for the most up-to-date, verified directory
 * users are linked through to findahelpline.com (run by ThroughLine).
 *
 * Each entry carries the primary suicide/crisis line. Countries without a known
 * dedicated crisis line are omitted; the fallback page (/helplines) covers
 * aggregator resources for those cases.
 */

export interface HelplineEntry {
  /** ISO 3166-1 alpha-2 */
  code: string;
  country: string;
  /** Primary crisis/suicide helpline name */
  name: string;
  /** Phone number(s) - display string, not necessarily dialable as-is */
  phone: string;
  /** Helpline website */
  url: string;
  /** National emergency number */
  emergency: string;
}

export const helplines: HelplineEntry[] = [
  { code: "AF", country: "Afghanistan", name: "Afghanistan Mental Health Helpline", phone: "0799 009 009", url: "https://findahelpline.com/countries/af", emergency: "119" },
  { code: "AL", country: "Albania", name: "National Helpline Albania", phone: "116 123", url: "https://findahelpline.com/countries/al", emergency: "112" },
  { code: "AR", country: "Argentina", name: "Centro de Asistencia al Suicida", phone: "135", url: "https://www.casbuenosaires.org.ar/", emergency: "911" },
  { code: "AU", country: "Australia", name: "Lifeline Australia", phone: "13 11 14", url: "https://www.lifeline.org.au/", emergency: "000" },
  { code: "AT", country: "Austria", name: "Telefonseelsorge", phone: "142", url: "https://www.telefonseelsorge.at/", emergency: "112" },
  { code: "BD", country: "Bangladesh", name: "Kaan Pete Roi", phone: "+1 732-806-7735", url: "https://www.kaanpeteroi.com/", emergency: "999" },
  { code: "BE", country: "Belgium", name: "Centre de Prévention du Suicide", phone: "0800 32 123", url: "https://www.preventionsuicide.be/", emergency: "112" },
  { code: "BR", country: "Brazil", name: "CVV - Centro de Valorização da Vida", phone: "188", url: "https://www.cvv.org.br/", emergency: "190" },
  { code: "BG", country: "Bulgaria", name: "Bulgarian National Helpline", phone: "0035 9249 17 223", url: "https://findahelpline.com/countries/bg", emergency: "112" },
  { code: "CA", country: "Canada", name: "988 Suicide Crisis Helpline", phone: "988", url: "https://988.ca/", emergency: "911" },
  { code: "CL", country: "Chile", name: "Teléfono de la Esperanza", phone: "600 360 7777", url: "https://findahelpline.com/countries/cl", emergency: "131" },
  { code: "CN", country: "China", name: "Beijing Suicide Research & Prevention Center", phone: "010-82951332", url: "https://findahelpline.com/countries/cn", emergency: "120" },
  { code: "CO", country: "Colombia", name: "Línea 106", phone: "106", url: "https://findahelpline.com/countries/co", emergency: "123" },
  { code: "HR", country: "Croatia", name: "Plavi Telefon", phone: "01 4833 888", url: "https://findahelpline.com/countries/hr", emergency: "112" },
  { code: "CZ", country: "Czech Republic", name: "Linka bezpečí", phone: "116 111", url: "https://www.linkabezpeci.cz/", emergency: "112" },
  { code: "DK", country: "Denmark", name: "Livslinien", phone: "70 201 201", url: "https://www.livslinien.dk/", emergency: "112" },
  { code: "EG", country: "Egypt", name: "Befrienders Egypt", phone: "762 2381", url: "https://findahelpline.com/countries/eg", emergency: "122" },
  { code: "EE", country: "Estonia", name: "Eluliin", phone: "655 8088", url: "https://findahelpline.com/countries/ee", emergency: "112" },
  { code: "FI", country: "Finland", name: "MIELI Mental Health Finland", phone: "09 2525 0111", url: "https://mieli.fi/en/", emergency: "112" },
  { code: "FR", country: "France", name: "3114 - Numéro National de Prévention du Suicide", phone: "3114", url: "https://3114.fr/", emergency: "112" },
  { code: "DE", country: "Germany", name: "Telefonseelsorge", phone: "0800 111 0 111", url: "https://www.telefonseelsorge.de/", emergency: "112" },
  { code: "GH", country: "Ghana", name: "Befrienders Ghana", phone: "+233 244 846 101", url: "https://findahelpline.com/countries/gh", emergency: "999" },
  { code: "GR", country: "Greece", name: "Klimaka NGO", phone: "1018", url: "https://www.klimaka.org.gr/", emergency: "112" },
  { code: "HK", country: "Hong Kong", name: "The Samaritan Befrienders Hong Kong", phone: "2389 2222", url: "https://www.sbhk.org.hk/", emergency: "999" },
  { code: "HU", country: "Hungary", name: "LESZ Telefonos Lelkisegély", phone: "116 123", url: "https://findahelpline.com/countries/hu", emergency: "112" },
  { code: "IS", country: "Iceland", name: "Rauði Krossinn", phone: "1717", url: "https://findahelpline.com/countries/is", emergency: "112" },
  { code: "IN", country: "India", name: "iCall - TISS", phone: "9152987821", url: "https://icallhelpline.org/", emergency: "112" },
  { code: "ID", country: "Indonesia", name: "Into The Light Indonesia", phone: "119 ext. 8", url: "https://findahelpline.com/countries/id", emergency: "112" },
  { code: "IE", country: "Ireland", name: "Samaritans Ireland", phone: "116 123", url: "https://www.samaritans.org/ireland/", emergency: "112" },
  { code: "IL", country: "Israel", name: "ERAN", phone: "1201", url: "https://www.eran.org.il/", emergency: "100" },
  { code: "IT", country: "Italy", name: "Telefono Amico", phone: "02 2327 2327", url: "https://www.telefonoamico.it/", emergency: "112" },
  { code: "JP", country: "Japan", name: "TELL Lifeline", phone: "03-5774-0992", url: "https://telljp.com/", emergency: "110" },
  { code: "KE", country: "Kenya", name: "Befrienders Kenya", phone: "+254 722 178 177", url: "https://findahelpline.com/countries/ke", emergency: "999" },
  { code: "KR", country: "South Korea", name: "Korea Suicide Prevention Center", phone: "1393", url: "https://findahelpline.com/countries/kr", emergency: "119" },
  { code: "LB", country: "Lebanon", name: "Embrace Lifeline", phone: "1564", url: "https://embracelebanon.org/", emergency: "112" },
  { code: "LT", country: "Lithuania", name: "Vilties Linija", phone: "116 123", url: "https://findahelpline.com/countries/lt", emergency: "112" },
  { code: "LU", country: "Luxembourg", name: "SOS Détresse", phone: "45 45 45", url: "https://www.454545.lu/", emergency: "112" },
  { code: "MY", country: "Malaysia", name: "Befrienders KL", phone: "03-7956 8145", url: "https://www.befrienders.org.my/", emergency: "999" },
  { code: "MX", country: "Mexico", name: "SAPTEL", phone: "55 5259-8121", url: "https://www.saptel.org.mx/", emergency: "911" },
  { code: "NL", country: "Netherlands", name: "113 Zelfmoordpreventie", phone: "113 or 0800-0113", url: "https://www.113.nl/", emergency: "112" },
  { code: "NZ", country: "New Zealand", name: "Lifeline Aotearoa", phone: "0800 543 354", url: "https://www.lifeline.org.nz/", emergency: "111" },
  { code: "NG", country: "Nigeria", name: "SURPIN", phone: "+234 806 210 6493", url: "https://findahelpline.com/countries/ng", emergency: "199" },
  { code: "NO", country: "Norway", name: "Mental Helse", phone: "116 123", url: "https://www.mentalhelse.no/", emergency: "112" },
  { code: "PK", country: "Pakistan", name: "Umang Helpline", phone: "0311-7786264", url: "https://findahelpline.com/countries/pk", emergency: "115" },
  { code: "PE", country: "Peru", name: "Línea 100", phone: "100", url: "https://findahelpline.com/countries/pe", emergency: "105" },
  { code: "PH", country: "Philippines", name: "Hopeline PH", phone: "0917 558 4673", url: "https://findahelpline.com/countries/ph", emergency: "911" },
  { code: "PL", country: "Poland", name: "Telefon Zaufania", phone: "116 123", url: "https://findahelpline.com/countries/pl", emergency: "112" },
  { code: "PT", country: "Portugal", name: "SOS Voz Amiga", phone: "213 544 545", url: "https://findahelpline.com/countries/pt", emergency: "112" },
  { code: "RO", country: "Romania", name: "Telefonul Sufletului", phone: "0800 801 200", url: "https://findahelpline.com/countries/ro", emergency: "112" },
  { code: "RU", country: "Russia", name: "Phone of Trust", phone: "8-800-2000-122", url: "https://findahelpline.com/countries/ru", emergency: "112" },
  { code: "SA", country: "Saudi Arabia", name: "Mental Health Helpline", phone: "920033360", url: "https://findahelpline.com/countries/sa", emergency: "911" },
  { code: "SG", country: "Singapore", name: "Samaritans of Singapore (SOS)", phone: "1-767", url: "https://www.sos.org.sg/", emergency: "995" },
  { code: "SK", country: "Slovakia", name: "Linka dôvery Nezábudka", phone: "0800 500 333", url: "https://findahelpline.com/countries/sk", emergency: "112" },
  { code: "ZA", country: "South Africa", name: "SADAG", phone: "0800 567 567", url: "https://www.sadag.org/", emergency: "10111" },
  { code: "ES", country: "Spain", name: "Teléfono de la Esperanza", phone: "024", url: "https://www.telefonodelaesperanza.org/", emergency: "112" },
  { code: "LK", country: "Sri Lanka", name: "Sumithrayo", phone: "011 2682535", url: "https://findahelpline.com/countries/lk", emergency: "119" },
  { code: "SE", country: "Sweden", name: "Mind Självmordslinjen", phone: "90101", url: "https://mind.se/", emergency: "112" },
  { code: "CH", country: "Switzerland", name: "Die Dargebotene Hand", phone: "143", url: "https://www.143.ch/", emergency: "112" },
  { code: "TW", country: "Taiwan", name: "Taiwan Suicide Prevention Center", phone: "1925", url: "https://findahelpline.com/countries/tw", emergency: "110" },
  { code: "TH", country: "Thailand", name: "Samaritans of Thailand", phone: "02-713-6793", url: "https://findahelpline.com/countries/th", emergency: "191" },
  { code: "TR", country: "Turkey", name: "182 Alo Destek Hattı", phone: "182", url: "https://findahelpline.com/countries/tr", emergency: "112" },
  { code: "UA", country: "Ukraine", name: "Lifeline Ukraine", phone: "7333", url: "https://findahelpline.com/countries/ua", emergency: "112" },
  { code: "AE", country: "United Arab Emirates", name: "Mental Health Helpline", phone: "800-HOPE (4673)", url: "https://findahelpline.com/countries/ae", emergency: "999" },
  { code: "GB", country: "United Kingdom", name: "Samaritans", phone: "116 123", url: "https://www.samaritans.org/", emergency: "999" },
  { code: "US", country: "United States", name: "988 Suicide & Crisis Lifeline", phone: "988", url: "https://988lifeline.org/", emergency: "911" },
  { code: "VN", country: "Vietnam", name: "Vietnam Mental Health Helpline", phone: "1800 599 920", url: "https://findahelpline.com/countries/vn", emergency: "115" },
];

/** Look up by ISO country code (case-insensitive). */
export function getHelpline(code: string): HelplineEntry | undefined {
  return helplines.find((h) => h.code === code.toUpperCase());
}

/** Default when geolocation fails or country has no entry. */
export const defaultCountryCode = "NL";
