/**
 * Seed wilayah for the company setup wizard: every provinsi plus the
 * kabupaten/kota a tenant can pick as its operational base.
 *
 * This is reference data for the form, not the source of truth. Once the
 * wizard posts to `/master/regions` and `/master/branches`, replace the module
 * with a fetch and keep the same `RegionOption` shape.
 */
export type RegionTimezone = "Asia/Jakarta" | "Asia/Makassar" | "Asia/Jayapura";

export interface Province {
  /** URL-safe slug, used as the option value. */
  id: string;
  name: string;
  timezone: RegionTimezone;
  regencies: readonly string[];
}

export const provinces: readonly Province[] = [
  { id: "aceh", name: "Aceh", timezone: "Asia/Jakarta", regencies: [
    "Kota Banda Aceh", "Kota Sabang", "Kota Langsa", "Kota Lhokseumawe", "Kab. Aceh Besar", "Kab. Pidie",
    "Kab. Pidie Jaya", "Kab. Bireuen", "Kab. Aceh Utara", "Kab. Aceh Timur", "Kab. Aceh Tamiang",
    "Kab. Aceh Tengah", "Kab. Aceh Barat", "Kab. Nagan Raya", "Kab. Simeulue", "Kab. Aceh Singkil",
  ] },
  { id: "sumatera-utara", name: "Sumatera Utara", timezone: "Asia/Jakarta", regencies: [
    "Kota Medan", "Kota Binjai", "Kota Pematangsiantar", "Kota Tebing Tinggi", "Kota Tanjungbalai",
    "Kota Sibolga", "Kota Padangsidimpuan", "Kota Gunungsitoli", "Kab. Deli Serdang", "Kab. Langkat",
    "Kab. Karo", "Kab. Simalungun", "Kab. Asahan", "Kab. Labuhanbatu", "Kab. Toba", "Kab. Nias",
    "Kab. Nias Selatan",
  ] },
  { id: "sumatera-barat", name: "Sumatera Barat", timezone: "Asia/Jakarta", regencies: [
    "Kota Padang", "Kota Bukittinggi", "Kota Payakumbuh", "Kota Padang Panjang", "Kota Solok",
    "Kota Pariaman", "Kota Sawahlunto", "Kab. Agam", "Kab. Tanah Datar", "Kab. Padang Pariaman",
    "Kab. Pesisir Selatan", "Kab. Solok", "Kab. Pasaman", "Kab. Pasaman Barat", "Kab. Lima Puluh Kota",
    "Kab. Sijunjung", "Kab. Dharmasraya", "Kab. Kepulauan Mentawai",
  ] },
  { id: "riau", name: "Riau", timezone: "Asia/Jakarta", regencies: [
    "Kota Pekanbaru", "Kota Dumai", "Kab. Kampar", "Kab. Siak", "Kab. Bengkalis", "Kab. Rokan Hulu",
    "Kab. Rokan Hilir", "Kab. Indragiri Hulu", "Kab. Indragiri Hilir", "Kab. Pelalawan",
    "Kab. Kuantan Singingi", "Kab. Kepulauan Meranti",
  ] },
  { id: "kepulauan-riau", name: "Kepulauan Riau", timezone: "Asia/Jakarta", regencies: [
    "Kota Batam", "Kota Tanjungpinang", "Kab. Bintan", "Kab. Karimun", "Kab. Natuna", "Kab. Lingga",
    "Kab. Kepulauan Anambas",
  ] },
  { id: "jambi", name: "Jambi", timezone: "Asia/Jakarta", regencies: [
    "Kota Jambi", "Kota Sungai Penuh", "Kab. Muaro Jambi", "Kab. Batanghari", "Kab. Bungo", "Kab. Tebo",
    "Kab. Merangin", "Kab. Kerinci", "Kab. Sarolangun", "Kab. Tanjung Jabung Barat",
    "Kab. Tanjung Jabung Timur",
  ] },
  { id: "bengkulu", name: "Bengkulu", timezone: "Asia/Jakarta", regencies: [
    "Kota Bengkulu", "Kab. Rejang Lebong", "Kab. Kepahiang", "Kab. Lebong", "Kab. Seluma",
    "Kab. Mukomuko", "Kab. Bengkulu Utara", "Kab. Bengkulu Tengah", "Kab. Bengkulu Selatan", "Kab. Kaur",
  ] },
  { id: "sumatera-selatan", name: "Sumatera Selatan", timezone: "Asia/Jakarta", regencies: [
    "Kota Palembang", "Kota Prabumulih", "Kota Pagar Alam", "Kota Lubuklinggau", "Kab. Ogan Komering Ilir",
    "Kab. Ogan Komering Ulu", "Kab. Ogan Komering Ulu Timur", "Kab. Muara Enim", "Kab. Lahat",
    "Kab. Musi Banyuasin", "Kab. Banyuasin", "Kab. Musi Rawas", "Kab. Penukal Abab Lematang Ilir",
  ] },
  { id: "lampung", name: "Lampung", timezone: "Asia/Jakarta", regencies: [
    "Kota Bandar Lampung", "Kota Metro", "Kab. Lampung Selatan", "Kab. Lampung Tengah",
    "Kab. Lampung Utara", "Kab. Lampung Timur", "Kab. Lampung Barat", "Kab. Pesisir Barat",
    "Kab. Tanggamus", "Kab. Tulang Bawang", "Kab. Tulang Bawang Barat", "Kab. Way Kanan",
    "Kab. Pesawaran", "Kab. Pringsewu", "Kab. Mesuji",
  ] },
  { id: "bangka-belitung", name: "Bangka Belitung", timezone: "Asia/Jakarta", regencies: [
    "Kota Pangkal Pinang", "Kab. Bangka", "Kab. Bangka Barat", "Kab. Bangka Tengah",
    "Kab. Bangka Selatan", "Kab. Belitung", "Kab. Belitung Timur",
  ] },
  { id: "dki-jakarta", name: "DKI Jakarta", timezone: "Asia/Jakarta", regencies: [
    "Jakarta Pusat", "Jakarta Utara", "Jakarta Barat", "Jakarta Selatan", "Jakarta Timur",
    "Kab. Adm. Kepulauan Seribu",
  ] },
  { id: "jawa-barat", name: "Jawa Barat", timezone: "Asia/Jakarta", regencies: [
    "Kota Bandung", "Kota Bekasi", "Kota Bogor", "Kota Depok", "Kota Cimahi", "Kota Tasikmalaya",
    "Kota Banjar", "Kota Sukabumi", "Kota Cirebon", "Kab. Bandung", "Kab. Bandung Barat",
    "Kab. Bekasi", "Kab. Bogor", "Kab. Cirebon", "Kab. Sukabumi", "Kab. Karawang", "Kab. Purwakarta",
    "Kab. Subang", "Kab. Sumedang", "Kab. Garut", "Kab. Cianjur", "Kab. Indramayu", "Kab. Majalengka",
    "Kab. Kuningan", "Kab. Ciamis", "Kab. Pangandaran",
  ] },
  { id: "jawa-tengah", name: "Jawa Tengah", timezone: "Asia/Jakarta", regencies: [
    "Kota Semarang", "Kota Surakarta", "Kota Magelang", "Kota Salatiga", "Kota Pekalongan", "Kota Tegal",
    "Kab. Semarang", "Kab. Magelang", "Kab. Pekalongan", "Kab. Tegal", "Kab. Kudus", "Kab. Jepara",
    "Kab. Pati", "Kab. Cilacap", "Kab. Banyumas", "Kab. Purbalingga", "Kab. Banjarnegara", "Kab. Klaten",
    "Kab. Sukoharjo", "Kab. Karanganyar", "Kab. Boyolali", "Kab. Sragen", "Kab. Grobogan", "Kab. Demak",
    "Kab. Kendal", "Kab. Batang", "Kab. Pemalang", "Kab. Brebes", "Kab. Wonosobo", "Kab. Temanggung",
    "Kab. Wonogiri", "Kab. Rembang", "Kab. Blora",
  ] },
  { id: "di-yogyakarta", name: "DI Yogyakarta", timezone: "Asia/Jakarta", regencies: [
    "Kota Yogyakarta", "Kab. Sleman", "Kab. Bantul", "Kab. Kulon Progo", "Kab. Gunungkidul",
  ] },
  { id: "jawa-timur", name: "Jawa Timur", timezone: "Asia/Jakarta", regencies: [
    "Kota Surabaya", "Kota Malang", "Kota Kediri", "Kota Madiun", "Kota Mojokerto", "Kota Pasuruan",
    "Kota Probolinggo", "Kota Blitar", "Kota Batu", "Kab. Malang", "Kab. Kediri", "Kab. Mojokerto",
    "Kab. Pasuruan", "Kab. Probolinggo", "Kab. Blitar", "Kab. Madiun", "Kab. Sidoarjo", "Kab. Gresik",
    "Kab. Jember", "Kab. Banyuwangi", "Kab. Jombang", "Kab. Tulungagung", "Kab. Lamongan", "Kab. Tuban",
    "Kab. Bojonegoro", "Kab. Ngawi", "Kab. Magetan", "Kab. Ponorogo", "Kab. Pacitan", "Kab. Bondowoso",
    "Kab. Situbondo", "Kab. Bangkalan", "Kab. Sampang", "Kab. Pamekasan", "Kab. Sumenep", "Kab. Nganjuk",
    "Kab. Trenggalek", "Kab. Lumajang",
  ] },
  { id: "banten", name: "Banten", timezone: "Asia/Jakarta", regencies: [
    "Kota Serang", "Kota Tangerang", "Kota Tangerang Selatan", "Kota Cilegon", "Kab. Serang",
    "Kab. Tangerang", "Kab. Pandeglang", "Kab. Lebak",
  ] },
  { id: "bali", name: "Bali", timezone: "Asia/Makassar", regencies: [
    "Kota Denpasar", "Kab. Badung", "Kab. Gianyar", "Kab. Tabanan", "Kab. Buleleng", "Kab. Karangasem",
    "Kab. Klungkung", "Kab. Bangli", "Kab. Jembrana",
  ] },
  { id: "nusa-tenggara-barat", name: "Nusa Tenggara Barat", timezone: "Asia/Makassar", regencies: [
    "Kota Mataram", "Kota Bima", "Kab. Bima", "Kab. Lombok Barat", "Kab. Lombok Tengah",
    "Kab. Lombok Timur", "Kab. Lombok Utara", "Kab. Sumbawa", "Kab. Sumbawa Barat", "Kab. Dompu",
  ] },
  { id: "nusa-tenggara-timur", name: "Nusa Tenggara Timur", timezone: "Asia/Makassar", regencies: [
    "Kota Kupang", "Kab. Kupang", "Kab. Belu", "Kab. Malaka", "Kab. Timor Tengah Selatan",
    "Kab. Timor Tengah Utara", "Kab. Sikka", "Kab. Ende", "Kab. Flores Timur", "Kab. Ngada",
    "Kab. Nagekeo", "Kab. Manggarai", "Kab. Manggarai Barat", "Kab. Manggarai Timur",
    "Kab. Sumba Timur", "Kab. Sumba Tengah", "Kab. Sumba Barat", "Kab. Sumba Barat Daya", "Kab. Alor",
    "Kab. Lembata", "Kab. Rote Ndao", "Kab. Sabu Raijua",
  ] },
  { id: "kalimantan-barat", name: "Kalimantan Barat", timezone: "Asia/Jakarta", regencies: [
    "Kota Pontianak", "Kota Singkawang", "Kab. Kubu Raya", "Kab. Mempawah", "Kab. Sambas",
    "Kab. Bengkayang", "Kab. Landak", "Kab. Sanggau", "Kab. Sekadau", "Kab. Sintang",
    "Kab. Kapuas Hulu", "Kab. Ketapang", "Kab. Kayong Utara", "Kab. Melawi",
  ] },
  { id: "kalimantan-tengah", name: "Kalimantan Tengah", timezone: "Asia/Jakarta", regencies: [
    "Kota Palangka Raya", "Kab. Kotawaringin Timur", "Kab. Kotawaringin Barat", "Kab. Kapuas",
    "Kab. Barito Selatan", "Kab. Barito Utara", "Kab. Barito Timur", "Kab. Murung Raya",
    "Kab. Gunung Mas", "Kab. Katingan", "Kab. Seruyan", "Kab. Sukamara", "Kab. Lamandau",
    "Kab. Pulang Pisau",
  ] },
  { id: "kalimantan-selatan", name: "Kalimantan Selatan", timezone: "Asia/Makassar", regencies: [
    "Kota Banjarmasin", "Kota Banjarbaru", "Kab. Banjar", "Kab. Tanah Laut", "Kab. Tanah Bumbu",
    "Kab. Kotabaru", "Kab. Hulu Sungai Selatan", "Kab. Hulu Sungai Tengah", "Kab. Hulu Sungai Utara",
    "Kab. Tapin", "Kab. Tabalong", "Kab. Balangan", "Kab. Barito Kuala",
  ] },
  { id: "kalimantan-timur", name: "Kalimantan Timur", timezone: "Asia/Makassar", regencies: [
    "Kota Samarinda", "Kota Balikpapan", "Kota Bontang", "Kab. Kutai Kartanegara", "Kab. Kutai Barat",
    "Kab. Kutai Timur", "Kab. Berau", "Kab. Penajam Paser Utara", "Kab. Paser", "Kab. Mahakam Ulu",
  ] },
  { id: "kalimantan-utara", name: "Kalimantan Utara", timezone: "Asia/Makassar", regencies: [
    "Kota Tarakan", "Kab. Bulungan", "Kab. Malinau", "Kab. Nunukan", "Kab. Tana Tidung",
  ] },
  { id: "sulawesi-utara", name: "Sulawesi Utara", timezone: "Asia/Makassar", regencies: [
    "Kota Manado", "Kota Bitung", "Kota Tomohon", "Kota Kotamobagu", "Kab. Minahasa",
    "Kab. Minahasa Utara", "Kab. Minahasa Selatan", "Kab. Minahasa Tenggara",
    "Kab. Bolaang Mongondow", "Kab. Bolaang Mongondow Utara", "Kab. Bolaang Mongondow Selatan",
    "Kab. Bolaang Mongondow Timur", "Kab. Kepulauan Sangihe", "Kab. Kepulauan Siau Tagulandang Biaro",
    "Kab. Kepulauan Talaud",
  ] },
  { id: "gorontalo", name: "Gorontalo", timezone: "Asia/Makassar", regencies: [
    "Kota Gorontalo", "Kab. Gorontalo", "Kab. Bone Bolango", "Kab. Boalemo", "Kab. Pohuwato",
    "Kab. Gorontalo Utara",
  ] },
  { id: "sulawesi-tengah", name: "Sulawesi Tengah", timezone: "Asia/Makassar", regencies: [
    "Kota Palu", "Kab. Donggala", "Kab. Poso", "Kab. Morowali", "Kab. Morowali Utara", "Kab. Banggai",
    "Kab. Banggai Kepulauan", "Kab. Banggai Laut", "Kab. Toli-Toli", "Kab. Buol", "Kab. Parigi Moutong",
    "Kab. Tojo Una-Una", "Kab. Sigi",
  ] },
  { id: "sulawesi-barat", name: "Sulawesi Barat", timezone: "Asia/Makassar", regencies: [
    "Kab. Mamuju", "Kab. Mamuju Tengah", "Kab. Majene", "Kab. Polewali Mandar", "Kab. Mamasa",
    "Kab. Pasangkayu",
  ] },
  { id: "sulawesi-selatan", name: "Sulawesi Selatan", timezone: "Asia/Makassar", regencies: [
    "Kota Makassar", "Kota Parepare", "Kota Palopo", "Kab. Gowa", "Kab. Maros", "Kab. Takalar",
    "Kab. Jeneponto", "Kab. Bantaeng", "Kab. Bulukumba", "Kab. Sinjai", "Kab. Bone", "Kab. Soppeng",
    "Kab. Wajo", "Kab. Sidenreng Rappang", "Kab. Pinrang", "Kab. Enrekang", "Kab. Luwu",
    "Kab. Luwu Utara", "Kab. Luwu Timur", "Kab. Tana Toraja", "Kab. Toraja Utara",
    "Kab. Pangkajene dan Kepulauan", "Kab. Barru", "Kab. Kepulauan Selayar",
  ] },
  { id: "sulawesi-tenggara", name: "Sulawesi Tenggara", timezone: "Asia/Makassar", regencies: [
    "Kota Kendari", "Kota Baubau", "Kab. Konawe", "Kab. Konawe Selatan", "Kab. Konawe Utara",
    "Kab. Konawe Kepulauan", "Kab. Kolaka", "Kab. Kolaka Utara", "Kab. Kolaka Timur", "Kab. Bombana",
    "Kab. Muna", "Kab. Muna Barat", "Kab. Buton", "Kab. Buton Tengah", "Kab. Buton Selatan",
    "Kab. Buton Utara", "Kab. Wakatobi",
  ] },
  { id: "maluku", name: "Maluku", timezone: "Asia/Jayapura", regencies: [
    "Kota Ambon", "Kota Tual", "Kab. Maluku Tengah", "Kab. Maluku Tenggara", "Kab. Maluku Barat Daya",
    "Kab. Buru", "Kab. Buru Selatan", "Kab. Seram Bagian Barat", "Kab. Seram Bagian Timur",
    "Kab. Kepulauan Aru", "Kab. Kepulauan Tanimbar",
  ] },
  { id: "maluku-utara", name: "Maluku Utara", timezone: "Asia/Jayapura", regencies: [
    "Kota Ternate", "Kota Tidore Kepulauan", "Kab. Halmahera Barat", "Kab. Halmahera Tengah",
    "Kab. Halmahera Utara", "Kab. Halmahera Selatan", "Kab. Halmahera Timur", "Kab. Kepulauan Sula",
    "Kab. Pulau Taliabu", "Kab. Pulau Morotai",
  ] },
  { id: "papua", name: "Papua", timezone: "Asia/Jayapura", regencies: [
    "Kota Jayapura", "Kab. Jayapura", "Kab. Keerom", "Kab. Sarmi", "Kab. Waropen", "Kab. Supiori",
    "Kab. Biak Numfor", "Kab. Kepulauan Yapen", "Kab. Mamberamo Raya",
  ] },
  { id: "papua-barat", name: "Papua Barat", timezone: "Asia/Jayapura", regencies: [
    "Kab. Manokwari", "Kab. Manokwari Selatan", "Kab. Teluk Bintuni", "Kab. Teluk Wondama",
    "Kab. Kaimana", "Kab. Pegunungan Arfak",
  ] },
  { id: "papua-barat-daya", name: "Papua Barat Daya", timezone: "Asia/Jayapura", regencies: [
    "Kota Sorong", "Kab. Sorong", "Kab. Sorong Selatan", "Kab. Raja Ampat", "Kab. Tambrauw",
    "Kab. Maybrat",
  ] },
  { id: "papua-selatan", name: "Papua Selatan", timezone: "Asia/Jayapura", regencies: [
    "Kab. Merauke", "Kab. Boven Digoel", "Kab. Mappi", "Kab. Asmat",
  ] },
  { id: "papua-tengah", name: "Papua Tengah", timezone: "Asia/Jayapura", regencies: [
    "Kab. Nabire", "Kab. Mimika", "Kab. Paniai", "Kab. Dogiyai", "Kab. Deiyai", "Kab. Intan Jaya",
    "Kab. Puncak", "Kab. Puncak Jaya",
  ] },
  { id: "papua-pegunungan", name: "Papua Pegunungan", timezone: "Asia/Jayapura", regencies: [
    "Kab. Jayawijaya", "Kab. Lanny Jaya", "Kab. Tolikara", "Kab. Yalimo", "Kab. Mamberamo Tengah",
    "Kab. Nduga", "Kab. Pegunungan Bintang", "Kab. Yahukimo",
  ] },
];

/** One pickable region, shaped for `SearchableMultiSelect`. */
export interface RegionOption {
  value: string;
  label: string;
  keywords: readonly string[];
}

const timezoneNames: Record<RegionTimezone, string> = {
  "Asia/Jakarta": "WIB",
  "Asia/Makassar": "WITA",
  "Asia/Jayapura": "WIT",
};

export function timezoneShortName(timezone: RegionTimezone): string {
  return timezoneNames[timezone];
}

/** Short label for any stored timezone string, including ones outside the three zoned provinces. */
export function zoneLabel(timezone: string): string {
  return timezone in timezoneNames
    ? timezoneNames[timezone as RegionTimezone]
    : timezone.split("/").pop() ?? timezone;
}

/** Options for the provinsi picker, alphabetical so the chip row reads predictably. */
export const provinceOptions: RegionOption[] = provinces.map((province) => ({
  value: province.id,
  label: province.name,
  keywords: [timezoneShortName(province.timezone)],
}));

/**
 * Sub wilayah options for the picked provinsi only, so a tenant can never base
 * operations on a kabupaten it did not open a province for.
 */
export function regencyOptions(provinceIds: readonly string[]): RegionOption[] {
  const picked = provinces.filter((province) => provinceIds.includes(province.id));
  return picked.flatMap((province) =>
    province.regencies.map((regency) => ({
      value: `${province.id}|${regency}`,
      label: regency,
      keywords: [province.name, timezoneShortName(province.timezone)],
    }))
  );
}

/** Timezone each picked provinsi runs on, for the summary line. */
export function timezonesOf(provinceIds: readonly string[]): RegionTimezone[] {
  const seen = new Set<RegionTimezone>();
  for (const province of provinces) {
    if (provinceIds.includes(province.id)) seen.add(province.timezone);
  }
  return [...seen];
}