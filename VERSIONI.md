# Versioni di Palestra

> **Nota: ad ogni aggiornamento della app, aggiornare questo file.**
> Aggiungi in cima una nuova sezione con numero di versione, data e l'elenco di cosa è stato aggiunto, cambiato o corretto. Le versioni più recenti stanno in alto.

Versione attuale: **1.9.1**

---

## Versione 1.9.1 (22/10/2026)

Correzione: su iPhone, in Safari e nell'app sulla Home, le nuove versioni potevano non comparire per ore.
- L'app ora chiede sempre al sito se i file sono cambiati, invece di usare la copia tenuta dal telefono.
- Nuovo pulsante **Controlla aggiornamenti** in Storico, Dati: cancella la copia salvata e ricarica l'app. I tuoi dati non si toccano.

---

## Versione 1.9 (22/10/2026)

Novità
- **Schermata di benvenuto** al primo avvio (solo se l'app non ha ancora dati): "Sono nuovo" (tutorial in 4 passi: peso e altezza, giorni di allenamento, scheda vuota o di esempio, modalità serie, dieta e Diario), "Ho già usato l'app" (importa il backup) oppure "Salta" (parti da zero, senza dati né esempi). Dal tutorial si può fare una **prova guidata** con dati di esempio che non finiscono nello storico. Il tutorial si rivede da Storico, Dati.
- **Annulla**: dopo aver eliminato un esercizio, una variante o una serie, o dopo un import o un ripristino, compare "Annulla" per 6 secondi. Eliminare un esercizio non chiede più conferma.
- **Modifica dei giorni passati**: nel Diario, toccando un giorno, "Modifica la seduta" permette di correggere peso, zavorra e ripetizioni, aggiungere o togliere serie, o eliminare la seduta. I pasti di un giorno passato si correggono toccandoli (non fatto, fatto, saltato, sgarro).
- **Calorie e proteine**: nella Dieta e nel dettaglio del giorno, quante ne hai mangiate rispetto al totale previsto. È una stima: il totale del giorno viene diviso tra i pasti usando valori medi degli alimenti.
- **Backup più comodo**: su iPhone "Esporta il backup" apre il foglio di condivisione, da cui puoi salvare in File o iCloud Drive.
- **Avviso di nuova versione**: quando i file su GitHub cambiano, in alto compare "Nuova versione disponibile, Aggiorna".
- **Spazio usato** in Dati, con avviso se i dati diventano molti.

Cambiato
- Scheda vuota: Oggi spiega come aggiungere gli esercizi; il peso corporeo può non esserci.
- Contrasto più forte se l'iPhone ha "Aumenta contrasto" e contorno ben visibile sui pulsanti con la tastiera.
- Controllati i tempi con 500 giorni di storico (circa 900 KB di dati): le schermate si aprono in pochi millisecondi, e l'app funziona anche senza rete.

---

## Versione 1.8 (21/10/2026)

Novità
- **Modalità serie** a schermo intero: un solo esercizio alla volta, peso e ripetizioni con grandi pulsanti − e +, già precompilati dall'ultima volta, nota sull'esercizio e pulsante "Serie fatta". Si apre dal pulsante "Modalità serie" nell'allenamento.
- **Recupero a schermo intero** con anello che si svuota, +15 s, "Salta il recupero" e anteprima della serie successiva. Il suono finale resta.
- **Recupero diverso per ogni esercizio** (ad esempio 1 min 30 s): si imposta in Scheda; gli esercizi senza impostazione usano il recupero generale (ora da 30 s a 5 min).
- **Riepilogo di fine allenamento**: durata, serie, volume, confronto con la volta scorsa, nuovi record, come è andata (leggero, giusto, pesante) e nota.
- **Calendario del mese** nello Storico: la scheda "Sedute" diventa "Diario", con giorni di allenamento fatti o previsti, pallini per i pasti (seguiti, sgarro, saltato, incompleti) e dettaglio del giorno toccato.

Cambiato
- Il promemoria del backup è ora una finestra (come la domanda sul tipo di giorno) e non occupa più spazio nella home.

---

## Versione 1.7.1 (15/10/2026)

Correzione della 1.7: il peso corporeo e la linea di tendenza erano poco visibili.

- Addominali ora parte a "Peso corporeo": nella schermata Allenamento si vede il peso corporeo (l'ultimo registrato) e nelle serie non c'è più il campo kg. Si cambia in Scheda, voce "Carico" (Pesi, Peso corporeo, Peso corporeo + zavorra). Chi aveva già scelto un carico diverso lo conserva.
- La linea di tendenza del peso (tratteggiata) compare dal secondo peso registrato, non più dal terzo. Se hai un solo peso, sotto il grafico c'è scritto quando compare. Se ti pesi una volta a settimana la linea tratteggiata coincide quasi con quella piena: la differenza si vede con più pesate nella stessa settimana.
- Cache del service worker: palestra-v1.7.1.

---

## Versione 1.7 (15/10/2026)

Pasti saltati e sgarri, esercizi a corpo libero con zavorra, note, promemoria del backup, tendenza del peso e domanda sul giorno all'apertura. I dati della 1.6 si conservano.

### Dieta
- Ogni pasto ha due tasti, "Saltato" e "Sgarro". Lo sgarro conta come mangiato ma fuori piano e ha una nota facoltativa ("tiramisù"). Il saltato conta come non mangiato.
- Spuntare un pasto saltato toglie il "Saltato"; togliere la spunta a uno sgarro toglie lo sgarro.
- Nella home il pasto saltato non compare più come "prossimo" e il suo tasto cambia colore (rosso per saltato, giallo per sgarro).
- Aderenza: i pasti "seguiti" sono quelli mangiati senza sgarri, rispetto a quelli previsti. Saltati e sgarri sono contati a parte.
- Controllo: la riga "Fuori piano" nelle settimane, e nel riepilogo copiabile le righe "Pasti: ..., 1 sgarro, 1 saltato" e l'elenco "Sgarri" con data, pasto e nota.
- CSV dei pasti: valori Sì, No, Saltato, Sgarro e una colonna con le note sugli sgarri.

### Allenamento
- Esercizi a corpo libero: in Scheda, per ogni esercizio, "Carico" può essere Pesi, Peso corporeo oppure Peso corporeo + zavorra.
- Peso corporeo: il peso è l'ultimo che hai registrato fino a quel giorno e resta salvato nella serie, quindi gli allenamenti passati non cambiano se il peso sale. Con "+ zavorra" scrivi solo i chili aggiunti.
- Record, volumi, grafici ed esportazione usano il carico totale (corpo + zavorra). Il CSV delle serie ha la nuova colonna "Zavorra (kg)".
- Nota per esercizio: sotto le serie di ogni esercizio un campo di testo. La volta dopo, sopra le serie, compare l'ultima nota. Le note si vedono anche in Storico, Sedute, e nel CSV delle serie.

### Home e dati
- Domanda del giorno: alla prima apertura di ogni giorno una finestra chiede se oggi è allenamento o riposo, con il tipo previsto dalla settimana evidenziato. "Decido dopo" o Esc la chiudono. Non ricompare lo stesso giorno.
- Promemoria del backup: se non salvi un backup da 7 giorni (o non lo hai mai fatto e usi la app da 7 giorni) compare un avviso nella home, con "Salva il backup" e "Più tardi" (nasconde per 3 giorni). In Storico, Dati si vede la data dell'ultimo backup.
- Tendenza del peso: sul grafico una linea tratteggiata con la media degli ultimi 7 giorni, e sotto la variazione rispetto a una settimana prima. Compare dal terzo peso registrato.

### Non fatto
- Scorta in casa nella spesa: c'era già ("Ho già" nella lista, e le spunte "Preso").

### Tecnico
- Nuovi campi nei giorni salvati (flags, slip, exnote) e nell'esercizio (bw), migrazione automatica. Impostazioni: lastBackup, backupSnooze, dayAsked. Cache palestra-v1.7.

---

## Versione 1.6 (15/10/2026)

Controllo delle 4 settimane, aderenza, record personali, esportazione in Excel, anteprima degli stili e suono di fine recupero. I dati della 1.5 si conservano.

### Suono di fine recupero
- Quando il timer arriva a zero la app suona tre note brevi (oltre alla vibrazione, che su iPhone non funziona).
- In Storico, Dati: interruttore "Suono a fine recupero" e tasto "Prova il suono".
- Il browser abilita l'audio solo dopo un tuo tocco: basta aver toccato la app una volta. Su iPhone il tasto silenzioso e il volume contano.

### Storico
- Quattro sezioni: Progressi, Controllo, Sedute (l'ex "Allenamenti") e Dati.

### Controllo delle settimane
- Il programma parte il 9/10/2026 e dura 4 settimane: il controllo è il 6/11/2026. In alto i giorni trascorsi e quanti ne mancano.
- Peso con grafico, sedute fatte e pasti spuntati, tabella settimana per settimana, creatina.
- Misure (petto, vita, fianchi, braccio, coscia) con data, tabella inizio, ora e variazione, e possibilità di eliminarle.
- Riepilogo per il controllo, pronto da copiare.

### Progressi
- Record personali per gruppo muscolare: il miglior set di ogni esercizio (prima il peso, poi le ripetizioni), con l'etichetta "Nuovo" negli ultimi 7 giorni.
- Aderenza: barre per settimana, Allenamenti oppure Pasti. Si conta dal primo giorno registrato; i pasti solo nei giorni già conclusi.

### Dati
- Esporta in Excel: file CSV (punto e virgola, decimali con la virgola) per serie e allenamenti, peso e misure, pasti e creatina.
- Anteprima stili: Apple-like, Scuro e Sport, con "Usa questo stile".

### Tecnico
- Nuovo campo misure nei dati salvati, migrazione automatica. Cache del service worker palestra-v1.6.
- Il backup JSON include misure e impostazione del suono.

---

## Versione 1.5 (14/10/2026)

Home a due bottoni, selettore degli esercizi con varianti, sezione Progressi con grafici e gruppi muscolari. I dati salvati nelle versioni 1.0 e 1.1 si conservano: la app li aggiorna da sola al primo avvio.

### Home
- Schermata iniziale con due bottoni grandi, Allenamento e Dieta, separati e senza scorrimento: restano interi anche sugli schermi piccoli.
- Ogni bottone mostra l'avanzamento di oggi (serie fatte su totali, pasti fatti su totali) e porta alla sua schermata, con freccia per tornare indietro. Funziona anche il gesto o il tasto indietro del telefono.
- Layout e stile uguali all'anteprima della 1.1 (stile Apple-like di partenza, Scuro e Sport restano disponibili).
- "Segna al volo" resta sotto i bottoni: Creatina e i pasti del giorno.
- Il timer di recupero compare solo nella schermata Allenamento, così non copre home e grafici.
- Se oggi è riposo il bottone Allenamento è spento; per allenarti comunque tocca Allenamento nel selettore in alto.

### Allenamento: selettore degli esercizi
- Gli esercizi con più alternative hanno un selettore a due voci, con il peso di ciascuna: Pectoral machine / Croci, Dorsali / Lat machine presa larga, Spalle Multipower / Panca al rack.
- Ogni variante ha i suoi pesi, il suo "ultima volta", il suo massimo e il suo storico. Le serie già registrate di Pectoral machine, Dorsali e Spalle Multipower sono state assegnate alla prima variante.
- Il peso che compare in ogni serie parte dall'ultimo usato con quell'esercizio.
- In Scheda si possono aggiungere ed eliminare varianti e dare a ciascuna serie, ripetizioni e kg.
- In Scheda ogni esercizio ha il suo gruppo muscolare (Petto, Dorso, Spalle, Bicipiti, Tricipiti, Gambe, Addome, Altro).

### Storico: Progressi
- Lo Storico ha tre sezioni: Progressi, Allenamenti, Dati.
- Filtro per periodo: 7 giorni, 30 giorni, sempre. In alto: allenamenti, serie e volume del periodo.
- Peso corporeo: grafico dell'andamento e inserimento del peso di oggi.
- Esercizio: scegli l'esercizio (anche ogni singola variante) e guarda l'andamento di carico massimo, 1RM stimato, volume, ripetizioni o serie, con Migliore, Ultimo e Variazione.
- Gruppi muscolari: grafico a barre dei gruppi allenati, per numero di serie o per volume.
- Volume per allenamento: andamento dei chili sollevati seduta dopo seduta.
- Toccando un punto o una barra si vede il dettaglio, e "Mostra i dati" apre la tabella dei valori.
- Allenamenti: elenco delle sedute, con il dettaglio di ogni esercizio.
- Dati: tempo di recupero, stile della app, esporta e importa il backup, ripristina i dati di base.

### Dati di base dal tuo backup del 13/10/2026
- Scheda aggiornata: Pectoral machine / Croci 4 serie da 10, Row presa bassa 4 serie da 10, Pressa 4 serie da 10 a 80 kg.
- Allenamenti di martedì, giovedì e sabato; recupero di 1 minuto.
- Allenamento del 13/10 con carichi e ripetizioni reali, pasti di quel giorno, peso di partenza 68,5 kg.
- Compaiono quando la app parte senza dati, oppure con "Ripristina i dati di base".

### Tecnico
- Nuovo file `charts.js` (grafici in SVG, senza librerie). File della app: `index.html`, `style.css`, `data.js`, `charts.js`, `app.js`, `sw.js`, `manifest.webmanifest`, cartella `icons`.
- Stessa chiave di salvataggio delle versioni precedenti (nessuna perdita di dati); i pasti segnati in due modi nella 1.1 sono stati uniti.
- Copia offline aggiornata alla 1.5.
- Provata con test automatici nel browser (Chromium) su schermi da 320 a 430 pixel di larghezza, con il file di backup caricato.

---

## Versione 1.1 (13/10/2026)

Ricostruita dal backup. Nuova home "Oggi" e tre stili.

- Home Oggi con scelta Allenamento o Riposo, scheda del giorno con riepilogo (giorno, serie fatte, prossima serie) e pasti con spunta.
- "Segna al volo": Creatina, Colazione, Pranzo e Cena.
- Tre stili selezionabili: Apple-like, Scuro e Sport.
- Anteprima della home (`preview-home.html`) usata per scegliere il layout.

---

## Versione 1.0 (13/10/2026)

Prima versione. Web app statica per GitHub Pages, installabile sulla schermata Home dell'iPhone e utilizzabile anche offline.

### Oggi
- Scelta del tipo di giorno: Allenamento o Riposo.
- In allenamento: giorno di scheda proposto in rotazione (dopo il Giorno 1 il Giorno 2, e così via), cambiabile con un tocco.
- Per ogni esercizio: kg e ripetizioni per ogni serie, già precompilati con i valori della scheda.
- Disco di completamento serie, con timer di recupero (predefinito 1 minuto e 30) con +15 secondi e salta.
- Indicazione dell'ultima volta (carichi e ripetizioni dell'allenamento precedente).
- Avviso "Nuovo massimo" quando superi il carico massimo degli allenamenti precedenti.
- Aggiungi o togli serie, note dell'allenamento, progresso "X di Y serie".
- Schermo che resta acceso durante l'allenamento.
- Pasti del giorno già adattati al tipo di giorno, con spunta "Mangiato" e macro della giornata.

### Scheda
- Tre giorni di allenamento caricati dalla nota: Giorno 1, Giorno 2, Giorno 3.
- Modifica di nome, serie, ripetizioni, kg e nota di ogni esercizio, più aggiunta e eliminazione di esercizi.
- Esercizi senza valori (Pressa, Leg curl, Schiena) segnati "da definire"; Addominali a corpo libero.
- Interpretazioni da verificare: Alzate laterali e Row presa larga come 5 serie da 12; Spalle a 14 kg con nota "14/12".

### Dieta
- Due piani dal documento del 09/10/2026: giorni di allenamento (2200 kcal) e giorni non allenamento (2250 kcal), con orari, grammature e macro.
- Scelta dell'alimento dove la dieta prevede alternative (carni bianche e pesce, riso basmati o integrale, carne rossa o hamburger) e del condimento del riso.
- Promemoria del controllo dopo 4 settimane (6 novembre 2026).

### Spesa
- Selezione per ogni giorno della settimana: A allenamento, R riposo, trattino escluso (predefinito lunedì, mercoledì e venerdì in allenamento).
- Lista calcolata dai pasti dei giorni scelti, con quantità sommate e raggruppate per categoria.
- Segue le scelte fatte in Dieta (tipo di carne o pesce, riso, condimento con tonno, salsa o piselli).
- Spunta "preso", "Ho già" con sezione Già in casa, copia della lista, azzera le spunte.

### Storico
- Peso corporeo con grafico (peso di partenza 68,5 kg dal 09/10/2026).
- Grafico e ultime sedute per ogni esercizio.
- Elenco degli ultimi allenamenti con serie fatte e kg sollevati.
- Impostazione del tempo di recupero.
- Esporta, importa e cancella i dati (i dati sono salvati solo sul telefono).

### Tecnico
- File: `index.html`, `style.css`, `data.js` (dieta e scheda di partenza), `app.js`, `sw.js`, `manifest.webmanifest`, cartella `icons`.
- Nessun server e nessuna dipendenza: solo i caratteri Barlow caricati da Google Fonts, con alternative locali se offline.
