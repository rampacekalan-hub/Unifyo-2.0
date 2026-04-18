import LegalLayout from "@/components/layout/LegalLayout";

export const metadata = {
  title: "Ochrana osobných údajov (GDPR) | Unifyo",
  description: "Zásady ochrany osobných údajov platformy Unifyo, prevádzkovanej spoločnosťou ALAN RAMPÁČEK s. r. o., v súlade s GDPR.",
};

export default function SukromiePage() {
  return (
    <LegalLayout
      badge="GDPR & Ochrana súkromia"
      title="Ochrana osobných údajov"
      subtitle="Informácie o spracúvaní osobných údajov v súlade s Nariadením (EÚ) 2016/679 (GDPR) a zákonom č. 18/2018 Z. z. o ochrane osobných údajov."
      lastUpdated="13. apríla 2025"
      sections={[
        {
          title: "Identifikácia prevádzkovateľa",
          content: [
            "Obchodné meno: ALAN RAMPÁČEK s. r. o.",
            "Sídlo: Námestie Martina Benku 6302/10, 811 07 Bratislava – mestská časť Staré Mesto",
            "IČO: 56 908 377 | DIČ: 2122501381 | IČ DPH: SK2122501381",
            "Zápis: Obchodný register Mestského súdu Bratislava III, oddiel: Sro, vložka č. 187159/B",
            "Kontaktný email: info@unifyo.online",
            "Prevádzkovateľ neurčil zodpovednú osobu (DPO), nakoľko nespĺňa kritériá čl. 37 GDPR. Všetky žiadosti dotknutých osôb vybavuje priamo prevádzkovateľ na adrese info@unifyo.online.",
          ],
        },
        {
          title: "Rozsah spracúvaných osobných údajov",
          content: [
            "Identifikačné a kontaktné údaje: meno, priezvisko, emailová adresa — získané pri registrácii alebo odoslaní kontaktného formulára.",
            "Prihlasovacie údaje: emailová adresa a hashované heslo (bcrypt/Argon2). Heslo v čitateľnej forme prevádzkovateľ nikdy neuchováva ani nepozná.",
            "Fakturačné údaje: fakturačná adresa, prípadne IČO/DIČ pre firemné účty. Číslo platobnej karty nie je spracúvané prevádzkovateľom — spracúva ho výlučne Stripe, Inc.",
            "Prevádzkové a technické údaje: IP adresa, typ a verzia prehliadača, operačný systém, čas prístupu, navštívené URL, logy chýb — zbierané automaticky za účelom bezpečnosti a výkonu.",
            "Obsah vytvorený používateľom: kontakty, emailové správy, záznamy hovorov, CRM pipeline — údaje, ktoré Používateľ dobrovoľne vkladá do platformy.",
          ],
        },
        {
          title: "Právne základy spracúvania",
          content: [
            "Čl. 6 ods. 1 písm. b GDPR — plnenie zmluvy: spracúvanie nevyhnutné na poskytovanie platformy Unifyo a správu používateľského účtu.",
            "Čl. 6 ods. 1 písm. c GDPR — zákonná povinnosť: uchovávanie účtovných dokladov a daňových záznamov podľa zákona č. 431/2002 Z. z. o účtovníctve (10 rokov).",
            "Čl. 6 ods. 1 písm. f GDPR — oprávnený záujem: zaistenie bezpečnosti systému, predchádzanie podvodom, prevencia zneužívania, analytika výkonu služby.",
            "Čl. 6 ods. 1 písm. a GDPR — súhlas: zasielanie produktových noviniek a marketingových informácií emailom. Súhlas je dobrovoľný a odvolateľný kedykoľvek.",
          ],
        },
        {
          title: "Doba uchovávania osobných údajov",
          content: [
            "Údaje používateľského účtu: po dobu trvania zmluvného vzťahu a 3 roky po jeho ukončení (premlčacia doba).",
            "Fakturačné záznamy a daňové doklady: 10 rokov od vystavenia v súlade so zákonom o účtovníctve.",
            "Prevádzkové logy (IP, prístupy): 90 dní od zaznamenania.",
            "Obsah vytvorený používateľom: vymazaný do 30 dní od zrušenia účtu, pokiaľ nie je zákonný dôvod na dlhšie uchovávanie.",
            "Marketingové preferencie (súhlas): do odvolania súhlasu.",
          ],
        },
        {
          title: "Príjemcovia a cezhraničný prenos osobných údajov",
          content: [
            "Stripe, Inc. (USA) — spracovanie platieb; prenos do USA na základe štandardných zmluvných doložiek EÚ (SCCs) a certifikácie PCI DSS Level 1.",
            "Hetzner Online GmbH (Nemecko) — hosting aplikácie a databázy; dátové centrá v EÚ (Nürnberg / Falkenstein), GDPR súlad.",
            "Websupport, s.r.o. (Slovensko) — doručovanie transakčných emailov (overenie účtu, reset hesla); SMTP služba, prevádzkovateľ v EÚ.",
            "Poskytovatelia AI (napr. OpenAI, Anthropic) — spracovanie AI požiadaviek; minimalizácia dát, žiadne trvalé uchovávanie obsahu na strane AI.",
            "Osobné údaje nie sú predávané ani poskytované tretím stranám na marketingové alebo iné komerčné účely.",
            "Prevádzkovateľ zabezpečuje, že všetci sprostredkovatelia sú zmluvne zaviazaní chrániť osobné údaje v súlade s GDPR.",
          ],
        },
        {
          title: "Práva dotknutej osoby",
          content: [
            "Právo na prístup (čl. 15 GDPR) — právo získať potvrdenie o spracúvaní a kópiu spracúvaných osobných údajov.",
            "Právo na opravu (čl. 16 GDPR) — právo na opravu nesprávnych alebo doplnenie neúplných osobných údajov.",
            "Právo na vymazanie / zabudnutie (čl. 17 GDPR) — právo na vymazanie osobných údajov, ak pominul účel spracúvania alebo bol odvolaný súhlas.",
            "Právo na obmedzenie spracúvania (čl. 18 GDPR) — právo požadovať dočasné obmedzenie spracúvania počas preskúmania námietky.",
            "Právo na prenosnosť (čl. 20 GDPR) — právo získať údaje v strojovo čitateľnom formáte (JSON/CSV) a preniesť ich inému prevádzkovateľovi.",
            "Právo namietať (čl. 21 GDPR) — právo namietať spracúvanie na základe oprávneného záujmu prevádzkovateľa.",
            "Právo odvolať súhlas — súhlas s marketingom možno odvolať kedykoľvek kliknutím na odkaz v emaile alebo kontaktovaním info@unifyo.online.",
            "Právo podať sťažnosť — na Úrad na ochranu osobných údajov SR, Hraničná 12, 820 07 Bratislava, www.dataprotection.gov.sk.",
            "Žiadosti o uplatnenie práv zasielajte na: info@unifyo.online. Prevádzkovateľ odpovie do 30 dní.",
          ],
        },
        {
          title: "Bezpečnosť osobných údajov",
          content: [
            "Všetka komunikácia medzi Používateľom a platformou je šifrovaná protokolom TLS 1.3.",
            "Osobné údaje uložené v databáze sú šifrované pomocou AES-256.",
            "Prístup k osobným údajom majú iba oprávnené osoby prevádzkovateľa na základe princípu minimálnych oprávnení (least privilege).",
            "Prevádzkovateľ vykonáva pravidelné zálohy a testuje obnovu dát.",
            "V prípade bezpečnostného incidentu ovplyvňujúceho práva a slobody Používateľov bude prevádzkovateľ postupovať podľa čl. 33–34 GDPR (hlásenie incidentu dozornému orgánu do 72 hodín, prípadne informovanie dotknutých osôb).",
          ],
        },
        {
          title: "Automatizované rozhodovanie a profilovanie",
          content: "Platforma Unifyo nevykonáva automatizované rozhodovanie ani profilovanie v zmysle čl. 22 GDPR, ktoré by malo právne alebo iné závažné účinky na Používateľov.",
        },
        {
          title: "Cookies a podobné technológie",
          content: "Na platforme sú používané súbory cookies. Podrobné informácie o typoch cookies, ich účele a správe sú uvedené v samostatnom dokumente Zásady cookies dostupnom na unifyo.online/cookies.",
        },
        {
          title: "Zmeny tohto dokumentu",
          content: "Prevádzkovateľ si vyhradzuje právo tieto Zásady kedykoľvek aktualizovať. O podstatných zmenách bude Používateľ informovaný emailom aspoň 14 dní pred nadobudnutím ich účinnosti. Aktuálna verzia je vždy dostupná na unifyo.online/sukromie.",
        },
      ]}
    />
  );
}
