#!/bin/bash
# V2 Embedding Pipeline Test
# Run this with: bash test-pipeline.sh
# Make sure the V2 server is running on port 3002 first.

BASE="http://localhost:3002/api"

echo "=== 1. Register a test user ==="
REGISTER=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@imc.dev","name":"Test Artist","password":"test1234"}')
echo "$REGISTER"

TOKEN=$(echo "$REGISTER" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  echo "Trying login instead (user may already exist)..."
  LOGIN=$(curl -s -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@imc.dev","password":"test1234"}')
  echo "$LOGIN"
  TOKEN=$(echo "$LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi
echo "Token: ${TOKEN:0:20}..."

echo ""
echo "=== 2. Create an artist identity ==="
ARTIST=$(curl -s -X POST "$BASE/artists" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Night Passenger","bio":"Making music about urban solitude"}')
echo "$ARTIST"

ARTIST_ID=$(echo "$ARTIST" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Artist ID: $ARTIST_ID"

echo ""
echo "=== 3. Add archive items ==="

echo "Adding lyric fragment..."
curl -s -X POST "$BASE/archive/$ARTIST_ID/items" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content_type": "text",
    "title": "Late night fragment",
    "raw_text": "waiting for someone who is not coming, the parking lot lights hum like a choir of ghosts"
  }' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  Item 1: {d[\"id\"][:8]}... - {d[\"title\"]}')" 2>/dev/null

echo "Adding another fragment..."
curl -s -X POST "$BASE/archive/$ARTIST_ID/items" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content_type": "text",
    "title": "Concrete hymn",
    "raw_text": "the overpass sings at 3am when no one is listening, concrete and steel vibrating with the weight of the city sleeping"
  }' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  Item 2: {d[\"id\"][:8]}... - {d[\"title\"]}')" 2>/dev/null

echo "Adding something different..."
curl -s -X POST "$BASE/archive/$ARTIST_ID/items" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content_type": "text",
    "title": "Summer memory",
    "raw_text": "dancing barefoot on warm sand, the ocean pulling at our ankles, laughing so hard we forgot to breathe"
  }' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  Item 3: {d[\"id\"][:8]}... - {d[\"title\"]}')" 2>/dev/null

echo ""
echo "=== 4. Wait for embeddings to generate ==="
sleep 3

echo ""
echo "=== 5. Search the archive ==="
echo "Query: 'urban isolation at night'"
curl -s "$BASE/archive/$ARTIST_ID/search?q=urban+isolation+at+night&limit=3" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
items = json.load(sys.stdin)
if isinstance(items, list):
    for i, item in enumerate(items):
        sim = item.get('similarity', 0)
        print(f'  {i+1}. {item[\"title\"]} (similarity: {sim:.4f})')
else:
    print('  Error:', items)
" 2>/dev/null

echo ""
echo "Query: 'joy and summer and ocean'"
curl -s "$BASE/archive/$ARTIST_ID/search?q=joy+and+summer+and+ocean&limit=3" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
items = json.load(sys.stdin)
if isinstance(items, list):
    for i, item in enumerate(items):
        sim = item.get('similarity', 0)
        print(f'  {i+1}. {item[\"title\"]} (similarity: {sim:.4f})')
else:
    print('  Error:', items)
" 2>/dev/null

echo ""
echo "=== Done ==="
