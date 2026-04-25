import json
import os
import psycopg2

SCHEMA = "t_p30280406_good_words_search_ru"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def handler(event: dict, context) -> dict:
    """Сохраняет нарушителя или возвращает список нарушителей."""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    method = event.get("httpMethod", "GET")

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        bad_word = body.get("bad_word", "")[:100]
        latitude = body.get("latitude")
        longitude = body.get("longitude")
        city = body.get("city", "Неизвестно")[:100]

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.violators (bad_word, latitude, longitude, city) VALUES (%s, %s, %s, %s)",
            (bad_word, latitude, longitude, city)
        )
        conn.commit()
        cur.close()
        conn.close()

        return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True})}

    if method == "GET":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, bad_word, latitude, longitude, city, created_at FROM {SCHEMA}.violators ORDER BY created_at DESC LIMIT 100"
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        result = [
            {
                "id": r[0],
                "bad_word": r[1],
                "latitude": r[2],
                "longitude": r[3],
                "city": r[4],
                "created_at": r[5].isoformat() if r[5] else None,
            }
            for r in rows
        ]
        return {"statusCode": 200, "headers": cors, "body": json.dumps(result, ensure_ascii=False)}

    return {"statusCode": 405, "headers": cors, "body": "Method Not Allowed"}
