// Ambient type for the generated API-data import. The JSON is produced by
// scripts/extract-api.ts at dev/build time and is gitignored, so this lets
// typechecking and editors resolve the import without the file present on a
// fresh checkout. When the file does exist, real module resolution wins.
declare module "*/api-data/symbols.gen.json" {
  const data: import("#/lib/api-data").ApiData;
  export default data;
}
