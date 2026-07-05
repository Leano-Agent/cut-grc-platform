#!/usr/bin/env python3
"""Fetch Railway deploy logs via GraphQL API."""
import urllib.request, json, sys

TOKEN = "04c7...YOUR_TOKEN"

def graphql(query, variables=None):
    data = {"query": query}
    if variables:
        data["variables"] = variables
    req = urllib.request.Request(
        "https://backboard.railway.app/graphql/v2",
        data=json.dumps(data).encode(),
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0"
        }
    )
    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"HTTP {e.code}: {body[:500]}")
        return None

# Get deployments for the project
query = """
{
  project(id: "fdf323a7-5500-4c0c-827f-504c680dfb44") {
    name
    services {
      edges {
        node {
          name
          deployments(last: 10) {
            edges {
              node {
                id
                status
                createdAt
                meta
              }
            }
          }
        }
      }
    }
  }
}
"""

result = graphql(query)
if result and "data" in result and result["data"]:
    project = result["data"]["project"]
    print(f"Project: {project['name']}")
    for svc in project["services"]["edges"]:
        svc_node = svc["node"]
        print(f"\n=== {svc_node['name']} ===")
        for dep in svc_node["deployments"]["edges"]:
            dep_node = dep["node"]
            meta = dep_node.get("meta", {}) or {}
            print(f"  {dep_node['id'][:12]} | {dep_node['status']:12s} | {dep_node['createdAt'][:19]} | {meta.get('commitMessage', 'N/A')[:60]}")
else:
    print("ERROR:", json.dumps(result, indent=2)[:1000] if result else "No result")
