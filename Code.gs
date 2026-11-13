/**
 * Salvataggio condiviso del viaggio in Perù, su Google Drive.
 *
 * Tiene un solo file (viaggio-peru.json) in una cartella del tuo Drive.
 * Il primo codice che salva "prenota" lo script: da quel momento accetta solo quel codice.
 */
const NOME_CARTELLA = 'Viaggio in Perù (salvataggio)';
const NOME_FILE = 'viaggio-peru.json';

function doGet() {
  return ContentService.createTextOutput('Salvataggio del viaggio in Perù: attivo');
}

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    const codice = String(req.code || '');
    if (codice.length < 16 || codice.length > 64) return risposta({ ok: false, error: 'codice non valido' });

    const p = PropertiesService.getScriptProperties();
    const salvato = p.getProperty('CODICE');
    if (salvato && salvato !== codice) return risposta({ ok: false, error: 'codice errato' });
    const versione = Number(p.getProperty('VERSIONE') || 0);

    if (req.action === 'ver') {
      return risposta({ ok: true, version: salvato ? versione : 0 });
    }

    if (req.action === 'get') {
      if (!salvato || !versione) return risposta({ ok: true, exists: false, version: 0 });
      return risposta({ ok: true, exists: true, version: versione, data: leggiDati() });
    }

    if (req.action === 'save') {
      const lock = LockService.getScriptLock();
      lock.waitLock(15000);
      try {
        const v = Number(p.getProperty('VERSIONE') || 0);
        const base = Number(req.base || 0);
        if (v > 0 && base !== v) {
          // Nel frattempo qualcuno ha salvato: non sovrascrivo, restituisco la versione più recente.
          return risposta({ ok: false, conflict: true, version: v, data: leggiDati() });
        }
        const testo = JSON.stringify(req.data);
        if (!testo || testo.length > 400000) return risposta({ ok: false, error: 'dati troppo grandi' });
        if (!salvato) p.setProperty('CODICE', codice);
        scriviFile(testo);
        p.setProperty('VERSIONE', String(v + 1));
        return risposta({ ok: true, version: v + 1 });
      } finally {
        lock.releaseLock();
      }
    }

    return risposta({ ok: false, error: 'azione sconosciuta' });
  } catch (err) {
    return risposta({ ok: false, error: String(err) });
  }
}

function leggiDati() {
  const id = PropertiesService.getScriptProperties().getProperty('FILE_ID');
  return JSON.parse(DriveApp.getFileById(id).getBlob().getDataAsString());
}

function scriviFile(testo) {
  const p = PropertiesService.getScriptProperties();
  const id = p.getProperty('FILE_ID');
  if (id) {
    DriveApp.getFileById(id).setContent(testo);
    return;
  }
  const cartelle = DriveApp.getFoldersByName(NOME_CARTELLA);
  const cartella = cartelle.hasNext() ? cartelle.next() : DriveApp.createFolder(NOME_CARTELLA);
  const file = cartella.createFile(NOME_FILE, testo, MimeType.PLAIN_TEXT);
  p.setProperty('FILE_ID', file.getId());
}

function risposta(oggetto) {
  return ContentService.createTextOutput(JSON.stringify(oggetto)).setMimeType(ContentService.MimeType.JSON);
}
