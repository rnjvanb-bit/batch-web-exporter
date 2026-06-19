let app, core, storage, action;
try {
  ({ app, core, action } = require("photoshop"));
  ({ storage } = require("uxp"));
} catch (e) {
  console.warn("Running outside Photoshop UXP runtime:", e.message);
}

document.getElementById("exportBtn").addEventListener("click", exportLayers);

async function exportLayers() {
  const format = document.getElementById("format").value;
  const scale = parseFloat(document.getElementById("scale").value);
  const visibleOnly = document.getElementById("visibleOnly").checked;
  const status = document.getElementById("status");

  try {
    const doc = app.activeDocument;
    if (!doc) {
      status.textContent = "No document open.";
      return;
    }

    status.textContent = "Picking folder...";
    const folder = await storage.localFileSystem.getFolder();
    if (!folder) {
      status.textContent = "No folder selected.";
      return;
    }

    const allLayers = doc.layers;
    const layers = visibleOnly ? allLayers.filter((l) => l.visible) : allLayers;

    if (layers.length === 0) {
      status.textContent = "No layers to export.";
      return;
    }

    status.textContent = `Exporting ${layers.length} layer(s)...`;

    let count = 0;
    for (const layer of layers) {
      try {
        const filename = `${sanitize(layer.name)}.${format}`;
        const file = await folder.createFile(filename, { overwrite: true });

        await core.executeAsModal(async () => {
          // Hide all layers except this one
          for (const l of allLayers) l.visible = false;
          layer.visible = true;

          // Use Export As via batchPlay
          const exportOptions = {
            _obj: "exportSelectionAsFileTypePressed",
            _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
            fileType: format === "jpg" ? "JPEG" : format.toUpperCase(),
            quality: 32,
            metadata: 0,
            destFolder: await folder.nativePath,
            sRGB: true,
            embedProfiles: true,
            exportAs: true,
          };

          await action.batchPlay([{
            _obj: "exportDocumentAs",
            documentExportOptions: {
              _obj: "documentExportOptions",
              exportAs: true,
              fileType: format === "jpg" ? "JPEG" : format.toUpperCase(),
              quality: 85,
              sRGB: true,
            },
            using: { _path: file.nativePath, _kind: "local" },
            _options: { dialogOptions: "dontDisplay" },
          }], {});

          // Restore visibility
          for (const l of allLayers) l.visible = true;
        }, { commandName: `Export ${layer.name}` });

        count++;
        status.textContent = `Exported ${count} of ${layers.length}...`;
      } catch (err) {
        status.textContent = `Error on "${layer.name}": ${err.message}`;
        console.error(err);
        // Restore all layers visible on error
        await core.executeAsModal(async () => {
          for (const l of allLayers) l.visible = true;
        }, { commandName: "Restore layers" });
      }
    }

    status.textContent = `Done. Exported ${count} of ${layers.length} layer(s).`;
  } catch (err) {
    status.textContent = `Error: ${err.message}`;
    console.error(err);
  }
}

function sanitize(name) {
  return name.replace(/[^a-z0-9_\-]/gi, "_").toLowerCase();
}
