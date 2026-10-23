# Deploy su Render e migrare MongoDB

Il progetto è configurato come due servizi Render: frontend React statico e API FastAPI. Utenti, password (in forma hash), strumenti, destinazioni e movimenti vivono in MongoDB e vanno trasferiti separatamente; non sono contenuti nel codice.

## 1. Backup dei dati attuali

Prima di cambiare database, esegui il dump dal computer/ambiente che raggiunge il MongoDB attuale. Avendo `mongodump` installato, dalla cartella del progetto:

```bash
set -a
source backend/.env
set +a
mongodump --uri="$MONGO_URL" --db="$DB_NAME" --archive=inventory.archive.gz --gzip
```

Conserva `inventory.archive.gz` in un luogo privato e sicuro; non aggiungerlo a Git. L'archivio include tutte le collection del database, compresi gli hash delle password. Chi si registra con email e password potrà usare le stesse credenziali dopo la migrazione. Cambiare `JWT_SECRET` invalida i token di accesso già emessi, ma non le password.

## 2. Creare MongoDB Atlas

1. Crea un progetto e un cluster su [MongoDB Atlas](https://www.mongodb.com/atlas).
2. In **Database Access**, crea un utente database con password robusta e permessi di lettura/scrittura sul database dell'app.
3. In **Network Access**, autorizza la connessione del servizio Render. Se non hai un IP di uscita Render statico, Atlas richiede normalmente `0.0.0.0/0`; limita il rischio usando un utente dedicato, una password forte e i permessi minimi.
4. Premi **Connect**, scegli **Drivers** e copia la connection string `mongodb+srv://...`. Sostituisci i segnaposto con l'utente e la password; codifica i caratteri speciali della password secondo URL encoding.
5. Ripristina l'archivio nel cluster usando la connection string Atlas impostata localmente come `ATLAS_MONGO_URL` (non inserirla nei file del progetto):

```bash
mongorestore --uri="$ATLAS_MONGO_URL" --archive=inventory.archive.gz --gzip
```

La connection string deve puntare allo stesso database indicato da `DB_NAME` nell'ambiente attuale. Non avviare il sito sul database vuoto se vuoi conservare gli account e i dati esistenti.

## 3. Pubblicare su Render

1. Pubblica il repository su GitHub dopo aver verificato che i file `.env` e l'archivio non siano inclusi. Render legge `render.yaml` dalla radice.
2. Su Render scegli **New + → Blueprint**, collega il repository e conferma la creazione dei servizi.
3. Quando richiesto, configura per `metrology-lab-api`:
   - `MONGO_URL`: connection string di Atlas.
   - `DB_NAME`: il nome esatto del database migrato.
   - `JWT_SECRET`: un nuovo segreto casuale lungo, generato ad esempio con `python -c 'import secrets; print(secrets.token_urlsafe(48))'`.
   - `CORS_ORIGINS`: l'origine esatta del sito Render, ad esempio `https://metrology-lab-web.onrender.com` (senza slash finale). Se Render assegna un hostname diverso, usa quello effettivo.
4. Il frontend riceve l'hostname del servizio API dal Blueprint. Aspetta che entrambi i servizi risultino **Live**, poi visita l'URL del frontend e prova l'accesso con un account già esistente.
5. Se hai impostato `CORS_ORIGINS` prima di conoscere l'URL effettivo del frontend, aggiornalo nelle variabili del servizio API e fai un nuovo deploy.

I valori `MONGO_URL` e `JWT_SECRET` vanno inseriti nelle **Environment Variables** di Render, mai nel repository o in `render.yaml`. Non riutilizzare una chiave segreta pubblicata nel codice o nella cronologia Git; gli account rimangono gli stessi, ma il cambio chiave richiede agli utenti di autenticarsi di nuovo.

## Attenzioni

- Non condividere il dump: contiene dati personali e credenziali sotto forma di hash.
- L'accesso Google usa un provider esterno già presente nel codice; il suo flusso e gli URL di callback potrebbero richiedere una configurazione separata per il nuovo dominio. Il login email/password usa invece gli account migrati.
- I file `.env` già presenti localmente restano sul computer e sono ignorati da Git. Se erano stati pubblicati in passato, ruota i segreti esposti e rimuovili anche dalla cronologia del repository.