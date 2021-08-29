try {
  const { files } = await Deno.emit("./static/main.ts");
  Object.entries(files)[0];
  // for (const [fileName, text] of Object.entries(files)) {
  //   console.log(`emitted ${fileName} with a length of ${text.length}`);
  // }
} catch (e) {
  // something went wrong, inspect `e` to determine
}
