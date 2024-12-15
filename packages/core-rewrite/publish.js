const decoder = new TextDecoder("utf-8");
const data = await Deno.readFile("package.json");
const pkgJson = JSON.parse(decoder.decode(data));

pkgJson.version = (await getCommitId()).slice(0, 16);

await Deno.writeTextFile("package.json", JSON.stringify(pkgJson, null, 2));

async function getCommitId() {
  const process = Deno.run({
    cmd: ["git", "rev-parse", "HEAD"],
    stdout: "piped",
    stderr: "piped",
  });

  const output = await process.output();
  const commitId = new TextDecoder().decode(output).trim();

  process.close();

  return commitId;
}
