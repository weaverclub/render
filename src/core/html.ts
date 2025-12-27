import { Effect } from "effect";
import type { CSS } from "./css/css";

export const mountHTML = ({ element, css, bundledScript }: MountHTMLArgs) =>
  Effect.sync(
    () =>
      `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Component Preview</title>
${css.map((style) => `<style>${style.compiledOutput}</style>`).join("\n")}
<style>
body { margin: 0; padding: 1rem; }
</style>
</head>
<body>
<div id="root">${element}</div>
${bundledScript ? `<script type="module">${bundledScript.replace(/<\/script>/gi, "<\\/script>")}</script>` : ""}
<script>
// HMR client for iframe
(function() {
  let ws;
  let reconnectAttempts = 0;

  function connect() {
    ws = new WebSocket('ws://' + location.host + '/__hmr');

    ws.onopen = function() {
      reconnectAttempts = 0;
    };

    ws.onmessage = function(event) {
      const data = JSON.parse(event.data);
      if (data.type === 'reload') {
        location.reload();
      }
    };

    ws.onclose = function() {
      if (reconnectAttempts < 10) {
        reconnectAttempts++;
        setTimeout(connect, 1000 * Math.min(reconnectAttempts, 5));
      }
    };

    ws.onerror = function() { ws.close(); };
  }

  connect();
})();
</script>
</body>
</html>
`
  );

type MountHTMLArgs = {
  element: string;
  css: CSS[];
  bundledScript?: string;
};
