# Demo Plan: InteriorIdeas.ai

## 1. Qka eshte projekti dhe kujt i sherben

InteriorIdeas.ai eshte nje aplikacion web qe perdor AI per te gjeneruar ide te personalizuara te dizajnit te brendshem. Projekti u sherben:

- studenteve te dizajnit te brendshem
- pronareve te shtepive ose banesave
- personave qe duan ide te shpejta para renovimit
- agjenteve ose profesionisteve qe duan koncepte vizuale me shpejt

Vlera kryesore eshte se perdoruesi jep preferencat e tij dhe sistemi kthen nje koncept te plote: pershkrim, elemente kyce, mobilje me cmime, keshilla per ngjyra, foto inspiruese dhe mundesi ruajtjeje.

## 2. Live URL

Live URL per demo:

`https://interiorideas-ai.vercel.app`

Verifikuar me 26 Prill 2026:

- `/` kthen `HTTP 200`
- `/login` kthen `HTTP 200`
- `npm run build` kalon lokalisht

## 3. Flow kryesor qe do ta demonstroj

Ky eshte flow me i mire sepse tregon vleren e produktit nga fillimi deri ne fund pa humbur kohe.

### Hapi 1 - Hyrja ne sistem (rreth 45 sekonda)

- Hap live URL
- Tregoj faqen `/login`
- Shpjegoj shkurt se dashboard-i kryesor eshte i mbrojtur me autentikim ne Supabase

### Hapi 2 - Krijimi i nje koncepti me AI (rreth 2 minuta)

- Kycem ne sistem
- Zgjedh:
  - room type
  - style
  - palette
  - budget
  - extra notes
- Klikoj `Generate`
- Shpjegoj se kerkesa shkon te API route dhe modeli i AI kthen JSON te strukturuar per konceptin

### Hapi 3 - Rezultati i gjeneruar (rreth 1 minute e 30 sekonda)

- Tregoj titullin dhe pershkrimin e konceptit
- Tregoj mobiljet e propozuara me cmime
- Tregoj keshillat per ngjyra dhe pro tip
- Tregoj fotografite inspiruese nga Unsplash
- Theksoj qe perdoruesi merr nje ide konkrete, jo vetem tekst te pergjithshem

### Hapi 4 - Ruajtja dhe rihapja e dizajnit (rreth 1 minute)

- Klikoj `Save`
- Kaloj te `Gallery`
- Hap nje dizajn te ruajtur per te treguar se te dhenat ruhen ne databaze dhe mund te riperdoren

### Hapi 5 - Analytics dhe mbyllja e demos (rreth 45 sekonda)

- Kaloj te `Analytics`
- Tregoj totalin e dizajneve dhe stilin/hapsiren me te perdorur
- Mbyll demo-n me `PDF export` ose me rikthim te rezultati i ruajtur

## 4. Cilat pjese teknike do t'i shpjegoj shkurt

Nuk do te hyj ne detaje te panevojshme. Do te shpjegoj vetem pjeset qe tregojne si funksionon sistemi:

1. Frontend: Next.js App Router me faqe per login, dashboard dhe update-password.
2. Authentication: Supabase Auth per sign in, sign up, sign out dhe reset password.
3. Database: Supabase ruan dizajnet e perdoruesit ne tabelen `designs`.
4. AI generation: `app/api/generate/route.js` dergon preferencat e perdoruesit te Groq dhe pret JSON te strukturuar.
5. Media inspiration: Unsplash perdoret per foto referuese sipas stilit dhe tipit te dhomes.
6. Extra value: perdoruesi mund ta ruaje dizajnin, ta rihape dhe ta eksportoje si PDF.

## 5. Cfare do te them ne prezantim per vleren e projektit

Mesazhi kryesor i prezantimit:

"Ky projekt e shkurton kohen nga ideja fillestare deri te nje koncept i qarte i dizajnit te brendshem. Ne vend qe perdoruesi te kerkoje manualisht stile, mobilje dhe kombinime ngjyrash, aplikacioni i gjeneron ne nje rrjedhe te vetme dhe i ruan per perdorim te metejshem."

## 6. Cfare kam kontrolluar para demos

Para demos do te kontrolloj gjithmone keto pika:

- live URL hapet normalisht
- route `/login` hapet normalisht
- account-i testues mund te kycet
- Supabase env vars jane te konfiguruara
- gjenerimi me AI funksionon
- ruajtja ne Supabase funksionon
- `Gallery` i shfaq dizajnet e ruajtura
- `Analytics` i lexon te dhenat ekzistuese
- `PDF export` hapet pa problem
- interneti dhe browser-i jane gati
- kam nje prompt te parapergatitur per demo qe te mos humbas kohe duke menduar aty per aty

## 7. Plani B nese live demo deshton

Nese live demo deshton, nuk do te improvizoj pa plan. Do te veproj keshtu:

1. Hap direkt nje dizajn te ruajtur nga `Gallery` dhe vazhdoj demonstrimin nga aty.
2. Nese AI generation eshte i ngadalte ose API deshton, tregoj nje rezultat te ruajtur paraprakisht dhe shpjegoj flow-n normal.
3. Nese ka problem me login, perdor screenshot ose page te hapur paraprakisht per te treguar UI dhe funksionet.
4. Nese live URL ka problem, e tregoj projektin nga mjedisi lokal si fallback.
5. Nese nuk funksionon as interneti, fokusin e kaloj te arkitektura, kodi dhe rezultatet e ruajtura paraprakisht.

## 8. Organizimi i prezantimit 5-7 minuta

0:00 - 0:45  
Hyrje: cfare eshte projekti dhe kujt i sherben

0:45 - 2:45  
Login dhe krijimi i nje dizajni te ri

2:45 - 4:15  
Shfaqja e rezultatit te gjeneruar nga AI

4:15 - 5:15  
Ruajtja ne Gallery dhe rihapja e dizajnit

5:15 - 6:00  
Analytics dhe eksporti PDF

6:00 - 6:30  
Shpjegimi i shkurter teknik dhe mbyllja

## 9. Pse ky plan eshte i forte per prezantim

- tregon qarte vleren e projektit
- demonstron flow-n me te rendesishem nga kendveshtrimi i perdoruesit
- perfshin pjesen teknike pa u humbur ne detaje
- ka fallback real ne rast problemi
- eshte i organizuar me kohe dhe hapa konkrete
