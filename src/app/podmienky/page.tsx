import LegalLayout from "@/components/layout/LegalLayout";

export const metadata = {
  title: "Obchodné podmienky | Unifyo",
  description: "Obchodné podmienky používania platformy Unifyo od spoločnosti ALAN RAMPÁČEK s. r. o.",
};

export default function PodmienkyPage() {
  return (
    <LegalLayout
      badge="Obchodné podmienky"
      title="Obchodné podmienky"
      subtitle="Tieto všeobecné obchodné podmienky upravujú práva a povinnosti zmluvných strán pri využívaní platformy Unifyo prevádzkovanej spoločnosťou ALAN RAMPÁČEK s. r. o."
      lastUpdated="13. apríla 2025"
      sections={[
        {
          title: "Identifikácia prevádzkovateľa",
          content: [
            `Obchodné meno: ALAN RAMPÁČEK s. r. o.`,
            `Sídlo: Námestie Martina Benku 6302/10, 811 07 Bratislava – mestská časť Staré Mesto`,
            `IČO: 56 908 377`,
            `DIČ: 2122501381`,
            `IČ DPH: SK2122501381 (registrácia od 19. 3. 2026 podľa §7a zákona o DPH)`,
            `Zápis: Obchodný register Mestského súdu Bratislava III, oddiel: Sro, vložka č. 187159/B`,
            `Email: info@unifyo.online`,
            `(ďalej len "Poskytovateľ")`,
          ],
        },
        {
          title: "Úvodné ustanovenia a rozsah pôsobnosti",
          content: `Tieto Všeobecné obchodné podmienky (ďalej len "VOP") upravujú vzájomné práva a povinnosti medzi spoločnosťou ALAN RAMPÁČEK s. r. o. (Poskytovateľ) a fyzickými alebo právnickými osobami (ďalej len "Používateľ"), ktoré využívajú softvér ako službu (SaaS) Unifyo dostupnú na adrese unifyo.online. Tieto VOP boli vypracované v súlade so zákonom č. 513/1991 Zb. (Obchodný zákonník), zákonom č. 40/1964 Zb. (Občiansky zákonník) a zákonom č. 102/2014 Z. z. o ochrane spotrebiteľa pri predaji tovaru alebo poskytovaní služieb na diaľku. Používaním platformy Používateľ potvrdzuje, že si tieto VOP prečítal, porozumel im a bezvýhradne s nimi súhlasí.`,
        },
        {
          title: "Registrácia a používateľský účet",
          content: [
            "Používateľ je povinný uviesť pri registrácii pravdivé, úplné a aktuálne informácie. Uvedenie nepravdivých údajov zakladá právo Poskytovateľa na okamžité zrušenie účtu.",
            "Za dôvernosť a bezpečnosť prihlasovacích údajov (meno, heslo) zodpovedá výhradne Používateľ. Poskytovateľ nenesie zodpovednosť za škody spôsobené neoprávneným prístupom v dôsledku zanedbania ochrany prihlasovacích údajov.",
            "Každá fyzická alebo právnická osoba môže mať zriadený iba jeden bezplatný účet. Viacero účtov vytvorených s cieľom obísť obmedzenia bezplatného plánu môže byť bez upozornenia zrušených.",
            "Používateľ musí byť fyzická osoba staršia ako 18 rokov alebo právnická osoba zastúpená oprávnenou osobou.",
            "Poskytovateľ si vyhradzuje právo zrušiť alebo pozastaviť účet, ktorý porušuje tieto VOP, a to bez nároku Používateľa na akúkoľvek kompenzáciu.",
          ],
        },
        {
          title: "Ceny, platby a fakturácia",
          content: [
            "Platené predplatné sa účtuje vopred za zvolené fakturačné obdobie (mesačne alebo ročne). Ceny sú uvedené na stránke unifyo.online/cennik.",
            "Všetky ceny sú uvedené v eurách (€). Ak je Používateľ platiteľom DPH, cena môže byť navýšená o príslušnú sadzbu DPH v súlade s platnými právnymi predpismi SR a EÚ.",
            "Platby sú spracovávané výlučne prostredníctvom certifikovanej platobnej brány Stripe, Inc. Poskytovateľ nemá prístup k číslu platobnej karty ani iným citlivým platobným údajom.",
            "Elektronická faktúra (daňový doklad) je vystavená do 24 hodín od úspešného spracovania platby a zaslaná na emailovú adresu Používateľa.",
            "V prípade neúspešnej platby bude Používateľ informovaný emailom. Na úhradu má 7 kalendárnych dní, po uplynutí ktorých môže byť prístup do platenej časti služby obmedzený.",
            "Ceny predplatného sa môžu zmeniť. O zmene bude Používateľ informovaný emailom aspoň 30 dní vopred.",
          ],
        },
        {
          title: "Právo na odstúpenie od zmluvy a vrátenie platby",
          content: [
            "V súlade so zákonom č. 102/2014 Z. z. má spotrebiteľ právo odstúpiť od zmluvy uzatvorenej na diaľku bez uvedenia dôvodu do 14 kalendárnych dní od jej uzatvorenia, pokiaľ ešte nezačalo plnenie služby so súhlasom spotrebiteľa.",
            "Ak Používateľ výslovne požiadal o začatie poskytovania služby pred uplynutím 14-dňovej lehoty (napr. okamžitým aktivovaním účtu), stráca právo na odstúpenie podľa §7 ods. 6 písm. l) zákona č. 102/2014 Z. z.",
            "Predplatné je možné zrušiť kedykoľvek priamo v nastaveniach účtu. Zrušenie nadobúda účinnosť uplynutím aktuálneho fakturačného obdobia; po tomto dátume sa predplatné ďalej neobnovuje.",
            "Pri ročnom predplatnom má Používateľ, ktorý nie je spotrebiteľom, právo na vrátenie pomernej časti ceny za nevyužité celé mesiace, ak o vrátenie požiada do 14 dní od zaplatenia.",
            "Žiadosti o vrátenie platby zasielajte na info@unifyo.online s uvedením čísla faktúry.",
          ],
        },
        {
          title: "Zakázané konanie Používateľa",
          content: [
            "Používateľ nesmie platformu využívať na rozosielanie nevyžiadaných obchodných správ (spam) ani na akúkoľvek inú činnosť v rozpore s platnými právnymi predpismi SR a EÚ.",
            "Je zakázané pokúšať sa o neoprávnený prístup do systémov Poskytovateľa, databáz iných Používateľov alebo akejkoľvek inej časti infraštruktúry platformy.",
            "Ďalší predaj, sublicencovanie, prenájom alebo iné komerčné využitie platformy bez predchádzajúceho písomného súhlasu Poskytovateľa je prísne zakázané.",
            "Automatizované sťahovanie obsahu platformy (web scraping) bez výslovného písomného súhlasu je zakázané.",
            "Používateľ nesmie platformu využívať spôsobom, ktorý by mohol poškodiť technickú infraštruktúru alebo povesť Poskytovateľa.",
          ],
        },
        {
          title: "Duševné vlastníctvo",
          content: `Všetky práva duševného vlastníctva k platforme Unifyo – vrátane, ale nie výlučne, softvéru, zdrojového kódu, algoritmov, databázových štruktúr, dizajnu, grafiky, textov, ochranných známok a loga – sú výhradným vlastníctvom spoločnosti ALAN RAMPÁČEK s. r. o. Uzatvorením zmluvy Používateľ nezískava žiadne vlastnícke práva k platforme. Poskytovateľ udeľuje Používateľovi iba obmedzené, nevýhradné, neprenosné a odvolateľné právo na používanie platformy v rozsahu zodpovedajúcom zvolenému predplatnému plánu. Obsah vytvorený a nahraný Používateľom do platformy zostáva výhradným vlastníctvom Používateľa.`,
        },
        {
          title: "Dostupnosť služby a SLA",
          content: [
            "Poskytovateľ sa zaväzuje zabezpečiť dostupnosť platformy na úrovni 99,5 % meranú mesačne, s výnimkou plánovaných servisných odstávok, o ktorých bude Používateľ informovaný vopred.",
            "Plánované odstávky sa spravidla realizujú mimo pracovných hodín (22:00 – 06:00 SEČ) a sú vopred oznámené emailom alebo na stavovej stránke.",
            "Poskytovateľ nezodpovedá za nedostupnosť spôsobenú okolnosťami mimo jeho kontroly (vyššia moc, výpadky tretích strán, útoky DDoS a pod.).",
          ],
        },
        {
          title: "Obmedzenie zodpovednosti",
          content: [
            "Platforma Unifyo je poskytovaná v stave 'ako je' (as-is). Poskytovateľ nezaručuje, že platforma bude vyhovovať špecifickým požiadavkám každého Používateľa, ani že bude bezchybná.",
            "Celková zodpovednosť Poskytovateľa voči Používateľovi za akékoľvek škody vyplývajúce z používania alebo nemožnosti používania platformy je obmedzená na výšku poplatkov uhradených Používateľom za posledných 12 mesiacov.",
            "Poskytovateľ v žiadnom prípade nezodpovedá za nepriame, náhodné, osobitné ani následné škody vrátane ušlého zisku, straty dát alebo poškodenia dobrého mena.",
          ],
        },
        {
          title: "Ochrana osobných údajov (GDPR)",
          content: `Spracúvanie osobných údajov Používateľov prebieha v súlade s Nariadením (EÚ) 2016/679 (GDPR) a zákonom č. 18/2018 Z. z. o ochrane osobných údajov. Podrobné informácie o spracúvaní osobných údajov, právnych základoch, právach dotknutých osôb a kontaktných údajoch prevádzkovateľa sú uvedené v samostatnom dokumente Zásady ochrany osobných údajov dostupnom na unifyo.online/sukromie.`,
        },
        {
          title: "Zmeny VOP",
          content: "Poskytovateľ si vyhradzuje právo tieto VOP kedykoľvek zmeniť. O každej podstatnej zmene bude Používateľ informovaný emailom zaslaným na adresu uvedenú pri registrácii, a to aspoň 30 dní pred nadobudnutím účinnosti zmeny. Pokračovaním v používaní platformy po nadobudnutí účinnosti zmien Používateľ vyjadruje súhlas s novými VOP. Ak Používateľ so zmenou nesúhlasí, je oprávnený vypovedať zmluvu pred nadobudnutím účinnosti zmeny.",
        },
        {
          title: "Rozhodné právo a riešenie sporov",
          content: [
            "Tieto VOP sa riadia a vykladajú v súlade s právnym poriadkom Slovenskej republiky.",
            "V prípade sporu sa zmluvné strany zaväzujú pokúsiť sa o jeho mimosúdne vyriešenie vzájomnou dohodou v lehote 30 dní od doručenia písomného upozornenia druhej strane.",
            "Spotrebiteľ má právo na alternatívne riešenie sporov (ARS) prostredníctvom Slovenskej obchodnej inšpekcie (www.soi.sk) alebo iného subjektu ARS zapísaného v zozname Ministerstva hospodárstva SR, prípadne prostredníctvom platformy RSO (ec.europa.eu/consumers/odr).",
            "Na rozhodovanie sporov sú príslušné súdy Slovenskej republiky.",
          ],
        },
        {
          title: "Záverečné ustanovenia",
          content: [
            "Tieto VOP nadobúdajú platnosť a účinnosť dňom 13. apríla 2025.",
            "Ak je alebo sa stane niektoré ustanovenie týchto VOP neplatným alebo nevykonateľným, nemá to vplyv na platnosť ostatných ustanovení.",
            "Aktuálna verzia VOP je vždy dostupná na unifyo.online/podmienky.",
          ],
        },
      ]}
    />
  );
}
