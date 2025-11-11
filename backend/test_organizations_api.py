#!/usr/bin/env python3
"""
Test script to verify organizations API returns unique organizations
"""
import requests

BACKEND_URL = "http://localhost:9010"

def test_organizations_endpoint():
    """Test the organizations endpoint"""
    print("🧪 Testing Organizations API...")
    print("=" * 60)

    try:
        response = requests.get(f"{BACKEND_URL}/v1/organizations")

        if response.status_code == 200:
            organizations = response.json()
            print(f"✅ Status: {response.status_code} OK")
            print(f"📊 Total organizations returned: {len(organizations)}")
            print()

            # Check for duplicates
            org_names = [org['org_name'] for org in organizations]
            unique_names = set(org_names)

            if len(org_names) == len(unique_names):
                print("✅ No duplicates found!")
            else:
                duplicates = [name for name in unique_names if org_names.count(name) > 1]
                print(f"⚠️  Duplicates found: {duplicates}")

            print()
            print("📋 Organizations List:")
            print("-" * 60)
            for org in organizations:
                print(f"  ID: {org['id']:2d} | {org['org_name']:20s} | Type: {org['org_type']}")

        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")

    except requests.exceptions.ConnectionError:
        print("❌ Error: Cannot connect to backend. Is it running?")
        print(f"   Make sure backend is running at {BACKEND_URL}")
    except Exception as e:
        print(f"❌ Error: {e}")

    print("=" * 60)

if __name__ == "__main__":
    test_organizations_endpoint()
