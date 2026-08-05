// Opens a real pull request on the API's GitHub repo when breaking contract
// changes are detected. PAT-based (GITHUB_TOKEN with repo scope).

import { Octokit } from "@octokit/rest";

export type BreakingChange = {
  endpoint_path: string | null;
  method: string | null;
  target: string;
  summary: string;
};

function markdownBody(apiName: string, versionLabel: string, changes: BreakingChange[]) {
  const rows = changes
    .map(
      (c) =>
        `| \`${c.method ?? "—"}\` | \`${c.endpoint_path ?? "—"}\` | \`${c.target}\` | ${c.summary} |`,
    )
    .join("\n");
  return `## ⚠ Breaking API changes detected

**API:** ${apiName}
**Version:** ${versionLabel}
**Breaking changes:** ${changes.length}

| Method | Endpoint | Target | Summary |
| --- | --- | --- | --- |
${rows}

_Opened automatically by Invariant._
`;
}

export async function openBreakingChangePr(opts: {
  repo: string; // "owner/repo"
  apiName: string;
  versionLabel: string;
  changes: BreakingChange[];
}): Promise<{ url: string; number: number } | null> {
  const token = process.env["GITHUB_TOKEN"];
  if (!token) return null;
  const [owner, repo] = opts.repo.split("/");
  if (!owner || !repo) return null;

  const octokit = new Octokit({ auth: token });

  const { data: repoInfo } = await octokit.repos.get({ owner, repo });
  const base = repoInfo.default_branch;

  const { data: baseRef } = await octokit.git.getRef({ owner, repo, ref: `heads/${base}` });
  const branch = `invariant/breaking-change-${Math.floor(Date.now() / 1000)}`;
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branch}`,
    sha: baseRef.object.sha,
  });

  const body = markdownBody(opts.apiName, opts.versionLabel, opts.changes);

  let existingSha: string | undefined;
  try {
    const { data: existing } = await octokit.repos.getContent({
      owner,
      repo,
      path: "CONTRACT_CHANGES.md",
      ref: branch,
    });
    if (!Array.isArray(existing) && "sha" in existing) existingSha = existing.sha;
  } catch {
    /* file does not exist yet */
  }

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: "CONTRACT_CHANGES.md",
    branch,
    message: `chore(invariant): document breaking API changes for ${opts.apiName}`,
    content: Buffer.from(body, "utf8").toString("base64"),
    ...(existingSha ? { sha: existingSha } : {}),
  });

  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    base,
    head: branch,
    title: `⚠ Breaking API changes detected: ${opts.apiName}`,
    body,
  });

  return { url: pr.html_url, number: pr.number };
}
