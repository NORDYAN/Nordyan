import { DAILY_FOCUS_WHY_KEYS } from './daily-focus.constants';
import type { DailyFocusActionId } from './daily-focus-action-definitions';

type LocalizedPair = { readonly sv: string; readonly nb: string };

type ActionCopyEntry = {
  readonly title: LocalizedPair;
  readonly body: LocalizedPair;
};

export const DAILY_FOCUS_ACTION_COPY = {
  movement_take_stairs: {
    title: { sv: 'Ta trapporna idag', nb: 'Ta trappene i dag' },
    body: {
      sv: 'Välj trapporna i stället för hiss eller rulltrappa när det är praktiskt.',
      nb: 'Velg trappene i stedet for heis eller rulletrapp når det er praktisk.',
    },
  },
  movement_keep_using_stairs: {
    title: { sv: 'Fortsätt ta trapporna', nb: 'Fortsett å ta trappene' },
    body: {
      sv: 'Behåll vanan att ta trapporna när du har möjlighet.',
      nb: 'Behold vanen med å ta trappene når du har mulighet.',
    },
  },
  movement_park_farther: {
    title: { sv: 'Parkera en bit bort', nb: 'Parker et stykke unna' },
    body: {
      sv: 'Om du åker bil, parkera lite längre från målet och gå sista biten.',
      nb: 'Hvis du kjører, parker litt lenger fra målet og gå den siste biten.',
    },
  },
  movement_alight_one_stop_early: {
    title: { sv: 'Gå av en hållplats tidigare', nb: 'Gå av ett stopp tidligere' },
    body: {
      sv: 'Om du åker kollektivt, gå av en hållplats tidigare och gå resten när det passar.',
      nb: 'Hvis du reiser kollektivt, gå av ett stopp tidligere og gå resten når det passer.',
    },
  },
  movement_walk_part_of_errand: {
    title: { sv: 'Gå en del av ärendet', nb: 'Gå en del av ærendet' },
    body: {
      sv: 'Välj att gå en del av ett ärende i dag, i stället för att ta hela vägen stillasittande.',
      nb: 'Velg å gå en del av et ærend i dag, i stedet for å sitte hele veien.',
    },
  },
  movement_walk_a_short_trip: {
    title: { sv: 'Gå en kort sträcka', nb: 'Gå en kort strekning' },
    body: {
      sv: 'Välj att gå en kort sträcka du annars hade åkt, om det är rimligt i dag.',
      nb: 'Velg å gå en kort strekning du ellers ville ha kjørt, hvis det er rimelig i dag.',
    },
  },
  movement_stand_after_sitting: {
    title: { sv: 'Stå upp efter stillasittande', nb: 'Reis deg etter stillesitting' },
    body: {
      sv: 'Res dig och stå eller rör på dig en stund efter en längre sittperiod.',
      nb: 'Reis deg og stå eller beveg deg en stund etter en lengre sitteperiode.',
    },
  },
  movement_break_up_sitting: {
    title: { sv: 'Bryt stillasittandet', nb: 'Bryt stillesittingen' },
    body: {
      sv: 'Ta en kort rörelsepaus under dagen, även om den bara är ett par minuter.',
      nb: 'Ta en kort bevegelsespause i løpet av dagen, selv om den bare er et par minutter.',
    },
  },
  movement_walk_during_call: {
    title: { sv: 'Gå under ett samtal', nb: 'Gå under en samtale' },
    body: {
      sv: 'Om du har ett samtal eller möte där det går, gör det gående.',
      nb: 'Hvis du har en samtale eller et møte der det går, gjør det gående.',
    },
  },
  movement_after_meal_stroll: {
    title: { sv: 'Rör på dig efter maten', nb: 'Beveg deg etter maten' },
    body: {
      sv: 'Ta en kort promenad eller lätt rörelse efter en måltid i dag.',
      nb: 'Ta en kort gåtur eller lett bevegelse etter et måltid i dag.',
    },
  },
  movement_easy_outdoor_loop: {
    title: { sv: 'En lugn runda utomhus', nb: 'En rolig runde utendørs' },
    body: {
      sv: 'Ta en kort, lätt runda utomhus utan att jaga tempo eller distans.',
      nb: 'Ta en kort, lett runde utendørs uten å jage tempo eller distanse.',
    },
  },
  movement_active_household_task: {
    title: { sv: 'Ett aktivt hushållsjobb', nb: 'En aktiv husoppgave' },
    body: {
      sv: 'Välj en vardagssyssla som får dig att röra på dig, till exempel städning eller trädgård.',
      nb: 'Velg en hverdagsoppgave som får deg til å bevege deg, for eksempel rydding eller hagearbeid.',
    },
  },
  movement_move_while_waiting: {
    title: { sv: 'Rör dig medan du väntar', nb: 'Beveg deg mens du venter' },
    body: {
      sv: 'Stå, gå på stället eller ta några steg när du väntar i kö eller på någon.',
      nb: 'Stå, gå på stedet eller ta noen skritt når du venter i kø eller på noen.',
    },
  },
  movement_keep_usual_movement: {
    title: { sv: 'Behåll din vardagsrörelse', nb: 'Behold hverdagsbevegelsen din' },
    body: {
      sv: 'Gör den rörelse du redan brukar få in i vardagen, utan att lägga till mer.',
      nb: 'Gjør bevegelsen du allerede pleier å få inn i hverdagen, uten å legge til mer.',
    },
  },
  movement_one_walked_errand: {
    title: { sv: 'Ett ärende till fots', nb: 'Ett ærend til fots' },
    body: {
      sv: 'Ta ett kortare ärende till fots i dag om du har möjlighet.',
      nb: 'Ta et kortere ærend til fots i dag hvis du har mulighet.',
    },
  },
  movement_stand_for_one_task: {
    title: { sv: 'Stå under en uppgift', nb: 'Stå under en oppgave' },
    body: {
      sv: 'Stå upp under en kort uppgift, till exempel ett samtal eller arbete vid köksbänken.',
      nb: 'Stå under en kort oppgave, for eksempel en samtale eller arbeid ved kjøkkenbenken.',
    },
  },
  movement_skip_one_short_ride: {
    title: { sv: 'Hoppa över en kort skjuts', nb: 'Hopp over en kort skyss' },
    body: {
      sv: 'Välj att gå en sträcka du ofta tar med bil eller kollektivtrafik, när det är rimligt.',
      nb: 'Velg å gå en strekning du ofte tar med bil eller kollektivtrafikk, når det er rimelig.',
    },
  },
  movement_outdoor_reset_walk: {
    title: { sv: 'Gå ut en stund', nb: 'Gå ut en stund' },
    body: {
      sv: 'Gå ut en kort stund, utan krav på längd eller tempo.',
      nb: 'Gå ut en kort stund, uten krav til lengde eller tempo.',
    },
  },

  training_short_session: {
    title: { sv: 'Kör ett kort pass', nb: 'Kjør en kort økt' },
    body: {
      sv: 'Gör ett kort träningspass i dag, i en nivå som känns hanterbar.',
      nb: 'Gjør en kort treningsøkt i dag, på et nivå som kjennes håndterbart.',
    },
  },
  training_ten_minute_start: {
    title: { sv: 'Börja med tio minuter', nb: 'Start med ti minutter' },
    body: {
      sv: 'Sätt i gång med ungefär tio minuter träning. Du får sluta där om det räcker.',
      nb: 'Sett i gang med omtrent ti minutter trening. Du kan stoppe der hvis det holder.',
    },
  },
  training_bodyweight_strength: {
    title: { sv: 'Enkel styrka med kroppen', nb: 'Enkel styrke med kroppen' },
    body: {
      sv: 'Gör några lugna styrkeövningar med kroppen som motstånd, utan att jaga max.',
      nb: 'Gjør noen rolige styrkeøvelser med kroppen som motstand, uten å jage maks.',
    },
  },
  training_simple_strength: {
    title: { sv: 'Ett par styrkeövningar', nb: 'Et par styrkeøvelser' },
    body: {
      sv: 'Välj ett par enkla styrkeövningar med det du har hemma, och gör dem lugnt.',
      nb: 'Velg et par enkle styrkeøvelser med det du har hjemme, og gjør dem rolig.',
    },
  },
  training_mobility_session: {
    title: { sv: 'Rörlighet i dag', nb: 'Bevegelighet i dag' },
    body: {
      sv: 'Ta en kort stund för rörlighet: höfter, axlar eller det som känns stelt.',
      nb: 'Ta en kort stund til bevegelighet: hofter, skuldre eller det som kjennes stivt.',
    },
  },
  training_lighter_today: {
    title: { sv: 'Välj en lättare variant', nb: 'Velg en lettere variant' },
    body: {
      sv: 'Om du tänkt träna, välj en lättare version i dag.',
      nb: 'Hvis du hadde tenkt å trene, velg en lettere versjon i dag.',
    },
  },
  training_plan_next_session: {
    title: { sv: 'Lägg in nästa pass', nb: 'Legg inn neste økt' },
    body: {
      sv: 'Bestäm när nästa träningspass ska ske och skriv in det.',
      nb: 'Bestem når neste treningsøkt skal skje, og skriv det inn.',
    },
  },
  training_lay_out_kit: {
    title: { sv: 'Lägg fram träningsgrejerna', nb: 'Legg frem treningsklærne' },
    body: {
      sv: 'Lägg fram kläder eller utrustning så att det blir lättare att komma i gång.',
      nb: 'Legg frem klær eller utstyr slik at det blir lettere å komme i gang.',
    },
  },
  training_keep_usual_session: {
    title: { sv: 'Behåll ditt vanliga pass', nb: 'Behold den vanlige økten din' },
    body: {
      sv: 'Kör det pass du redan brukar, utan att höja kraven i dag.',
      nb: 'Kjør økten du allerede pleier, uten å heve kravene i dag.',
    },
  },
  training_controlled_strength: {
    title: { sv: 'Styrka med kontroll', nb: 'Styrke med kontroll' },
    body: {
      sv: 'Träna styrka i ett lugnt tempo och med rörelser du behärskar.',
      nb: 'Tren styrke i et rolig tempo og med bevegelser du behersker.',
    },
  },
  training_shorter_if_busy: {
    title: { sv: 'Kortare pass om dagen är full', nb: 'Kortere økt hvis dagen er full' },
    body: {
      sv: 'Om tiden är knapp: gör en förkortad version av passet i stället för att hoppa över.',
      nb: 'Hvis tiden er knapp: gjør en forkortet versjon av økten i stedet for å hoppe over.',
    },
  },
  training_do_planned_session: {
    title: { sv: 'Genomför det planerade passet', nb: 'Gjennomfør den planlagte økten' },
    body: {
      sv: 'Gör det pass du redan har tänkt i dag, i en rimlig intensitet.',
      nb: 'Gjør økten du allerede har tenkt i dag, med rimelig intensitet.',
    },
  },
  training_gentle_warmup: {
    title: { sv: 'En mjuk uppvärmning', nb: 'En myk oppvarming' },
    body: {
      sv: 'Rör igenom kroppen några minuter, även om du inte kör ett fullt pass.',
      nb: 'Beveg gjennom kroppen noen minutter, selv om du ikke kjører en full økt.',
    },
  },
  training_protect_training_day: {
    title: { sv: 'Skydda din träningsdag', nb: 'Beskytt treningsdagen din' },
    body: {
      sv: 'Håll i den träning du redan har i schemat i dag, utan att lägga till extra.',
      nb: 'Hold på treningen du allerede har i planen i dag, uten å legge til ekstra.',
    },
  },

  sleep_screens_off_earlier: {
    title: { sv: 'Stäng av skärmen lite tidigare', nb: 'Skru av skjermen litt tidligere' },
    body: {
      sv: 'Lägg undan telefon, padda eller tv en stund innan du tänker sova.',
      nb: 'Legg unna telefon, nettbrett eller tv en stund før du skal sove.',
    },
  },
  sleep_phone_outside_bedroom: {
    title: { sv: 'Låt telefonen sova utanför', nb: 'La telefonen sove utenfor' },
    body: {
      sv: 'Låt telefonen ligga utanför sovrummet i natt, om du kan.',
      nb: 'La telefonen ligge utenfor soverommet i natt, hvis du kan.',
    },
  },
  sleep_phone_away_before_bed: {
    title: { sv: 'Lägg undan telefonen före sänggående', nb: 'Legg unna telefonen før du legger deg' },
    body: {
      sv: 'Sätt telefonen på laddning utanför räckhåll när du gör kväll.',
      nb: 'Sett telefonen til lading utenfor rekkevidde når du gjør kveld.',
    },
  },
  sleep_keep_usual_bedtime: {
    title: { sv: 'Behåll din vanliga läggdags', nb: 'Behold den vanlige leggetiden din' },
    body: {
      sv: 'Gå och lägg dig ungefär som du brukar i kväll.',
      nb: 'Gå og legg deg omtrent som du pleier i kveld.',
    },
  },
  sleep_prepare_bedroom: {
    title: { sv: 'Ordna sovrummet', nb: 'Ordne soverommet' },
    body: {
      sv: 'Gör sovrummet redo: sänk belysningen, plocka undan och gör det lugnare att somna.',
      nb: 'Gjør soverommet klart: demp lyset, rydd unna og gjør det roligere å sovne.',
    },
  },
  sleep_write_tomorrow_list: {
    title: { sv: 'Skriv ner morgondagen', nb: 'Skriv ned morgendagen' },
    body: {
      sv: 'Skriv ner det du behöver komma ihåg i morgon, så att det inte följer med i sängen.',
      nb: 'Skriv ned det du trenger å huske i morgen, slik at det ikke følger med i sengen.',
    },
  },
  sleep_stop_work_earlier: {
    title: { sv: 'Avsluta jobbet tidigare i kväll', nb: 'Avslutt jobben tidligere i kveld' },
    body: {
      sv: 'Sätt punkt för jobb och mejl i tid, så att kvällen inte glider in i sängen.',
      nb: 'Sett punkt for jobb og e-post i tide, slik at kvelden ikke glir inn i sengen.',
    },
  },
  sleep_dim_evening_light: {
    title: { sv: 'Dämpa belysningen', nb: 'Demp belysningen' },
    body: {
      sv: 'Dämpa belysningen under sista delen av kvällen.',
      nb: 'Demp belysningen mot slutten av kvelden.',
    },
  },
  sleep_morning_daylight: {
    title: { sv: 'Ta dagsljus på morgonen', nb: 'Ta dagslys om morgenen' },
    body: {
      sv: 'Gå ut eller stå vid ett fönster en stund efter uppvaknandet.',
      nb: 'Gå ut eller stå ved et vindu en stund etter at du har våknet.',
    },
  },
  sleep_calm_evening: {
    title: { sv: 'En lugnare kväll', nb: 'En roligere kveld' },
    body: {
      sv: 'Håll kvällen enklare: färre extra intryck och ingen ny stor uppgift sent.',
      nb: 'Hold kvelden enklere: færre ekstra inntrykk og ingen ny stor oppgave sent.',
    },
  },
  sleep_skip_late_caffeine: {
    title: { sv: 'Hoppa över sen koffein', nb: 'Hopp over sen koffein' },
    body: {
      sv: 'Avstå kaffe, te eller energidryck sent på dagen i dag.',
      nb: 'Unngå kaffe, te eller energidrikk sent på dagen i dag.',
    },
  },
  sleep_less_late_stimulation: {
    title: { sv: 'Mindre skärm sent', nb: 'Mindre skjerm sent' },
    body: {
      sv: 'Välj något stillsammare än rullande flöde eller action den sista timmen.',
      nb: 'Velg noe stillere enn rullende feed eller action den siste timen.',
    },
  },
  sleep_keep_wake_rhythm: {
    title: { sv: 'Behåll din dygnsrytm', nb: 'Behold døgnrytmen din' },
    body: {
      sv: 'Gå upp och lägg dig ungefär som vanligt även i dag.',
      nb: 'Stå opp og legg deg omtrent som vanlig også i dag.',
    },
  },
  sleep_earlier_bedtime: {
    title: { sv: 'Gå och lägg dig tidigare', nb: 'Gå og legg deg tidligere' },
    body: {
      sv: 'Sikta på att komma i säng tydligt tidigare än du brukar i kväll.',
      nb: 'Sikt på å komme i seng tydelig tidligere enn du pleier i kveld.',
    },
  },
  sleep_keep_wind_down: {
    title: { sv: 'Behåll din kvällsrutin', nb: 'Behold kveldsrutinen din' },
    body: {
      sv: 'Gör den kvällsrutin du redan har, utan att korta ner den.',
      nb: 'Gjør kveldsrutinen du allerede har, uten å kutte den ned.',
    },
  },
  sleep_park_unfinished_tasks: {
    title: { sv: 'Parkera dagens uppgifter', nb: 'Parker dagens oppgaver' },
    body: {
      sv: 'Lämna det ofärdiga till i morgon. Avsluta kvällen utan att dra med jobbet i sängen.',
      nb: 'La det uferdige vente til i morgen. Avslutt kvelden uten å ta med jobben i sengen.',
    },
  },

  nutrition_sit_down_lunch: {
    title: { sv: 'Sitt ner och ät lunch', nb: 'Sett deg ned og spis lunsj' },
    body: {
      sv: 'Ta en riktig lunchpaus i dag: sitt ner och ät, i stället för att äta i farten.',
      nb: 'Ta en skikkelig lunsjpause i dag: sett deg ned og spis, i stedet for å spise i farten.',
    },
  },
  nutrition_protein_next_meal: {
    title: { sv: 'Protein till nästa mål', nb: 'Protein til neste måltid' },
    body: {
      sv: 'Se till att nästa mål innehåller en tydlig proteinkälla, till exempel ägg, fisk, kött, bönor eller mejeri.',
      nb: 'Sørg for at neste måltid har en tydelig proteinkilde, for eksempel egg, fisk, kjøtt, bønner eller meieri.',
    },
  },
  nutrition_add_vegetables: {
    title: { sv: 'Lägg till grönsaker', nb: 'Legg til grønnsaker' },
    body: {
      sv: 'Lägg till grönsaker eller sallad till ett mål i dag.',
      nb: 'Legg til grønnsaker eller salat til ett måltid i dag.',
    },
  },
  nutrition_simple_dinner: {
    title: { sv: 'En enkel, sammansatt middag', nb: 'En enkel, sammensatt middag' },
    body: {
      sv: 'Ät en middag med något mättande, något grönt och något du tycker om – utan att komplicera.',
      nb: 'Spis en middag med noe mettende, noe grønt og noe du liker – uten å komplisere.',
    },
  },
  nutrition_prep_one_meal: {
    title: { sv: 'Förbered ett mål', nb: 'Forbered ett måltid' },
    body: {
      sv: 'Lägg undan eller förbered ett mål så att nästa ätande blir enklare.',
      nb: 'Legg unna eller forbered ett måltid slik at neste måltid blir enklere.',
    },
  },
  nutrition_plan_next_meal: {
    title: { sv: 'Bestäm nästa mål', nb: 'Bestem neste måltid' },
    body: {
      sv: 'Bestäm ungefär vad nästa mål blir, så att du inte behöver välja i hungern.',
      nb: 'Bestem omtrent hva neste måltid blir, slik at du ikke må velge i sulten.',
    },
  },
  nutrition_eat_without_screen: {
    title: { sv: 'Ät utan skärm', nb: 'Spis uten skjerm' },
    body: {
      sv: 'Ät ett mål utan telefon, tv eller dator.',
      nb: 'Spis ett måltid uten telefon, tv eller pc.',
    },
  },
  nutrition_slow_the_meal: {
    title: { sv: 'Ät lite långsammare', nb: 'Spis litt saktere' },
    body: {
      sv: 'Lägg undan brådskan under ett mål. Tugga färdigt innan nästa tugga.',
      nb: 'Legg vekk maset under ett måltid. Tygg ferdig før neste munnfull.',
    },
  },
  nutrition_swap_evening_snack: {
    title: { sv: 'Byt kvällsmellanmål', nb: 'Bytt kveldskosen' },
    body: {
      sv: 'Om du tar något på kvällen, välj ett enklare mellanmål i stället för det du ofta tar av vana.',
      nb: 'Hvis du tar noe på kvelden, velg et enklere mellommåltid i stedet for det du ofte tar av vane.',
    },
  },
  nutrition_no_fast_food_today: {
    title: { sv: 'Ingen snabbmat i dag', nb: 'Ingen hurtigmat i dag' },
    body: {
      sv: 'Hoppa över hamburgerrestaurang, pizza takeaway och liknande i dag. Välj något enklare hemma eller på väg.',
      nb: 'Hopp over hamburgerrestaurant, pizza takeaway og lignende i dag. Velg noe enklere hjemme eller på veien.',
    },
  },
  nutrition_less_processed_choice: {
    title: { sv: 'Ett mindre processat val', nb: 'Et mindre bearbeidet valg' },
    body: {
      sv: 'När du väljer mat i dag, ta ett alternativ som är mer tillagat från grunden.',
      nb: 'Når du velger mat i dag, ta et alternativ som er mer laget fra bunnen.',
    },
  },
  nutrition_keep_regular_meals: {
    title: { sv: 'Behåll dina vanliga mål', nb: 'Behold de vanlige måltidene dine' },
    body: {
      sv: 'Ät ungefär som du brukar när det gäller tider och måltider, utan att hoppa över.',
      nb: 'Spis omtrent som du pleier når det gjelder tider og måltider, uten å hoppe over.',
    },
  },
  nutrition_one_grocery_choice: {
    title: { sv: 'Ett medvetet matval', nb: 'Et bevisst matvalg' },
    body: {
      sv: 'I butiken eller när du handlar, gör ett medvetet val mot något mer basalt – till exempel grönsaker eller protein.',
      nb: 'I butikken eller når du handler, gjør et bevisst valg mot noe mer basalt – for eksempel grønnsaker eller protein.',
    },
  },
  nutrition_pack_lunch: {
    title: { sv: 'Förbered lunch', nb: 'Forbered lunsj' },
    body: {
      sv: 'Gör i ordning lunch till i dag eller i morgon, så att du har något vettigt när hungern kommer.',
      nb: 'Gjør i stand lunsj til i dag eller i morgen, slik at du har noe fornuftig når sulten kommer.',
    },
  },
  nutrition_protein_at_breakfast: {
    title: { sv: 'Protein till frukost', nb: 'Protein til frokost' },
    body: {
      sv: 'Lägg till en proteinkälla på frukosten, om du äter frukost.',
      nb: 'Legg til en proteinkilde på frokosten, hvis du spiser frokost.',
    },
  },
  nutrition_keep_usual_dinner: {
    title: { sv: 'Behåll ett bra matval idag', nb: 'Behold et godt matvalg i dag' },
    body: {
      sv: 'Upprepa ett enkelt matval som redan fungerar bra för dig i dag.',
      nb: 'Gjenta et enkelt matvalg som allerede fungerer godt for deg i dag.',
    },
  },
  nutrition_include_veg_at_dinner: {
    title: { sv: 'Grönt till middagen', nb: 'Grønt til middagen' },
    body: {
      sv: 'Se till att middagen innehåller grönsaker, rotfrukter eller sallad.',
      nb: 'Sørg for at middagen inneholder grønnsaker, rotgrønnsaker eller salat.',
    },
  },
  nutrition_eat_at_the_table: {
    title: { sv: 'Ät vid bordet', nb: 'Spis ved bordet' },
    body: {
      sv: 'Ge ett mål en tydlig plats i dag: sitt ner vid bordet när du äter.',
      nb: 'Gi ett måltid en tydelig plass i dag: sett deg ved bordet når du spiser.',
    },
  },

  alcohol_free_evening: {
    title: { sv: 'Alkoholfri kväll', nb: 'Alkoholfri kveld' },
    body: {
      sv: 'Låt kvällen vara utan alkohol i dag.',
      nb: 'La kvelden være uten alkohol i dag.',
    },
  },
  alcohol_free_first: {
    title: { sv: 'Börja alkoholfritt', nb: 'Start alkoholfritt' },
    body: {
      sv: 'Ta något alkoholfritt först, innan du eventuellt tar något annat.',
      nb: 'Ta noe alkoholfritt først, før du eventuelt tar noe annet.',
    },
  },
  alcohol_set_limit_before: {
    title: { sv: 'Bestäm gränsen i förväg', nb: 'Bestem grensen på forhånd' },
    body: {
      sv: 'Om du ska i en situation där det kan drickas, bestäm i förväg hur mycket som är nog.',
      nb: 'Hvis du skal i en situasjon der det kan drikkes, bestem på forhånd hvor mye som er nok.',
    },
  },
  alcohol_alternate_drinks: {
    title: { sv: 'Varva med alkoholfritt', nb: 'Veksle med alkoholfritt' },
    body: {
      sv: 'Varva alkoholhaltig dryck med vatten eller annan alkoholfri dryck.',
      nb: 'Veksle alkoholholdig drikke med vann eller annen alkoholfri drikke.',
    },
  },
  alcohol_delay_first: {
    title: { sv: 'Vänta med första glaset', nb: 'Vent med det første glasset' },
    body: {
      sv: 'Skjut upp första alkoholen en stund, eller tills maten är framme.',
      nb: 'Utsett den første alkoholen en stund, eller til maten er fremme.',
    },
  },
  alcohol_smaller_amount: {
    title: { sv: 'Välj en mindre mängd', nb: 'Velg en mindre mengde' },
    body: {
      sv: 'Om du dricker, välj en mindre mängd eller ett enklare glas än du brukar.',
      nb: 'Hvis du drikker, velg en mindre mengde eller et enklere glass enn du pleier.',
    },
  },
  alcohol_social_without_default: {
    title: { sv: 'Ett umgänge utan automatik', nb: 'Et selskap uten automatikk' },
    body: {
      sv: 'Gå på det sociala utan att alkohol är förvalt från start. Ha en alkoholfri plan.',
      nb: 'Gå inn i det sosiale uten at alkohol er forhåndsvalgt. Ha en alkoholfri plan.',
    },
  },
  alcohol_change_home_cue: {
    title: { sv: 'Bryt hemmavanan', nb: 'Bryt hjemmevanen' },
    body: {
      sv: 'Om kvällen hemma ofta börjar med alkohol, gör något annat först i dag.',
      nb: 'Hvis kvelden hjemme ofte starter med alkohol, gjør noe annet først i dag.',
    },
  },
  alcohol_bring_alcohol_free: {
    title: { sv: 'Ha något alkoholfritt tillgängligt', nb: 'Ha noe alkoholfritt tilgjengelig' },
    body: {
      sv: 'Ha ett alkoholfritt alternativ tillgängligt, hemma eller när du är ute.',
      nb: 'Ha et alkoholfritt alternativ tilgjengelig, hjemme eller når du er ute.',
    },
  },
  alcohol_stop_at_the_plan: {
    title: { sv: 'Stanna vid det du bestämt', nb: 'Stopp ved det du har bestemt' },
    body: {
      sv: 'Om du har en gräns för i kväll, håll den.',
      nb: 'Hvis du har en grense for i kveld, hold den.',
    },
  },
  alcohol_start_with_food: {
    title: { sv: 'Börja med mat', nb: 'Start med mat' },
    body: {
      sv: 'Ät något innan du eventuellt dricker alkohol.',
      nb: 'Spis noe før du eventuelt drikker alkohol.',
    },
  },

  recovery_phone_free_lunch: {
    title: { sv: 'Lunch utan telefon', nb: 'Lunsj uten telefon' },
    body: {
      sv: 'Ät lunchen utan att scrolla. Låt pausen vara en paus.',
      nb: 'Spis lunsjen uten å scrolle. La pausen være en pause.',
    },
  },
  recovery_ten_quiet_minutes: {
    title: { sv: 'Tio tysta minuter', nb: 'Ti stille minutter' },
    body: {
      sv: 'Ta ungefär tio minuter utan krav, samtal eller skärm.',
      nb: 'Ta omtrent ti minutter uten krav, samtaler eller skjerm.',
    },
  },
  recovery_short_outdoor_reset: {
    title: { sv: 'Kort återhämtning utomhus', nb: 'Kort restitusjon utendørs' },
    body: {
      sv: 'Gå ut några minuter, utan att göra det till träning.',
      nb: 'Gå ut noen minutter, uten å gjøre det til trening.',
    },
  },
  recovery_easy_walk: {
    title: { sv: 'Lätt rörelse', nb: 'Lett bevegelse' },
    body: {
      sv: 'Rör på dig lugnt en stund, utan att höja pulsen med flit.',
      nb: 'Beveg deg rolig en stund, uten å heve pulsen med vilje.',
    },
  },
  recovery_skip_extra_task: {
    title: { sv: 'Skippa en onödig extrauppgift', nb: 'Hopp over en unødvendig ekstraoppgave' },
    body: {
      sv: 'Låt en sak som inte måste göras i dag vänta.',
      nb: 'La en ting som ikke må gjøres i dag vente.',
    },
  },
  recovery_slow_breathing: {
    title: { sv: 'Några lugna andetag', nb: 'Noen rolige åndedrag' },
    body: {
      sv: 'Stanna upp och andas långsammare en kort stund.',
      nb: 'Stans opp og pust saktere en kort stund.',
    },
  },
  recovery_after_work_pause: {
    title: { sv: 'En paus efter jobbet', nb: 'En pause etter jobben' },
    body: {
      sv: 'Ta en kort övergång efter arbetsdagen innan du går in i kvällens uppgifter.',
      nb: 'Ta en kort overgang etter arbeidsdagen før du går inn i kveldens oppgaver.',
    },
  },
  recovery_prepare_tomorrow: {
    title: { sv: 'Förbered i morgon i tid', nb: 'Forbered morgendagen i tide' },
    body: {
      sv: 'Ordna det du behöver för i morgon tidigare, så att kvällen blir lättare.',
      nb: 'Ordne det du trenger til i morgen tidligere, slik at kvelden blir lettere.',
    },
  },
  recovery_easier_version: {
    title: { sv: 'Välj den lätta varianten', nb: 'Velg den lette varianten' },
    body: {
      sv: 'Om du har något planerat, gör en enklare version i dag.',
      nb: 'Hvis du har noe planlagt, gjør en enklere versjon i dag.',
    },
  },
  recovery_screen_free_block: {
    title: { sv: 'En skärmfri stund', nb: 'En skjermfri stund' },
    body: {
      sv: 'Lägg undan skärmarna en bestämd stund och gör något stillsamt i stället.',
      nb: 'Legg unna skjermene en bestemt stund og gjør noe stille i stedet.',
    },
  },
  recovery_keep_rest_habit: {
    title: { sv: 'Behåll din återhämtning', nb: 'Behold restitusjonen din' },
    body: {
      sv: 'Gör den vila eller paus du redan vet fungerar för dig.',
      nb: 'Gjør hvilen eller pausen du allerede vet fungerer for deg.',
    },
  },
  recovery_gentle_mobility: {
    title: { sv: 'Mjuk rörlighet', nb: 'Myk bevegelighet' },
    body: {
      sv: 'Rör igenom kroppen lugnt, utan att det ska bli ett träningspass.',
      nb: 'Beveg gjennom kroppen rolig, uten at det skal bli en treningsøkt.',
    },
  },
  recovery_leave_on_time: {
    title: { sv: 'Avsluta dagen i tid', nb: 'Avslutt dagen i tide' },
    body: {
      sv: 'Låt en sak vänta till i morgon och avsluta när du hade tänkt.',
      nb: 'La én ting vente til i morgen, og avslutt da du hadde tenkt.',
    },
  },
  recovery_sit_outside: {
    title: { sv: 'Sitt ute en stund', nb: 'Sitt ute en stund' },
    body: {
      sv: 'Sitt utomhus några minuter, utan att kombinera det med jobb.',
      nb: 'Sitt utendørs noen minutter, uten å kombinere det med jobb.',
    },
  },
  recovery_one_less_commitment: {
    title: { sv: 'Ta bort en sak från dagen', nb: 'Ta bort én ting fra dagen' },
    body: {
      sv: 'Välj något som inte är nödvändigt i dag och låt det vänta eller hoppa över det.',
      nb: 'Velg noe som ikke er nødvendig i dag, og la det vente eller hopp over det.',
    },
  },
  recovery_skip_extra_session: {
    title: { sv: 'Hoppa över extrapasset', nb: 'Hopp over ekstraøkten' },
    body: {
      sv: 'Om du tänkt lägga till extra träning utöver det vanliga, låt det vara i dag.',
      nb: 'Hvis du hadde tenkt å legge til ekstra trening utover det vanlige, la det være i dag.',
    },
  },
} as const satisfies Record<DailyFocusActionId, ActionCopyEntry>;

export const DAILY_FOCUS_WHY_COPY = {
  'dailyFocus.why.everyday_movement.improve': {
    sv: 'Vardagsrörelse är ett av områdena vi prioriterar den här veckan.',
    nb: 'Hverdagsbevegelse er ett av områdene vi prioriterer denne uken.',
  },
  'dailyFocus.why.everyday_movement.maintain': {
    sv: 'Din vardagsrörelse verkar fungera. Dagens fokus hjälper dig att behålla vanan.',
    nb: 'Hverdagsbevegelsen din ser ut til å fungere. Dagens fokus hjelper deg å beholde vanen.',
  },
  'dailyFocus.why.training.improve': {
    sv: 'Träning är ett av områdena vi prioriterar den här veckan.',
    nb: 'Trening er ett av områdene vi prioriterer denne uken.',
  },
  'dailyFocus.why.training.maintain': {
    sv: 'Din träning verkar ligga bra. Dagens fokus hjälper dig att hålla i det du redan gör.',
    nb: 'Treningen din ser ut til å ligge bra. Dagens fokus hjelper deg å holde i det du allerede gjør.',
  },
  'dailyFocus.why.sleep.improve': {
    sv: 'Din sömn är ett av områdena vi prioriterar den här veckan.',
    nb: 'Søvnen din er ett av områdene vi prioriterer denne uken.',
  },
  'dailyFocus.why.sleep.maintain': {
    sv: 'Din sömn verkar fungera bra. Dagens fokus hjälper dig att behålla rutinen.',
    nb: 'Søvnen din ser ut til å fungere godt. Dagens fokus hjelper deg å beholde rutinen.',
  },
  'dailyFocus.why.nutrition.improve': {
    sv: 'Matvanor är ett av områdena vi prioriterar den här veckan.',
    nb: 'Matvaner er ett av områdene vi prioriterer denne uken.',
  },
  'dailyFocus.why.nutrition.maintain': {
    sv: 'Dina matvanor verkar fungera. Dagens fokus hjälper dig att hålla i det som redan funkar.',
    nb: 'Matvanene dine ser ut til å fungere. Dagens fokus hjelper deg å holde i det som allerede funker.',
  },
  'dailyFocus.why.alcohol.improve': {
    sv: 'Alkohol är ett av områdena vi prioriterar den här veckan.',
    nb: 'Alkohol er ett av områdene vi prioriterer denne uken.',
  },
  'dailyFocus.why.recovery.improve': {
    sv: 'Återhämtning är ett av områdena vi prioriterar den här veckan.',
    nb: 'Restitusjon er ett av områdene vi prioriterer denne uken.',
  },
  'dailyFocus.why.recovery.maintain': {
    sv: 'Din återhämtning verkar fungera. Dagens fokus hjälper dig att skydda den.',
    nb: 'Restitusjonen din ser ut til å fungere. Dagens fokus hjelper deg å beskytte den.',
  },
} as const satisfies Record<(typeof DAILY_FOCUS_WHY_KEYS)[number], LocalizedPair>;

type DailyFocusI18n = {
  [K in DailyFocusActionId as `dailyFocus.action.${K}.title`]: string;
} & {
  [K in DailyFocusActionId as `dailyFocus.action.${K}.body`]: string;
} & {
  [K in (typeof DAILY_FOCUS_WHY_KEYS)[number]]: string;
};

function flattenDailyFocusI18n(locale: 'sv' | 'nb'): DailyFocusI18n {
  const out: Record<string, string> = {};
  for (const id of Object.keys(DAILY_FOCUS_ACTION_COPY) as DailyFocusActionId[]) {
    out[`dailyFocus.action.${id}.title`] = DAILY_FOCUS_ACTION_COPY[id].title[locale];
    out[`dailyFocus.action.${id}.body`] = DAILY_FOCUS_ACTION_COPY[id].body[locale];
  }
  for (const key of DAILY_FOCUS_WHY_KEYS) {
    out[key] = DAILY_FOCUS_WHY_COPY[key][locale];
  }
  return out as DailyFocusI18n;
}

export const DAILY_FOCUS_I18N_SV = flattenDailyFocusI18n('sv');
export const DAILY_FOCUS_I18N_NB = flattenDailyFocusI18n('nb');

export function dailyFocusActionTitleKey(id: DailyFocusActionId): `dailyFocus.action.${DailyFocusActionId}.title` {
  return `dailyFocus.action.${id}.title`;
}

export function dailyFocusActionBodyKey(id: DailyFocusActionId): `dailyFocus.action.${DailyFocusActionId}.body` {
  return `dailyFocus.action.${id}.body`;
}
