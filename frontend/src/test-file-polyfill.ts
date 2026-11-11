// O jsdom não implementa Blob.arrayBuffer/text; os navegadores sim.
const read = (blob: Blob, as: "buffer" | "text") => new Promise<ArrayBuffer | string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as ArrayBuffer | string);
  reader.onerror = () => reject(reader.error);
  if (as === "buffer") reader.readAsArrayBuffer(blob); else reader.readAsText(blob);
});
if (typeof Blob !== "undefined" && !Blob.prototype.arrayBuffer) Blob.prototype.arrayBuffer = function () { return read(this, "buffer") as Promise<ArrayBuffer>; };
if (typeof Blob !== "undefined" && !Blob.prototype.text) Blob.prototype.text = function () { return read(this, "text") as Promise<string>; };
export {};
