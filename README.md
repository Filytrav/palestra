# Palestra

Web app personale: scheda di allenamento interattiva, dieta che cambia nei giorni di allenamento e lista della spesa generata dai pasti. Funziona offline e si installa sulla schermata Home dell'iPhone.

## Pubblicare su GitHub Pages

1. Crea un repository su GitHub (per esempio `palestra`).
2. Carica **il contenuto** di questa cartella nella radice del repository (index.html, app.js, charts.js, data.js, style.css, sw.js, manifest.webmanifest, cartella icons).
3. Vai in Settings, poi Pages. In "Build and deployment" scegli "Deploy from a branch", branch `main`, cartella `/ (root)`, e salva.
4. Dopo un minuto l'app è su `https://TUO-UTENTE.github.io/palestra/`.
5. Sull'iPhone apri il link in Safari, tocca Condividi, poi "Aggiungi alla schermata Home".

## Come funziona

- **Oggi**: due bottoni, Allenamento e Dieta. Allenamento apre il giorno di scheda (propone il successivo in rotazione) con kg e ripetizioni per ogni serie: tocca il disco per segnare la serie fatta e parte il timer di recupero. Negli esercizi con alternative (Pectoral machine / Croci, Dorsali / Lat machine, Spalle Multipower / Panca al rack) scegli quale hai fatto e vedi i suoi pesi. Dieta apre i pasti di oggi, già adattati al tipo di giorno. "Segna al volo" spunta creatina e pasti.
- **Scheda**: modifica esercizi, varianti, serie, ripetizioni, carichi, note e gruppo muscolare.
- **Dieta**: i due piani (allenamento e riposo) con orari, grammature e macro. Dove vedi la sottolineatura tratteggiata puoi cambiare alimento o condimento.
- **Spesa**: nella riga dei giorni tocca per scegliere A (allenamento), R (riposo) o trattino (escluso). La lista somma le quantità di tutta la settimana secondo le scelte fatte in Dieta. Puoi spuntare, mettere "Ho già" e copiare la lista.
- **Storico**: Progressi (peso corporeo, andamento di ogni esercizio, gruppi muscolari, volume), Allenamenti (elenco delle sedute) e Dati (recupero, stile, backup).

## Dati e backup

I dati sono salvati nel browser del telefono (non online). Se cambi telefono o cancelli i dati di Safari li perdi, quindi ogni tanto usa Storico, poi "Esporta il backup".

## Aggiornare la dieta

Dopo il controllo delle 4 settimane modifica `data.js` (grammature, alimenti, calorie, data di inizio) e ricarica il file su GitHub. L'app si aggiorna da sola al prossimo avvio con la rete.
