// Guarda o app no aparelho para funcionar sem internet. A versão muda a cada nova geração do app.
const VERSAO = "assistente-rm-d8f0676ad9";
const ARQUIVOS = ["./", "index.html", "seletor.html", "manifest.webmanifest",
                  "icones/icone-192.png", "icones/icone-512.png", "icones/icone-mascaravel-512.png",
                  "icones/apple-touch-icon.png"];

self.addEventListener("install", (ev) => {
  ev.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(caches.keys()
    .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO && n.startsWith("assistente-rm-")).map((n) => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (ev) => {
  const req = ev.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // fontes do Google: usa a cópia guardada e atualiza em segundo plano
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    ev.respondWith(caches.open(VERSAO + "-fontes").then((c) => c.match(req).then((guardada) => {
      const rede = fetch(req).then((r) => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => guardada);
      return guardada || rede;
    })));
    return;
  }
  if (url.origin !== self.location.origin) return;
  // arquivos do app: primeiro o que está guardado (funciona offline); páginas caem no index
  ev.respondWith(caches.match(req, { ignoreSearch: true }).then((guardada) =>
    guardada || fetch(req).catch(() => req.mode === "navigate" ? caches.match("index.html") : undefined)));
});
