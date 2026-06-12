import type { PullRequestDraft } from "@/lib/types";
import { insertPROutcome } from "@/services/clickhouse";

export function createIssue(input: { repo: string; title: string; body: string }) {
  return {
    id: `composio-issue-${input.title.length}`,
    repo: input.repo,
    title: input.title,
    body: input.body,
    provider: "Composio",
  };
}

export function commentOnIssue(input: { issueId: string; body: string }) {
  return {
    id: `composio-comment-${input.issueId}`,
    issueId: input.issueId,
    body: input.body,
    provider: "Composio",
  };
}

export function createPullRequest(input: PullRequestDraft) {
  insertPROutcome(input);
  return {
    ...input,
    provider: "Composio",
    action: "github.pull_request.create",
  };
}

export function updateSlackThread(input: { channel: string; threadTs: string; body: string }) {
  return {
    id: `composio-slack-${input.threadTs}`,
    channel: input.channel,
    threadTs: input.threadTs,
    body: input.body,
    provider: "Composio",
  };
}
