/**
 * Playable Shell — HTML Assembler
 *
 * Takes a PlayableDesignSpec + Engine → produces a complete, self-contained HTML file.
 * Zero LLM tokens. Pure procedural assembly.
 */
const logger = { log: (msg: string) => console.log("[PlayableShell]", msg) };
import { PlayableDesignSpec, resolveColors } from "./engines/engine.interface";
import { getEngine } from "./engines";

// logger replaced with console

/**
 * Assemble a complete playable ad HTML from design spec.
 */
export function assemblePlayable(spec: PlayableDesignSpec): string {
  const engine = getEngine(spec.gameType);
  const c = resolveColors(spec);

  const styles = engine.generateStyles(spec);
  const markup = engine.generateMarkup(spec);
  const init = engine.generateInit(spec);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html,body{width:100%;height:100%;overflow:hidden;touch-action:manipulation;-webkit-tap-highlight-color:transparent;font-family:system-ui,-apple-system,sans-serif;}
  body{
    display:flex;align-items:center;justify-content:center;
    background:${c.bg};
    color:${c.text};
    -webkit-user-select:none;user-select:none;
  }
  #playable-root{
    position:relative;
    width:100%;height:100%;
    overflow:hidden;
    background:${c.bg};
  }
  ${styles}
</style>
</head>
<body>
<div id="playable-root">
${markup}
</div>
<script>
${init}
</script>
</body>
</html>`;

  logger.log(`Assembled playable: ${engine.name} · ${spec.copy.headline} · ${html.length} chars`);
  return html;
}
