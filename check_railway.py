#!/usr/bin/env python3
import urllib.request, json, sys

TOKEN = "04c734f6-d99d-4b85-b898-f45804bfacef"
PROJECT_ID = "fdf323a7-5500-4c0c-827f-504c680dfb44"

query = """
{
  project(id: "%s") {
    id
    name
    services {
      edges {
        node {
          id
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
""" % PROJECT_ID

req = urllib.request.Request(
    "https://backboard.railway.app/graphql/v2",
    data=json.dumps({"query": query}).encode(),
    headers={
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
)

resp = urllib.request.urlopen(req)
data = json.loads(resp.read())

if "errors" in data:
    print("ERRORS:", json.dumps(data["errors"], indent=2))
    sys.exit(1)

project = data["data"]["project"]
print(f"Project: {project['name']} (id: {project['id'][:8]}...)")
for svc in project["services"]["edges"]:
    svc_node = svc["node"]
    print(f"\n  Service: {svc_node['name']}")
    for dep in svc_node["deployments"]["edges"]:
        dep_node = dep["node"]
        meta = dep_node.get("meta", {})
        commit_msg = meta.get("commitMessage", "N/A") if meta else "N/A"
        status = dep_node["status"]
        created = dep_node["createdAt"][:19]
        dep_id = dep_node["id"][:8]
        print(f"    [{status:8s}] {created} | {dep_id}... | {commit_msg[:70]}")
