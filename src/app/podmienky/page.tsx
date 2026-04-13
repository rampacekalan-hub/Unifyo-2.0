import LegalLayout from "@/components/layout/LegalLayout";

export const metadata = {
  title: "Obchodné podmienky | Unifyo",
  description: "Obchodné podmienky používania platformy Unifyo.",
};

export default function PodmienkyPage() {
  return (
    <LegalLayout
      badge="Právne dokumenty"
      title="Obchodné podmienky"
      subtitle="Tieto obchodné podmienky upravujú používanie platformy Unifyo. Prečítajte si ich pozorne pred začatím používania služby."
      lastUpdated="13. apríla 2025"
      sections={[
        {
          title: "Všeobecné ustanovenia",
          content: `Tieto Obchodné podmienky (ďalej len "Podmienky") upravujú vzájomné práva a povinnosti medzi spoločnosťou Unifyo (ďalej len "Poskytovateľ") a fyzickými alebo právnickými osobami (ďalej len "Používateľ"), ktoré využívajú platformu Unifyo dostupnú na adrese unifyo.online. Používaním platformy Používateľ potvrdzuje, že si tieto Podmienky prečítal, porozumel im a súhlasí s nimi.`,
        },
        {
          title: "Registrácia a účet",
          content: [
            "Používateľ je povinný uviesť pri registrácii pravdivé, úplné a aktuálne informácie.",
            "Za bezpečnosť prihlasovacích údajov zodpovedá výhradne Používateľ.",
            "Jeden Používateľ môže vlastniť iba jeden účet. Zdieľanie prístupu viacerými osobami je v rámci plateného plánu povolené podľa podmienok zvoleného plánu.",
            "Poskytovateľ si vyhradzuje právo zrušiť účet, ktorý porušuje tieto Podmienky.",
          ],
        },
        {
          title: "Platby a fakturácia",
          content: [
            "Platené plány sa účtujú vopred, mesačne alebo ročne podľa zvoleného fakturačného cyklu.",
            "Všetky ceny sú uvedené v eurách (€) a nezahŕňajú DPH, pokiaľ nie je uvedené inak.",
            "Platby sú spracovávané prostredníctvom certifikovaných platobných brán (Stripe). Poskytovateľ nemá prístup k údajom platobných kariet.",
            "Faktúra je vystavená elektronicky a zaslaná na email Používateľa po každej úspešnej platbe.",
            "V prípade neúspešnej platby bude Používateľ upozornený a bude mu poskytnutá 7-dňová lehota na úhradu pred znížením funkčnosti účtu.",
          ],
        },
        {
          title: "Zrušenie a vrátenie platby",
          content: [
            "Predplatné je možné zrušiť kedykoľvek z nastavení účtu. Zrušenie nadobúda účinnosť po uplynutí aktuálneho fakturačného obdobia.",
            "Pri ročnom predplatnom má Používateľ právo na vrátenie pomernej časti ceny za nevyčerpané mesiace do 30 dní od prvého nákupu.",
            "Vrátenie platby sa nevzťahuje na mesačné predplatné po tom, čo bola platba spracovaná.",
          ],
        },
        {
          title: "Zakázané použitie",
          content: [
            "Používateľ nesmie používať platformu na rozosielanie spamu, nevyžiadaných správ alebo na akékoľvek nezákonné aktivity.",
            "Je zakázané pokúšať sa o neoprávnený prístup do systémov Poskytovateľa alebo iných účtov.",
            "Ďalší predaj, sublicencovanie alebo komerčné využitie platformy bez písomného súhlasu Poskytovateľa je zakázané.",
            "Automatizované sťahovanie obsahu (scraping) je zakázané, pokiaľ to nie je povolené prostredníctvom API.",
          ],
        },
        {
          title: "Duševné vlastníctvo",
          content: "Všetky práva duševného vlastníctva k platforme Unifyo, vrátane softvéru, dizajnu, textov, loga a ochranných známok, patria výhradne Poskytovateľovi. Používateľ získava len obmedzené, neprenosné právo na používanie platformy v súlade s týmito Podmienkami. Obsah vytvorený Používateľom zostáva vo vlastníctve Používateľa.",
        },
        {
          title: "Dostupnosť služby",
          content: "Poskytovateľ sa zaväzuje poskytovať platformu s dostupnosťou 99,9 % (SLA) za mesačné fakturačné obdobie, s výnimkou plánovaných odstávok, ktoré budú vopred oznámené. V prípade výpadkov Poskytovateľ nie je zodpovedný za nepriame škody ani ušlý zisk.",
        },
        {
          title: "Zodpovednosť",
          content: "Celková zodpovednosť Poskytovateľa voči Používateľovi je obmedzená na výšku poplatkov zaplatených Používateľom za posledných 12 mesiacov. Poskytovateľ nenesie zodpovednosť za nepriame, náhodné ani následné škody.",
        },
        {
          title: "Zmeny podmienok",
          content: "Poskytovateľ si vyhradzuje právo tieto Podmienky kedykoľvek zmeniť. O podstatných zmenách budú Používatelia informovaní emailom aspoň 14 dní vopred. Pokračovaním v používaní platformy po nadobudnutí účinnosti zmien Používateľ vyjadruje súhlas s novými Podmienkami.",
        },
        {
          title: "Rozhodné právo",
          content: "Tieto Podmienky sa riadia právnym poriadkom Slovenskej republiky. Akékoľvek spory budú riešené prednostne dohodou, prípadne príslušným súdom v Slovenskej republike.",
        },
      ]}
    />
  );
}
