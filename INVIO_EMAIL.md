# Invio automatico delle email (richieste di preventivo e informazioni)

Quando qualcuno compila il modulo nella home, il sito **salva la richiesta** (pagina «Richieste») e
**invia subito una email a labmet.malignani@gmail.com**. Se rispondi a quella email, la risposta arriva
direttamente a chi ha scritto.

Su Render (piano gratuito) le porte SMTP sono bloccate, quindi Gmail "normale" non funziona.
Si usa un servizio che invia le email via web: **Brevo** (gratis, 300 email al giorno).

## Configurazione (una volta sola, 5 minuti)

1. Vai su https://www.brevo.com e crea un account con **labmet.malignani@gmail.com**.
2. In Brevo: **Senders, domains & dedicated IPs → Senders → Add a sender**: inserisci
   `labmet.malignani@gmail.com`, Brevo manda un codice di conferma a quella casella: inseriscilo.
3. In Brevo: **SMTP & API → API Keys → Generate a new API key** (chiamala "sito"). Copia la chiave (inizia con `xkeysib-`).
4. Su Render apri il servizio **metrology-lab-api → Environment** e aggiungi:
   - `BREVO_API_KEY` = la chiave copiata
   - (facoltativo) `MAIL_TO` = indirizzo che riceve le richieste (se non lo metti è labmet.malignani@gmail.com)
   - (facoltativo) `MAIL_FROM` = mittente verificato in Brevo (se non lo metti è uguale a `MAIL_TO`)
5. Salva: Render riavvia da solo il servizio.
6. Prova: dalla home invia una richiesta di prova. Entro pochi secondi arriva la email (controlla anche lo Spam
   la prima volta). Nel sito, pagina **Richieste**, vedi «Email inviata» in verde.

Se vedi «Email non inviata» il motivo è scritto sotto la richiesta; dopo aver sistemato la configurazione premi **Riprova invio**.
Le richieste non si perdono mai: sono sempre salvate nel sito.

## Alternative
- `RESEND_API_KEY` (servizio Resend): funziona, ma senza dominio proprio può inviare solo all'indirizzo con cui ti sei registrato.
- `SMTP_USER` + `SMTP_PASSWORD` (password per app di Gmail): funziona solo se il server non blocca le porte SMTP (non su Render gratis).
