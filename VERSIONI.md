# Versioni di Palestra

> **Nota: ad ogni aggiornamento della app, aggiornare questo file.**
> Aggiungi in cima una nuova sezione con numero di versione, data e l'elenco di cosa è stato aggiunto, cambiato o corretto. Le versioni più recenti stanno in alto.

Versione attuale: **1.0**

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
