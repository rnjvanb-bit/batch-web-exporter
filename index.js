const { app, core } = require("photoshop");
const { storage } = require("uxp");

document.getElementById("exportBtn").addEventListener("click", exportLayers);

async function exportLayers() {
  const format = document.getElementById("format").value;
  const scale = parseFloat(document.getElementById("scale").value);
  const visibleOnly = document.getElementById("visibleOnly").checked;
  const status = document.getElementById("status");

  const doc = app.activeDocument;
  if (!doc) {
    status.textContent = "No document open.";
    return;
  }

  const folder = await storage.localFileSystem.getFolder();
  if (!folder) return;

  const layers = visibleOnly
    ? doc.layers.filter((l) => l.visible)
    : doc.layers;

  status.textContent = `Exporting ${layers.length} layer(s)...`;

  let count = 0;
  for (const layer of layers) {
    try {
      await core.executeAsModal(async () => {
        const bounds = layer.bounds;
        const width = Math.round((bounds.right - bounds.left) * scale);
        const height = Math.round((bounds.bottom - bounds.top) * scale);

        const file = await folder.createFile(`${sanitize(layer.name)}.${format}`, { overwrite: true });

        await doc.saveAs.png(file, {
          compression: 6,
          interlaced: false,
        });
      });
      count++;
    } catch (err) {
      console.error(`Failed to export layer "${layer.name}": ${err.message}`);
    }
  }

  status.textContent = `Done. Exported ${count} of ${layers.length} layer(s).`;
}

function sanitize(name) {
  return name.replace(/[^a-z0-9_\-]/gi, "_").toLowerCase();
}
