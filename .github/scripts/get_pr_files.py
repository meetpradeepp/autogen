#!/usr/bin/env python3
"""
get_pr_files.py

Fetches all changed files in the given PR, then prints each filename
along with its content at the PR’s HEAD SHA.
"""

import os
import sys
import json
from github import Github, GithubException

def main():
    # Read environment
    token = os.getenv("GITHUB_TOKEN")
    pr_number = os.getenv("PR_NUMBER")
    repo_full = os.getenv("REPO_FULL")  # e.g. "my-org/my-repo"
    head_sha = os.getenv("HEAD_SHA")

    if not token or not pr_number or not repo_full or not head_sha:
        print("Missing one of required environment variables: GITHUB_TOKEN, PR_NUMBER, REPO_FULL, HEAD_SHA")
        sys.exit(1)

    try:
        pr_num = int(pr_number)
    except ValueError:
        print(f"PR_NUMBER (‘{pr_number}’) is not an integer.")
        sys.exit(1)

    # 1) Authenticate
    gh = Github(token)
    try:
        repo = gh.get_repo(repo_full)
    except GithubException as e:
        print(f"❌ Failed to open repo {repo_full}: {e}")
        sys.exit(1)

    # 2) Fetch the Pull Request object
    try:
        pr = repo.get_pull(pr_num)
    except GithubException as e:
        print(f"❌ Failed to load PR #{pr_num}: {e}")
        sys.exit(1)

    # 3) List changed files (this is paginated under the hood, but PyGithub handles it).
    # Each `f` in pr.get_files() has attributes: filename, status, additions, deletions, changes, patch, blob_url, etc.
    changed_files = []
    try:
        for f in pr.get_files():
            # f.filename is a string like "src/app/foo.py" or "tests/AppA/test_xyz.yaml"
            changed_files.append(f.filename)
    except GithubException as e:
        print(f"❌ Error listing files for PR #{pr_num}: {e}")
        sys.exit(1)

    if not changed_files:
        print(f"No changed files detected in PR #{pr_num}. Exiting.")
        sys.exit(0)

    # 4) For each changed file, fetch its content at the PR’s HEAD SHA.
    #    We want the new version (i.e. the file as it exists on the PR’s branch at HEAD).
    #
    #    Use repo.get_contents(path, ref=head_sha).
    #    If a file was deleted in this PR, trying to get_contents() at HEAD_SHA will fail.
    #    So we’ll skip deleted files (status == "removed"), or catch 404s.
    #    PyGithub’s get_contents returns a ContentFile we can .decoded_content.
    #
    file_contents_map = {}
    for f in pr.get_files():
        filename = f.filename
        status = f.status  # e.g. "added", "modified", "removed", "renamed"
        if status == "removed":
            # No HEAD version to fetch.
            file_contents_map[filename] = None
            continue

        try:
            contents = repo.get_contents(filename, ref=head_sha)
            # contents.decoded_content is a bytes object.
            file_contents_map[filename] = contents.decoded_content.decode("utf-8", errors="replace")
        except GithubException as e:
            # Could be a 404 if file no longer exists (unlikely for "modified"/"added").
            print(f"⚠️  Skipping {filename}: cannot fetch content at {head_sha} ({e.status})")
            file_contents_map[filename] = None

    # 5) Print out a JSON blob to stdout (or you could write to a file).
    #    Format: [{ "filename": "...", "status": "...", "content": "..." }, …]
    output_list = []
    for f in pr.get_files():
        output_list.append({
            "filename": f.filename,
            "status": f.status,
            "patch": f.patch or "",  # the diff patch, if you want
            "content": file_contents_map.get(f.filename, ""),
        })

    # You can always switch to another format (e.g. tab-delimited). JSON is easiest to consume.
    print(json.dumps(output_list))

if __name__ == "__main__":
    main()
