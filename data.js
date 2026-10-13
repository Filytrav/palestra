/* Dati di partenza: dieta del 09/10/2026 e scheda a 3 giorni.
   Dopo il controllo delle 4 settimane modifica la dieta qui sotto,
   la scheda invece si modifica direttamente dalla app (sezione Scheda). */
window.APP_DATA = (() => {
  // Categorie della lista della spesa, nell'ordine in cui compaiono
  const cats = [
    ['carne', 'Carne'],
    ['pesce', 'Pesce'],
    ['uova', 'Uova e salumi'],
    ['frutta', 'Frutta e verdura'],
    ['pane', 'Pane'],
    ['dispensa', 'Dispensa']
  ];

  const f = (name, cat) => ({ name, cat });
  const food = {
    albume: f('Albume', 'uova'),
    fesa: f('Fesa di tacchino', 'uova'),
    banane: f('Banane', 'frutta'),
    verdure: f('Verdure miste a foglia verde', 'frutta'),
    piselli: f('Piselli', 'frutta'),
    avena: f('Farina di avena', 'dispensa'),
    basmati: f('Riso basmati', 'dispensa'),
    integrale: f('Riso integrale', 'dispensa'),
    riso: f('Riso', 'dispensa'),
    olio: f('Olio extravergine di oliva', 'dispensa'),
    passata: f('Passata di pomodoro', 'dispensa'),
    tonno: f('Tonno al naturale', 'dispensa'),
    panino: f('Panino', 'pane'),
    pollo: f('Petto di pollo', 'carne'),
    tacchino: f('Petto di tacchino', 'carne'),
    lonza: f('Lonza', 'carne'),
    cosce: f('Cosce di pollo senza pelle', 'carne'),
    coniglio: f('Coniglio', 'carne'),
    manzo: f('Carne rossa', 'carne'),
    hamburger: f('Hamburger', 'carne'),
    merluzzo: f('Merluzzo', 'pesce'),
    spigola: f('Spigola', 'pesce'),
    orata: f('Orata', 'pesce'),
    spada: f('Pesce spada', 'pesce'),
    tonnofresco: f('Tonno fresco', 'pesce'),
    cernia: f('Cernia', 'pesce'),
    capone: f('Capone', 'pesce'),
    dentice: f('Dentice', 'pesce'),
    calamari: f('Calamari', 'pesce'),
    polpo: f('Polpo', 'pesce')
  };

  // Condimenti del riso: alcuni aggiungono qualcosa alla spesa
  const toppings = {
    bianco: { label: 'In bianco' },
    salsa: { label: 'Con salsa', extra: { food: 'passata', qb: true } },
    verdure: { label: 'Con verdure' },
    piselli: { label: 'Con piselli', extra: { food: 'piselli', qb: true } },
    tonno: { label: 'Con 1 scatoletta di tonno al naturale', extra: { food: 'tonno', pz: 1 } }
  };

  const WHITE = ['pollo', 'tacchino', 'lonza', 'cosce', 'coniglio', 'merluzzo', 'spigola',
    'orata', 'spada', 'tonnofresco', 'cernia', 'capone', 'dentice', 'calamari', 'polpo'];
  const RICE = ['basmati', 'integrale'];

  const fixed = (id, foodId, g) => ({ id, food: foodId, g });
  const pick = (id, choices, g, tops) => ({ id, choices, g, toppings: tops });
  const oil = id => fixed(id, 'olio', 10);
  const veg = id => fixed(id, 'verdure', 100);
  const breakfast = time => ({
    id: 'colazione', name: 'Colazione', time,
    items: [
      fixed('colazione-albume', 'albume', 200),
      fixed('colazione-banane', 'banane', 150),
      fixed('colazione-avena', 'avena', 80)
    ]
  });

  const diet = {
    start: '2026-10-09',
    weeks: 4,
    startWeight: 68.5,
    rest: {
      title: 'Giorni non allenamento',
      kcal: 2250, p: '136 + (44)', c: '320', f: '36',
      pct: { p: 32, c: 53.5, f: 14.5 },
      meals: [
        breakfast('09:00'),
        {
          id: 'pranzo', name: 'Pranzo', time: '13:00/13:30',
          items: [
            pick('r-pranzo-riso', RICE, 100, ['bianco', 'salsa', 'tonno', 'piselli']),
            oil('r-pranzo-olio'),
            veg('r-pranzo-verdure'),
            pick('r-pranzo-prot', WHITE, 200)
          ]
        },
        {
          id: 'spuntino', name: 'Spuntino pomeriggio', time: '17:30',
          items: [fixed('r-spuntino-panino', 'panino', 110), fixed('r-spuntino-fesa', 'fesa', 100)]
        },
        {
          id: 'cena', name: 'Cena', time: '20:30',
          items: [
            pick('r-cena-riso', RICE, 100, ['bianco', 'salsa', 'tonno', 'piselli']),
            pick('r-cena-prot', WHITE, 200),
            oil('r-cena-olio'),
            veg('r-cena-verdure')
          ]
        }
      ]
    },
    train: {
      title: 'Giorni allenamento',
      kcal: 2200, p: '136 + (38)', c: '303', f: '40',
      pct: { p: 31.5, c: 51.5, f: 17 },
      meals: [
        breakfast('09:30'),
        {
          id: 'pranzo', name: 'Pranzo', time: '15:00',
          items: [
            pick('t-pranzo-carne', ['manzo', 'hamburger'], 300),
            { id: 't-pranzo-riso', food: 'riso', g: 140, toppings: ['bianco', 'salsa', 'verdure', 'piselli', 'tonno'] },
            oil('t-pranzo-olio'),
            veg('t-pranzo-verdure')
          ]
        },
        {
          id: 'cena', name: 'Cena', time: '20:30',
          items: [
            pick('t-cena-prot', WHITE, 200),
            pick('t-cena-riso', RICE, 120, ['bianco', 'salsa', 'verdure', 'piselli', 'tonno']),
            oil('t-cena-olio'),
            veg('t-cena-verdure')
          ]
        }
      ]
    }
  };

  // Scheda: sets/reps/kg a null = "da definire" (si può modificare dall'app)
  const workouts = [
    {
      id: 'g1', name: 'Giorno 1', color: 'red',
      exercises: [
        { id: 'panca', name: 'Panca', sets: 5, reps: 5, kg: 40 },
        { id: 'pectoral', name: 'Pectoral machine / Croci', sets: 4, reps: 6, kg: 10 },
        { id: 'lat', name: 'Dorsali / Lat machine presa larga', sets: 5, reps: 5, kg: 40 },
        { id: 'rowbassa', name: 'Row presa bassa stretta', sets: 5, reps: 5, kg: 55 },
        { id: 'pressa', name: 'Pressa', sets: null, reps: null, kg: null }
      ]
    },
    {
      id: 'g2', name: 'Giorno 2', color: 'blue',
      exercises: [
        { id: 'bicbil', name: 'Bicipiti bilanciere', sets: 5, reps: 10, kg: 20 },
        { id: 'biccavi', name: 'Bicipiti cavi', sets: 4, reps: 8, kg: 16 },
        { id: 'tribil', name: 'Tricipiti bilanciere', sets: 5, reps: 5, kg: 18 },
        { id: 'tricavi', name: 'Tricipiti cavi', sets: 4, reps: 10, kg: 16 },
        { id: 'legcurl', name: 'Leg curl', sets: null, reps: null, kg: null },
        { id: 'addom', name: 'Addominali', sets: 4, reps: 10, kg: null }
      ]
    },
    {
      id: 'g3', name: 'Giorno 3', color: 'gold',
      exercises: [
        { id: 'spalle', name: 'Spalle Multipower / panca al rack', sets: 5, reps: 5, kg: 14, note: 'Carico indicato in scheda: 14/12' },
        { id: 'alzate', name: 'Alzate laterali', sets: 5, reps: 12, kg: 6 },
        { id: 'rowlarga', name: 'Row presa larga', sets: 5, reps: 12, kg: 50 },
        { id: 'schiena', name: 'Schiena', sets: null, reps: null, kg: null }
      ]
    }
  ];

  return { cats, food, toppings, diet, workouts };
})();
